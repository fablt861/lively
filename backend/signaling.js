const { translateText } = require('./translate');

function setupSignaling(io, socket) {
    socket.on('offer', (payload) => {
        socket.to(socket.currentRoom).emit('offer', payload);
    });

    socket.on('answer', (payload) => {
        socket.to(socket.currentRoom).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload) => {
        socket.to(socket.currentRoom).emit('ice-candidate', payload);
    });

    socket.on('chat_message', async (message) => {
        if (!socket.currentRoom) return;

        const { filterMessage } = require('./moderation');
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();

        // 1. Fetch Blocklist
        const keywords = await redis.smembers('admin:blocklist:keywords') || [];

        // 2. Filter original message
        const sanitizedMessage = filterMessage(message, keywords);

        // 3. Translation logic
        const roomSockets = await io.in(socket.currentRoom).fetchSockets();
        const partnerSocket = roomSockets.find(s => s.id !== socket.id);
        const targetLang = partnerSocket ? (partnerSocket.language || 'en') : 'en';
        const sourceLang = socket.language || 'en';

        const normalizedTarget = targetLang.split('-')[0].toLowerCase();
        const normalizedSource = sourceLang.split('-')[0].toLowerCase();

        let translated = sanitizedMessage;
        if (normalizedTarget !== normalizedSource) {
            translated = await translateText(sanitizedMessage, targetLang);
            // Re-filter after translation just in case
            translated = filterMessage(translated, keywords);
        }

        // 4. Emit filtered message
        socket.to(socket.currentRoom).emit('chat_message', {
            senderId: socket.id,
            text: translated, 
            originalText: sanitizedMessage, 
            timestamp: Date.now()
        });
    });

    socket.on('request_block_session', (payload) => {
        if (!socket.currentRoom) return;
        socket.to(socket.currentRoom).emit('request_block_session', {
            senderId: socket.id,
            ...payload
        });
    });

    socket.on('respond_block_session', async (payload) => {
        if (!socket.currentRoom) return;
        
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();
        
        if (payload.accepted) {
            const { getSettings } = require('./settings');
            const settings = await getSettings();
            
            const duration = payload.durationMin || settings.blockDurationMin || 30;
            const blockData = {
                blockStartTime: Date.now(),
                blockEnd: Date.now() + duration * 60 * 1000,
                blockGain: settings.blockModelGain || 25,
                blockCreditsCost: payload.creditsCost || settings.blockCreditsCost || 600,
                blockDurationMin: duration,
                isBlocked: true
            };
            
            await redis.set(`billing:is_blocked:${socket.currentRoom}`, JSON.stringify(blockData), 'EX', 3600);
            
            // Notify both that the block has started officially
            io.in(socket.currentRoom).emit('block_session_started', {
                blockEnd: blockData.blockEnd,
                durationMin: duration
            });
        }
        
        socket.to(payload.requestorId).emit('respond_block_session', {
            senderId: socket.id,
            accepted: payload.accepted
        });
    });
}

module.exports = { setupSignaling };
