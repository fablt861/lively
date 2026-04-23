console.log("[STARTUP] Starting server at " + new Date().toISOString());
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { apiLimiter, authLimiter, paymentLimiter } = require('./security');

const allowedOrigins = [
  'https://staging.kinky.live',
  'https://www.staging.kinky.live',
  'https://livelyapp.vercel.app',
  process.env.STAGING_ORIGIN,
  process.env.CORS_ORIGIN,
  'https://www.kinky.live',
  'https://kinky.live',
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

const app = express();
app.use(cors(corsOptions));
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Diagnostic Logger for Production 404s
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

// Redis Adapter for multi-instance synchronization (essential for Render)
if (process.env.REDIS_URL) {
    const { createClient } = require('redis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('[Socket] Redis Adapter enabled successfully');
    }).catch(err => {
        console.error('[Socket] Redis Adapter failed to connect:', err);
    });
}

const { setupMatching, disconnectFromRoom } = require('./matching');
const { setupSignaling } = require('./signaling');
const { initBillingLoop, getModelStats } = require('./billing');
const { initSettings } = require('./settings');
app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '2026-04-22_v1_payout_split', timestamp: new Date().toISOString() });
});

// Load and mount routes
const adminRoutes = require('./admin');
const authRoutes = require('./auth');
const modelRoutes = require('./model');
const reportRoutes = require('./report');
const favoritesRoutes = require('./favorites');

// Initialize settings if empty
// ... (rest of existing logic)
initSettings();

// Start the billing interval
initBillingLoop(io);

// Registering Routes
app.use('/api', apiLimiter); // Protect all API routes

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/auth/add-credits', paymentLimiter);

app.use('/api/report', reportRoutes);
app.use('/api/favorites', favoritesRoutes);

app.use('/api/admin', adminRoutes(io));
app.use('/api/auth', authRoutes(io));
app.use('/api/elite', modelRoutes);

app.get('/api/video/token', async (req, res) => {
  const { room, identity } = req.query;
  if (!room || !identity) {
    return res.status(400).json({ error: 'Missing room or identity' });
  }

  try {
    const { AccessToken } = require('livekit-server-sdk');
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const at = new AccessToken(apiKey, apiSecret, { identity });
    at.addGrant({ 
      roomJoin: true, 
      room: room,
      canPublish: true,
      canSubscribe: true 
    });

    const token = await at.toJwt();
    res.json({ token });
  } catch (err) {
    console.error('Error generating LiveKit token:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.5', timestamp: Date.now() });
});

app.get('/api/settings', async (req, res) => {
  const { getSettings } = require('./settings');
  try {
    res.json(await getSettings());
  } catch (err) {
    res.status(500).json({ error: 'api.error.internal_server_error' });
  }
});

app.post('/api/stats/client', async (req, res) => {
  const { logNewClient } = require('./stats');
  try {
    await logNewClient();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'api.error.internal_server_error' });
  }
});

app.get('/api/elite/:id/stats', async (req, res) => {
  try {
    const stats = await getModelStats(req.params.id);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

io.on('connection', (socket) => {
  console.log('[Socket] New connection attempt:', socket.id, 'Origins:', socket.handshake.headers.origin);

  setupMatching(io, socket);
  setupSignaling(io, socket);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
