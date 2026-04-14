const { getRedisClient } = require('./redis');
const redis = getRedisClient();
const { startBilling, stopBilling } = require('./billing');
const { getSettings } = require('./settings');
const { markAsSeen } = require('./moderation');
const { hydrateUserCredits } = require('./balance');

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
        console.log(`[Queue] Received join_queue from ${socket.id}. Role: ${role}, Email: ${email}`);
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

            // Hydrate and Check Credits for Registered Users
            if (role === 'user' && email) {
                const credits = await hydrateUserCredits(email);
                if (credits <= 0) {
                    console.log(`[Limit] Registered User ${email} has 0 credits.`);
                    return socket.emit('out_of_credits', { reason: 'balance_exhausted' });
                }
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
            await disconnectFromRoom(io, socket, role + '_rejoin');
            await handleJoinQueue(io, socket);
            await updateQueuePositions(io, role);
        } finally {
            isProcessing = false;
        }
    });

    socket.on('out_of_credits', async () => {
        console.log(`Socket ${socket.id} ran out of credits`);
        await redis.lrem(QUEUE_USERS, 0, socket.id);
        await disconnectFromRoom(io, socket, 'balance_exhausted');
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
            } else {
                await redis.lrem(QUEUE_USERS, 0, socket.id);
            }

            await disconnectFromRoom(io, socket, socket.role + '_next');
            await handleJoinQueue(io, socket);
            await updateQueuePositions(io, socket.role);
        } finally {
            isProcessing = false;
        }
    });

    socket.on('stop', async () => {
        if (isProcessing) return;
        isProcessing = true;
        try {
            console.log(`Socket ${socket.id} called stop`);
            await disconnectFromRoom(io, socket, socket.role + '_stop');
        } finally {
            isProcessing = false;
        }
    });

    socket.on('disconnect', async () => {
        // Remove from queue
        // NOTE: We do NOT call stopBilling here to allow for the 20s grace period recovery
        // However, we still need to clear queue position. 
        // Real stopBilling happens via billing loop timeout or manual disconnectFromRoom.
        
        console.log(`Socket ${socket.id} disconnected`);
        if (socket.role === 'model') {
            await redis.lrem(QUEUE_MODELS, 0, socket.id);
        } else if (socket.role === 'user') {
            await redis.lrem(QUEUE_USERS, 0, socket.id);
        }
        
        // --- NEW: If no recovery happens, the billing loop will catch it. ---
        // But if we want it to be immediate for things like 'Next' (which calls disconnectFromRoom already), it's fine.
        // For actual DROPS, we'll let the billing loop handle it to preserve session recovery.
        
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
    const rawSocketIds = await redis.lrange(queueKey, 0, -1);
    
    // Filter out stale sockets and clean Redis
    const activeSocketIds = [];
    for (const sId of rawSocketIds) {
        if (io.sockets.sockets.has(sId)) {
            activeSocketIds.push(sId);
        } else {
            console.log(`[Queue Cleanup] Removing stale socket ${sId} from ${queueKey}`);
            await redis.lrem(queueKey, 0, sId);
        }
    }

    // Emit corrected positions [tail = pos 1, head = pos len]
    for (let i = 0; i < activeSocketIds.length; i++) {
        const s = io.sockets.sockets.get(activeSocketIds[i]);
        if (s) {
            s.emit('queue_update', { position: activeSocketIds.length - i });
        }
    }
}

async function handleJoinQueue(io, socket) {
    const myIdentifier = (socket.userEmail || `${socket.role}:${socket.userIp || 'unknown'}`).toLowerCase();
    const isModel = socket.role === 'model';
    const myQueue = isModel ? QUEUE_MODELS : QUEUE_USERS;
    const targetQueue = isModel ? QUEUE_USERS : QUEUE_MODELS;

    try {
        if (socket.currentRoom) return;

        // --- RECOVERY ATTEMPT ---
        const existingRoomId = await redis.get(`user_active_room:${myIdentifier}`);
        if (existingRoomId) {
            const roomDataStr = await redis.hget('billing:active_rooms', existingRoomId);
            if (roomDataStr) {
                const roomData = JSON.parse(roomDataStr);
                console.log(`[Recovery] Found active room ${existingRoomId} for ${myIdentifier}. Reconnecting...`);
                
                await socket.join(existingRoomId);
                socket.currentRoom = existingRoomId;
                
                const isModel = socket.role === 'model';
                const partnerEmail = isModel ? roomData.userId : roomData.modelId;

                if (isModel) {
                    roomData.modelSocketId = socket.id;
                } else {
                    roomData.userSocketId = socket.id;
                }
                await redis.hset('billing:active_rooms', existingRoomId, JSON.stringify(roomData));

                // Check if this room was in a private session
                const blockDataRaw = await redis.get(`billing:is_blocked:${existingRoomId}`);
                const blockData = blockDataRaw ? JSON.parse(blockDataRaw) : null;

                socket.emit('matched', {
                    roomId: existingRoomId,
                    initiator: socket.id,
                    isRecovery: true,
                    partnerEmail: partnerEmail,
                    partnerRole: isModel ? 'user' : 'model',
                    partnerName: partnerEmail.includes('@') ? partnerEmail.split('@')[0] : 'Partner',
                    isBlocked: !!blockData,
                    blockEnd: blockData?.blockEnd,
                    blockDurationMin: blockData?.blockDurationMin
                });
                
                socket.to(existingRoomId).emit('partner_reconnected', {
                    socketId: socket.id,
                    role: socket.role
                });
                return;
            }
        }

        console.log(`[Queue] ${socket.id} (${socket.role}) searching for partner in ${targetQueue}...`);
    
    let partnerId = null;
    let foundPartner = false;
    let maxRetries = 10;

    while (maxRetries > 0) {
        // Anti-Rebound Search: get all candidates (limit to first 30 for performance)
        const candidates = await redis.lrange(targetQueue, -30, -1);
        console.log(`[Queue] Found ${candidates.length} candidates in ${targetQueue}`);
        
        let targetIndex = -1;
        for (let i = candidates.length - 1; i >= 0; i--) {
             const cId = candidates[i];
             const cSocket = io.sockets.sockets.get(cId);
             if (!cSocket) {
                 console.log(`[Queue Trace] Candidate ${cId} is offline. Skipping.`);
                 continue;
             }

             const cRole = cSocket.role || (targetQueue === QUEUE_MODELS ? 'model' : 'user');
             const cIdentifier = (cSocket.userEmail || `${cRole}:${cSocket.userIp || 'unknown'}`).toLowerCase();
             const alreadySeen = await redis.get(`seen:${myIdentifier.toLowerCase()}:${cIdentifier.toLowerCase()}`);
             
             console.log(`[Queue Trace] Checking candidate ${cId} (${cIdentifier}). Seen: ${!!alreadySeen}`);
             
             if (!alreadySeen) {
                 console.log(`[Matching] Found candidate ${cId} (${cIdentifier}). Not seen yet.`);
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

            // Validate that the chosen partner is still online before removing
            const pSocket = io.sockets.sockets.get(chosenId);
            if (!pSocket) {
                console.log(`[Match Cleanup] Removing stale candidate ${chosenId} from ${targetQueue}`);
                await redis.lrem(targetQueue, 0, chosenId);
                maxRetries--;
                continue;
            }

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
            const pIdentifier = (partnerSocket.userEmail || partnerSocket.userIp || partnerSocket.id).toLowerCase();
            const myIdentifierSorted = [myIdentifier.toLowerCase(), pIdentifier].sort();
            const roomId = `room_${myIdentifierSorted[0]}_${myIdentifierSorted[1]}_${Date.now()}`;
            
            console.log(`[Match SUCCESS] ${socket.id} <-> ${partnerId}. Deterministic Room ${roomId}`);

            await socket.join(roomId);
            socket.currentRoom = roomId;

            await partnerSocket.join(roomId);
            partnerSocket.currentRoom = roomId;

            // --- NEW: Mark as seen to avoid immediate rematching after hangup ---
            if (myIdentifier && pIdentifier) {
                // Reduced cooldown to 5s for easier testing and staging use
                await redis.set(`seen:${myIdentifier.toLowerCase()}:${pIdentifier.toLowerCase()}`, '1', 'EX', 5);
                await redis.set(`seen:${pIdentifier.toLowerCase()}:${myIdentifier.toLowerCase()}`, '1', 'EX', 5);
            }

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

            console.log(`[Match EMITTED] ${socket.id} <-> ${partnerId}`);
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
            console.log(`[Queue Trace] No partner found for ${socket.id}. Adding to my queue: ${myQueue}`);
            // ENSURE UNIQUENESS: Remove existing instances of this socket before pushing
            await redis.lrem(myQueue, 0, socket.id);
            await redis.lpush(myQueue, socket.id);
            
            const modelsCount = await redis.llen(QUEUE_MODELS);
            const usersCount = await redis.llen(QUEUE_USERS);
            console.log(`[Queue Status] Models: ${modelsCount}, Users: ${usersCount}. Socket ${socket.id} is waiting.`);
            socket.emit('waiting', { status: 'waiting for partner', position: isModel ? modelsCount : usersCount }); 
        }
    } catch (err) {
        console.error(`[Queue Error] Crash in handleJoinQueue for ${socket.id}:`, err);
    }
}

async function disconnectFromRoom(io, socket, reason = 'unknown') {
    if (socket.currentRoom) {
        const roomId = socket.currentRoom;
        
        // --- NEW: Capture private session status BEFORE cleanup ---
        const blockDataRaw = await redis.get(`billing:is_blocked:${roomId}`);

        // Find partner socket ID before we clear anything
        const roomDataStr = await redis.hget('billing:active_rooms', roomId);
        let partnerSocket = null;
        if (roomDataStr) {
            const roomData = JSON.parse(roomDataStr);
            const partnerSocketId = socket.id === roomData.userSocketId ? roomData.modelSocketId : roomData.userSocketId;
            if (partnerSocketId) {
                partnerSocket = io.sockets.sockets.get(partnerSocketId);
            }
        }

        // Stop billing for this room - this emits private_session_summary if needed
        // Note: stopBilling will delete the billing:is_blocked key
        await stopBilling(roomId, reason);

        // Notify the room that a partner left
        socket.to(roomId).emit('partner_left', { reason });

        socket.leave(roomId);
        socket.currentRoom = null;

        // --- NEW: Automatically put the partner back in the queue ---
        // UNLESS it was a private session! We want the model to see their report first.
        if (partnerSocket) {
            if (blockDataRaw) {
                console.log(`[Auto-Next] Gating auto-requeue for partner ${partnerSocket.id} (Private Session detected)`);
                partnerSocket.leave(roomId);
                partnerSocket.currentRoom = null;
                // Partner (model) will call handleJoinQueue themselves when they close the summary modal
            } else {
                console.log(`[Auto-Next] Re-queueing partner ${partnerSocket.id} after disconnect by ${socket.id}`);
                partnerSocket.leave(roomId);
                partnerSocket.currentRoom = null;
                await handleJoinQueue(io, partnerSocket);
            }
        }
    }
}

module.exports = { setupMatching, handleJoinQueue, disconnectFromRoom };
