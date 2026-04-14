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

    socket.on('direct_call_request', async (payload) => {
        const { targetEmail, userEmail, userPseudo } = payload;
        const { getRedisClient } = require('./redis');
        const redis = getRedisClient();

        // 1. Verify Credits (min 150 for direct call)
        const { hydrateUserCredits } = require('./balance');
        const currentCredits = await hydrateUserCredits(userEmail);
        if (currentCredits < 150) {
            return socket.emit('direct_call_error', { reason: 'insufficient_credits' });
        }

        // 2. Find Model Socket
        const modelSocketId = await redis.get(`user_socket:${targetEmail.toLowerCase()}`);
        if (!modelSocketId) {
            return socket.emit('direct_call_error', { reason: 'offline' });
        }

        // 3. Notify Model (via their personal email room to reach all tabs/components)
        io.to(`email:${targetEmail.toLowerCase()}`).emit('direct_call_incoming', {
            requestorEmail: userEmail,
            requestorPseudo: userPseudo,
            requestorSocketId: socket.id
        });
    });

    socket.on('direct_call_response', async (payload) => {
        const { requestorSocketId, accepted, modelEmail, requestorEmail } = payload;
        
        if (accepted) {
            // Create a custom private room name
            const roomId = `direct-call-${Date.now()}`;
            
            // Notify both to join this room
            // Client gets it via their socket (requestorSocketId). They are the INTITIATOR.
            io.to(requestorSocketId).emit('direct_call_accepted', { roomId, modelEmail, initiatorRole: 'user' });
            // Model gets it via their personal email room. They are NOT the initiator.
            io.to(`email:${modelEmail.toLowerCase()}`).emit('direct_call_accepted', { roomId, requestorEmail: requestorEmail, initiatorRole: 'user' });
        } else {
            io.to(requestorSocketId).emit('direct_call_rejected', { reason: 'busy' });
        }
    });
}

module.exports = { setupSignaling };
