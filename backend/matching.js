const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const { startBilling, stopBilling } = require('./billing');
const { logNewUser, logNewModel } = require('./stats');

redis.on('error', (err) => {
    console.error('[Redis Error] Could not connect. Is Redis running?', err.message);
});

const QUEUE_MODELS = 'queue:models';
const QUEUE_USERS = 'queue:users';

function setupMatching(io, socket) {
    let isProcessing = false;

    // Join role queue
    socket.on('join_queue', async ({ role, language }) => {
        if (isProcessing) return;
        isProcessing = true;
        try {
            socket.role = role;
            socket.language = language || 'en'; // Par défaut anglais

            const isNew = await redis.set(`has_joined:${socket.id}`, '1', 'NX', 'EX', 86400);
            if (isNew) {
                if (role === 'user') await logNewUser();
                if (role === 'model') await logNewModel();
            }
            await redis.lrem(role === 'model' ? QUEUE_MODELS : QUEUE_USERS, 0, socket.id);
            await disconnectFromRoom(socket);
            await handleJoinQueue(io, socket);
        } finally {
            isProcessing = false;
        }
    });

    socket.on('out_of_credits', async () => {
        console.log(`Socket ${socket.id} ran out of credits`);
        await redis.lrem(QUEUE_USERS, 0, socket.id);
        await disconnectFromRoom(socket);
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
    });
}

async function handleJoinQueue(io, socket) {
    const isModel = socket.role === 'model';
    const myQueue = isModel ? QUEUE_MODELS : QUEUE_USERS;
    const targetQueue = isModel ? QUEUE_USERS : QUEUE_MODELS;

    // Atomic queue operations
    // Pop a partner from the target queue
    const partnerId = await redis.rpop(targetQueue);

    if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);

        if (partnerSocket) {
            // Create a unique room ID
            const roomId = `room_${socket.id}_${partnerId}`;

            // Both sockets join the room
            socket.join(roomId);
            socket.currentRoom = roomId;

            partnerSocket.join(roomId);
            partnerSocket.currentRoom = roomId;

            const userId = isModel ? partnerId : socket.id;
            const modelId = isModel ? socket.id : partnerId;
            await startBilling(roomId, userId, modelId);

            // Notify both parties. One is designated as the initiator to create the RTC Offer.
            console.log(`Matched ${socket.id} with ${partnerId} in ${roomId}`);
            io.to(roomId).emit('matched', { roomId, initiator: socket.id });
        } else {
            // Stale ID, partner disconnected in the meantime. Try again.
            await handleJoinQueue(io, socket);
        }
    } else {
        // No partner in queue, push to own queue and wait
        await redis.lpush(myQueue, socket.id);
        socket.emit('waiting', { status: 'waiting for partner' });
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
