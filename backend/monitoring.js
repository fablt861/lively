// [FORCE DEPLOY] 2026-04-24T14:55:00Z - Admin Sync
const express = require('express');
const path = require('path');
const fs = require('fs');
const { getRedisClient } = require('./redis');

const router = express.Router();
const SNAPSHOTS_DIR = path.join(__dirname, 'data/monitoring_snapshots');

// Ensure directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

module.exports = (io) => {
    const redis = getRedisClient();
    const MOCK_TOKEN = process.env.ADMIN_TOKEN_SECRET || 'secret-admin-token-xyz';

    // Middleware: Admin Auth
    const requireAdmin = (req, res, next) => {
        const token = req.headers.authorization || (req.query.token ? `Bearer ${req.query.token}` : '');
        if (token === `Bearer ${MOCK_TOKEN}`) {
            next();
        } else {
            res.status(401).json({ error: 'admin.error.unauthorized' });
        }
    };

    // --- MODEL ENDPOINT ---

    /**
     * POST /api/admin/monitoring/snapshot
     * Models send their camera frames here.
     * We use /api/admin prefix but we allow model tokens or ID verification.
     * For now, simple verification via modelId.
     */
    router.post('/snapshot', async (req, res) => {
        const { modelId, image } = req.body; // image is Base64
        if (!modelId || !image) {
            return res.status(400).json({ error: 'Missing modelId or image' });
        }

        try {
            // Remove Base64 prefix
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
            const filePath = path.join(SNAPSHOTS_DIR, `model_${modelId}.jpg`);
            
            fs.writeFileSync(filePath, base64Data, 'base64');
            
            // Log timestamp in Redis for dashboard refresh detection
            await redis.set(`monitoring:last_snapshot:${modelId}`, Date.now(), 'EX', 60);

            res.json({ success: true });
        } catch (err) {
            console.error('[Monitoring] Snapshot save error:', err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // --- ADMIN ENDPOINTS ---

    /**
     * GET /api/admin/monitoring/active-rooms
     * Returns all active video rooms with metadata.
     */
    router.get('/active-rooms', requireAdmin, async (req, res) => {
        try {
            const rooms = await redis.hgetall('billing:active_rooms');
            const result = [];

            for (const roomId in rooms) {
                const session = JSON.parse(rooms[roomId]);
                
                // Fetch pseudos for display
                const modelPseudo = await redis.hget(`profile:${session.modelId}`, 'pseudo') || 'Model';
                const userPseudo = await redis.hget(`profile:${session.userId}`, 'pseudo') || 'User';
                const lastSnap = await redis.get(`monitoring:last_snapshot:${session.modelId}`);

                result.push({
                    roomId,
                    modelId: session.modelId,
                    userId: session.userId,
                    modelPseudo,
                    userPseudo,
                    startTime: session.startTime,
                    isStarted: session.isStarted,
                    earnedUsd: session.earnedUsd,
                    userCountryCode: session.userCountryCode,
                    lastSnapshotAt: lastSnap ? parseInt(lastSnap) : null
                });
            }

            res.json(result);
        } catch (err) {
            console.error('[Monitoring] Active rooms fetch error:', err.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    /**
     * GET /api/admin/monitoring/image/:modelId
     * Serves the latest snapshot for a model.
     */
    router.get('/image/:modelId', requireAdmin, (req, res) => {
        const { modelId } = req.params;
        const filePath = path.join(SNAPSHOTS_DIR, `model_${modelId}.jpg`);

        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ error: 'Snapshot not found' });
        }
    });

    return router;
};
