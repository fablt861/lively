const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

const { setupMatching } = require('./matching');
const { setupSignaling } = require('./signaling');
const { initBillingLoop, getModelStats } = require('./billing');
const { initSettings } = require('./settings');
const adminRoutes = require('./admin');
const authRoutes = require('./auth');

// Initialize settings if empty
console.log('--- Starting startup sequence ---');
initSettings();

// Start the billing interval
console.log('=> Starting billing loop...');
initBillingLoop();
console.log('=> Billing loop started.');

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/settings', async (req, res) => {
  const { getSettings } = require('./settings');
  try {
    res.json(await getSettings());
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/stats/client', async (req, res) => {
  const { logNewClient } = require('./stats');
  try {
    await logNewClient();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/model/:id/stats', async (req, res) => {
  try {
    const stats = await getModelStats(req.params.id);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
