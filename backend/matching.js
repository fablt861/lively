const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const { startBilling, stopBilling } = require('./billing');

redis.on('error', (err) => {
    console.error('[Redis Error] Could not connect. Is Redis running?', err.message);
});

const QUEUE_MODELS = 'queue:models';
const QUEUE_USERS = 'queue:users';

function setupMatching(io, socket) {
    let isProcessing = false;

    // Join role queue
    socket.on('join_queue', async ({ role, language, email }) => {
        if (isProcessing) return;
        isProcessing = true;
        try {
            socket.role = role;
            socket.language = language || 'en';
            socket.userEmail = email; // Persistent ID for registered users

            // Get IP for guest tracking
            const userIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
            socket.userIp = userIp;

            console.log(`[Queue] Socket ${socket.id} joined as ${role}. IP: ${userIp}, Email: ${email}`);

            // If Guest: check free limit (60s)
            if (role === 'user' && !email) {
                const freeUsed = await redis.get(`free_secs:${userIp}`) || 0;
                if (parseInt(freeUsed) >= 60) {
                    console.log(`[Limit] IP ${userIp} reached free guest limit (60s).`);
                    return socket.emit('out_of_credits', { reason: 'guest_limit_reached' });
                }
            }

            const isNew = await redis.set(`has_joined:${socket.id}`, '1', 'NX', 'EX', 86400);
            await redis.lrem(role === 'model' ? QUEUE_MODELS : QUEUE_USERS, 0, socket.id);
            await disconnectFromRoom(socket);
            await handleJoinQueue(io, socket);
            await updateQueuePositions(io, role);
        } finally {
            isProcessing = false;
        }
    });

    socket.on('out_of_credits', async () => {
        console.log(`Socket ${socket.id} ran out of credits`);
        await redis.lrem(QUEUE_USERS, 0, socket.id);
        await disconnectFromRoom(socket);
        await updateQueuePositions(io, 'user');
    });

    socket.on('next', async () => {
        if (isProcessing) return;
        isProcessing = true;
        try {
            console.log(`Socket ${socket.id} called next`);
            if (socket.role === 'model') {
                await redis.lrem(QUEUE_MODELS, 0, socket.id);
            } else if (socket.role === 'user') {
                await redis.lrem(QUEUE_USERS, 0, socket.id);
            }
            await disconnectFromRoom(socket);
            await handleJoinQueue(io, socket);
            await updateQueuePositions(io, socket.role);
        } finally {
            isProcessing = false;
        }
    });

    socket.on('disconnect', async () => {
        // Remove from queue
        if (socket.role === 'model') {
            await redis.lrem(QUEUE_MODELS, 0, socket.id);
        } else if (socket.role === 'user') {
            await redis.lrem(QUEUE_USERS, 0, socket.id);
        }
        await disconnectFromRoom(socket);
        await updateQueuePositions(io, socket.role);
    });
}

async function updateQueuePositions(io, role) {
    if (!role) return;
    const queueKey = role === 'model' ? QUEUE_MODELS : QUEUE_USERS;
    const socketIds = await redis.lrange(queueKey, 0, -1);
    // Redis list [head ... tail]. Tail (last) is position 1.
    for (let i = 0; i < socketIds.length; i++) {
        const sId = socketIds[i];
        const s = io.sockets.sockets.get(sId);
        if (s) {
            s.emit('queue_update', { position: socketIds.length - i });
        }
    }
}

async function handleJoinQueue(io, socket) {
    const isModel = socket.role === 'model';
    const myQueue = isModel ? QUEUE_MODELS : QUEUE_USERS;
    const targetQueue = isModel ? QUEUE_USERS : QUEUE_MODELS;

    console.log(`[Match Attempt] Socket ${socket.id} (${socket.role}) searching in ${targetQueue}...`);

    let partnerId = null;
    let foundPartner = false;
    let maxRetries = 10;

    while (maxRetries > 0) {
        partnerId = await redis.rpop(targetQueue);
        if (!partnerId) break;

        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
            const roomId = `room_${socket.id}_${partnerId}`;
            console.log(`[Match SUCCESS] ${socket.id} <-> ${partnerId}. Joining room ${roomId}`);

            await socket.join(roomId);
            socket.currentRoom = roomId;

            await partnerSocket.join(roomId);
            partnerSocket.currentRoom = roomId;

            const userId = isModel ? partnerId : socket.id;
            const modelId = isModel ? socket.id : partnerId;

            // Pass billing ID: Email if registered, IP if guest
            const userBillingId = (isModel ? (partnerSocket.userEmail || partnerSocket.userIp) : (socket.userEmail || socket.userIp))?.toLowerCase();
            const modelBillingId = (isModel ? (socket.userEmail || socket.id) : (partnerSocket.userEmail || partnerId))?.toLowerCase();
            
            await startBilling(roomId, userBillingId, modelBillingId);

            io.to(roomId).emit('matched', { roomId, initiator: socket.id });
            foundPartner = true;
            // Update positions for the rest of the target queue
            await updateQueuePositions(io, isModel ? 'user' : 'model');
            break;
        } else {
            console.log(`[Match STALE] Partner ${partnerId} is offline. Cleaning up and retrying...`);
            maxRetries--;
        }
    }

    if (!foundPartner) {
        await redis.lpush(myQueue, socket.id);
        const modelsCount = await redis.llen(QUEUE_MODELS);
        const usersCount = await redis.llen(QUEUE_USERS);
        console.log(`[Queue Status] Models: ${modelsCount}, Users: ${usersCount}. Socket ${socket.id} is waiting.`);
        socket.emit('waiting', { status: 'waiting for partner', position: modelsCount || usersCount }); // Approximate
    }
}

async function disconnectFromRoom(socket) {
    if (socket.currentRoom) {
        // Notify the room that a partner left, so they can cleanly close the WebRTC connection
        socket.to(socket.currentRoom).emit('partner_left');

        // Stop billing for this room
        await stopBilling(socket.currentRoom);

        socket.leave(socket.currentRoom);
        socket.currentRoom = null;
    }
}

module.exports = { setupMatching, handleJoinQueue, disconnectFromRoom };
