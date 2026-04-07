const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const { startBilling, stopBilling } = require('./billing');
const { getSettings } = require('./settings');
const { markAsSeen } = require('./moderation');

redis.on('error', (err) => {
    console.error('[Redis Error] Could not connect. Is Redis running?', err.message);
});

const QUEUE_MODELS = 'queue:models';
const QUEUE_USERS = 'queue:users';
const RATE_LIMIT_COOLDOWN = 1.5; // seconds

async function checkRateLimit(identifier) {
    if (!identifier) return false;
    const key = `ratelimit:matching:${identifier.toLowerCase()}`;
    const result = await redis.set(key, '1', 'NX', 'EX', Math.ceil(RATE_LIMIT_COOLDOWN));
    return result === null; // true if rate limited (key already existed)
}

function setupMatching(io, socket) {
    let isProcessing = false;

    // Join role queue
    socket.on('join_queue', async ({ role, language, email }) => {
        if (isProcessing) return;
        isProcessing = true;
        try {
            // Check Maintenance & Launch Mode
            const settings = await getSettings();
            if (settings.maintenanceMode) {
                console.log(`[Maintenance] Blocking join_queue for ${socket.id} (${role})`);
                return socket.emit('maintenance_active');
            }
            if (settings.launchMode) {
                console.log(`[Launch] Blocking join_queue for ${socket.id} (${role})`);
                return socket.emit('launch_active');
            }

            socket.role = role;

            socket.language = language || 'en';
            socket.userEmail = email?.toLowerCase(); // Persistent ID for registered users

            // Get IP for guest tracking
            const userIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
            socket.userIp = userIp;

            console.log(`[Queue] Socket ${socket.id} joined as ${role}. IP: ${userIp}, Email: ${email}`);

            // Rate Limit Check (IP or Email)
            const identifier = email || userIp;
            if (await checkRateLimit(identifier)) {
                console.log(`[RateLimit] Throttling join_queue for ${identifier}`);
                return;
            }

            // If Guest: check free limit (30s)
            if (role === 'user' && !email) {
                const freeUsed = await redis.get(`free_secs:${userIp}`) || 0;
                if (parseInt(freeUsed) >= 30) {
                    console.log(`[Limit] IP ${userIp} reached free guest limit (30s).`);
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
        
        const identifier = socket.userEmail || socket.userIp;
        if (await checkRateLimit(identifier)) {
            console.log(`[RateLimit] Throttling next for ${identifier}`);
            return;
        }

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
        // NOTE: We do NOT call stopBilling here to allow for the 20s grace period recovery
        if (socket.role === 'model') {
            await redis.lrem(QUEUE_MODELS, 0, socket.id);
        } else if (socket.role === 'user') {
            await redis.lrem(QUEUE_USERS, 0, socket.id);
        }
        
        if (socket.currentRoom) {
            socket.to(socket.currentRoom).emit('partner_disconnected');
            socket.leave(socket.currentRoom);
            socket.currentRoom = null;
        }
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

    const myIdentifier = socket.userEmail || socket.userIp;

    // --- RECOVERY ATTEMPT ---
    const existingRoomId = await redis.get(`user_active_room:${myIdentifier.toLowerCase()}`);
    if (existingRoomId) {
        const roomDataStr = await redis.hget('billing:active_rooms', existingRoomId);
        if (roomDataStr) {
            const roomData = JSON.parse(roomDataStr);
            console.log(`[Recovery] Found active room ${existingRoomId} for ${myIdentifier}. Reconnecting...`);
            
            await socket.join(existingRoomId);
            socket.currentRoom = existingRoomId;
            
            const isModel = socket.role === 'model';
            const partnerEmail = isModel ? roomData.userId : roomData.modelId;

            // --- IMPORTANT: Update roomData with new socket ID and set as initiator ---
            if (isModel) {
                roomData.modelSocketId = socket.id;
            } else {
                roomData.userSocketId = socket.id;
            }
            // Update Redis with the new socket mapping
            await redis.hset('billing:active_rooms', existingRoomId, JSON.stringify(roomData));

            socket.emit('matched', {
                roomId: existingRoomId,
                initiator: socket.id, // Current socket is the one re-joining, let them initiate offer
                isRecovery: true,
                partnerEmail: partnerEmail,
                partnerRole: isModel ? 'user' : 'model',
                partnerName: partnerEmail.includes('@') ? partnerEmail.split('@')[0] : 'Partner',
                isBlocked: !!roomData.blockEnd,
                blockEndTime: roomData.blockEnd || null
            });
            
            // Notify the partner in the room
            socket.to(existingRoomId).emit('partner_reconnected', {
                socketId: socket.id,
                role: socket.role
            });
            return;
        }
    }
    // --- END RECOVERY ---
    
    let partnerId = null;
    let foundPartner = false;
    let maxRetries = 10;

    while (maxRetries > 0) {
        // Anti-Rebound Search: get all candidates (limit to first 30 for performance)
        const candidates = await redis.lrange(targetQueue, -30, -1); // FIFO order: tail is newest? No, LINDEX 0 is head. list is [head ... tail]. Tail is newest? No, lpush pushes to head.
        // Let's use standard list order: LPUSH to head, RPOP from tail. 
        // LINDEX tail (length -1) is the oldest.
        
        let targetIndex = -1;
        for (let i = candidates.length - 1; i >= 0; i--) {
             const cId = candidates[i];
             const cSocket = io.sockets.sockets.get(cId);
             if (!cSocket) continue;

             const cIdentifier = cSocket.userEmail || cSocket.userIp;
             const alreadySeen = await redis.get(`seen:${myIdentifier}:${cIdentifier}`);
             
             if (!alreadySeen) {
                 targetIndex = i;
                 break;
             }
        }

        // If all available candidates are "seen", fallback to the oldest one (tail)
        if (targetIndex === -1 && candidates.length > 0) {
            console.log(`[Match Cooldown] Everyone in queue (+${candidates.length}) already seen by ${myIdentifier}. Falling back to oldest.`);
            targetIndex = candidates.length - 1;
        }

        if (targetIndex !== -1) {
            const chosenId = candidates[targetIndex];
            // Remove exactly this ID from the queue
            const removedCount = await redis.lrem(targetQueue, 1, chosenId);
            if (removedCount > 0) {
                partnerId = chosenId;
            } else {
                // Someone else grabbed it or they left
                maxRetries--;
                continue;
            }
        } else {
            // Nothing in queue
            break;
        }

        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
            const roomId = `room_${[socket.id, partnerId].sort().join('_')}`;
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
            
            await startBilling(roomId, userBillingId, modelBillingId, isModel ? partnerId : socket.id, isModel ? socket.id : partnerId);

            // Notify both parties with partner info for reporting
            socket.emit('matched', { 
                roomId, 
                initiator: socket.id, 
                partnerEmail: partnerSocket.userEmail || partnerSocket.userIp, 
                partnerRole: partnerSocket.role,
                partnerName: partnerSocket.pseudo || partnerSocket.userEmail?.split('@')[0] || 'Partner'
            });
            partnerSocket.emit('matched', { 
                roomId, 
                initiator: socket.id, 
                partnerEmail: socket.userEmail || socket.userIp, 
                partnerRole: socket.role,
                partnerName: socket.pseudo || socket.userEmail?.split('@')[0] || 'Partner'
            });

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
