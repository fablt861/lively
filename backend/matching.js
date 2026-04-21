const { getRedisClient } = require('./redis');
const redis = getRedisClient();
const { startBilling, stopBilling, activateBilling } = require('./billing');
const { getSettings } = require('./settings');
const { markAsSeen } = require('./moderation');
const { hydrateUserCredits } = require('./balance');
const { query } = require('./db');
const geoip = require('geoip-lite');

// Constants
const QUEUE_MODELS = 'queue:models';
const QUEUE_USERS = 'queue:users';
const RATE_LIMIT_COOLDOWN = 2; // seconds

redis.on('error', (err) => {
    console.error('[Redis Error] Could not connect. Is Redis running?', err.message);
});

function getClientIp(socket) {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return socket.handshake.address;
}

async function resolvePseudo(id, role, emailFallback) {
    if (!id) return emailFallback ? emailFallback.split('@')[0] : 'Guest';
    
    // 1. Try Redis Cache by ID
    const cached = await redis.hget(`profile:${id}`, 'pseudo');
    if (cached) return cached;

    // 2. Try Database
    try {
        const table = role === 'model' ? 'models' : 'users';
        const res = await query(`SELECT pseudo, first_name, last_name, email FROM ${table} WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
            const user = res.rows[0];
            const pseudo = user.pseudo || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) || user.email.split('@')[0];
            
            // Sync Cave: Save to Redis for next time
            await redis.hset(`profile:${id}`, 'pseudo', pseudo);
            return pseudo;
        }
    } catch (err) {
        console.error('[resolvePseudo Error]', err);
    }

    return emailFallback ? emailFallback.split('@')[0] : 'Guest';
}

function detectCountry(socket) {
    try {
        // Handle proxies like Vercel/Render
        const forwarded = socket.handshake.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : socket.handshake.address;
        
        const geo = geoip.lookup(ip);
        if (geo && geo.country) {
            return geo.country;
        }
    } catch (err) {
        console.error('[GeoIP Error]', err.message);
    }
    return 'Unknown';
}

function detectCountry(socket) {
    try {
        // Handle proxies like Vercel/Render
        const forwarded = socket.handshake.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : socket.handshake.address;
        
        const geo = geoip.lookup(ip);
        if (geo && geo.country) {
            return geo.country;
        }
    } catch (err) {
        console.error('[GeoIP Error]', err.message);
    }
    return 'Unknown';
}

async function checkRateLimit(identifier) {
    if (!identifier) return false;
    const key = `ratelimit:matching:${identifier.toLowerCase()}`;
    const result = await redis.set(key, '1', 'NX', 'EX', Math.ceil(RATE_LIMIT_COOLDOWN));
    return result === null; // true if rate limited (key already existed)
}

function setupMatching(io, socket) {
    let isProcessing = false;

    socket.on('identify', async ({ role, email, language, id }) => {
        console.log(`[Identify] Socket ${socket.id} identifies as ${role} (${id || email || 'Guest'})`);
        try {
            socket.role = role;
            socket.data.role = role;
            socket.language = language || 'en';
            socket.data.language = socket.language;
            socket.userEmail = email?.toLowerCase();
            socket.data.userEmail = socket.userEmail;
            socket.userId = id;
            socket.data.userId = id;

            // Detect IP and Country
            // Detect IP and Country
            const userIp = getClientIp(socket);
            socket.userIp = userIp;
            socket.data.userIp = userIp;
            socket.countryCode = detectCountry(socket);
            socket.data.countryCode = socket.countryCode;

            if (socket.userId) {
                await socket.join(`id:${socket.userId}`);
                
                socket.pseudo = await resolvePseudo(socket.userId, role, socket.userEmail);
                socket.data.pseudo = socket.pseudo;

                if (role === 'model') {
                    await redis.sadd('online_models', socket.userId);
                    // Fetch blocked countries
                    const modelRes = await query('SELECT blocked_countries FROM models WHERE id = $1', [socket.userId]);
                    if (modelRes.rows.length > 0) {
                        socket.data.blockedCountries = modelRes.rows[0].blocked_countries || [];
                    }
                }
                await redis.set(`user_socket:${socket.userId}`, socket.id, 'EX', 86400);
            } else {
                socket.pseudo = 'Guest';
                socket.data.pseudo = 'Guest';
            }
            console.log(`[Identify] Socket ${socket.id} IP: ${socket.userIp}, Country: ${socket.countryCode}`);
        } catch (err) {
            console.error('[Identify Error]', err);
        }
    });

    socket.on('call_active', async () => {
        try {
            const roomId = socket.currentRoom || await redis.get(`socket_room:${socket.id}`);
            if (roomId) {
                console.log(`[Socket] call_active received from ${socket.id} for room ${roomId}`);
                await activateBilling(roomId);
            }
        } catch (err) {
            console.error('[call_active Error]', err);
        }
    });

    // Join role queue
    socket.on('join_queue', async ({ role, language, email, id }) => {
        console.log(`[Queue] Received join_queue from ${socket.id}. Role: ${role}, ID: ${id}`);
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
            socket.data.role = role;

            socket.language = language || 'en';
            socket.data.language = socket.language;
            
            socket.userEmail = email?.toLowerCase();
            socket.data.userEmail = socket.userEmail;
            socket.userId = id;
            socket.data.userId = id;

            if (socket.userId) {
                await socket.join(`id:${socket.userId}`);
                
                socket.pseudo = await resolvePseudo(socket.userId, role, socket.userEmail);
                socket.data.pseudo = socket.pseudo;

                if (role === 'model') {
                    await redis.sadd('online_models', socket.userId);
                    // Fetch blocked countries
                    const modelRes = await query('SELECT blocked_countries FROM models WHERE id = $1', [socket.userId]);
                    if (modelRes.rows.length > 0) {
                        socket.data.blockedCountries = modelRes.rows[0].blocked_countries || [];
                    }
                }
                await redis.set(`user_socket:${socket.userId}`, socket.id, 'EX', 86400);
            } else {
                if (!socket.pseudo) {
                    socket.pseudo = 'Guest';
                    socket.data.pseudo = 'Guest';
                }
            }

            // Get IP for guest tracking
            // Get IP for guest tracking
            const userIp = getClientIp(socket);
            socket.userIp = userIp;
            socket.data.userIp = userIp;
 Broadway            
            // NEW: Get Country for Geo-Blocking
            const geo = geoip.lookup(userIp);
            socket.country = geo ? geo.country : 'Unknown';
            socket.data.country = socket.country;
            console.log(`[GeoIP] Socket ${socket.id} (IP: ${userIp}) detected from: ${socket.country}`);

            // Rate Limit Check (IP or ID)
            const identifier = id || userIp;
            if (await checkRateLimit(identifier)) {
                console.log(`[RateLimit] Throttling join_queue for ${identifier}`);
                return;
            }

            // Hydrate and Check Credits for Registered Users
            if (role === 'user' && id) {
                const credits = await hydrateUserCredits(id);
                if (credits <= 0) {
                    console.log(`[Limit] Registered User ${id} has 0 credits.`);
                    return socket.emit('out_of_credits', { reason: 'balance_exhausted' });
                }
            }

            // If Guest: check free limit
            if (role === 'user' && !id) {
                const settings = await getSettings();
                const guestCredits = settings.guestFreeCredits || 5.0;
                const creditsPerMin = settings.creditsPerMinute || 10;
                const freeLimitSecs = (guestCredits / creditsPerMin) * 60;

                const freeUsed = await redis.get(`free_secs:${userIp}`) || 0;
                if (parseInt(freeUsed) >= freeLimitSecs) {
                    console.log(`[Limit] IP ${userIp} reached free guest limit (${freeLimitSecs}s).`);
                    return socket.emit('out_of_credits', { reason: 'guest_limit_reached' });
                }
            }

            const isNew = await redis.set(`has_joined:${socket.id}`, '1', 'NX', 'EX', 86400);
            
            // ENSURE ONE SOCKET PER ID/IP IN QUEUE
            if (socket.userId) {
                const oldSocketId = await redis.get(`queue_socket:${socket.userId}`);
                if (oldSocketId && oldSocketId !== socket.id) {
                    console.log(`[Queue Cleanup] Removing old socket ${oldSocketId} for ID ${socket.userId}`);
                    await redis.lrem(role === 'model' ? QUEUE_MODELS : QUEUE_USERS, 0, oldSocketId);
                }
                await redis.set(`queue_socket:${socket.userId}`, socket.id, 'EX', 86400);
            } else if (role === 'user') {
                const oldSocketId = await redis.get(`queue_socket:ip:${userIp}`);
                if (oldSocketId && oldSocketId !== socket.id) {
                    console.log(`[Queue Cleanup] Removing old guest socket ${oldSocketId} for IP ${userIp}`);
                    await redis.lrem(QUEUE_USERS, 0, oldSocketId);
                }
                await redis.set(`queue_socket:ip:${userIp}`, socket.id, 'EX', 86400);
            }

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
        if (socket.role === 'model' && socket.userId) {
            await redis.srem('online_models', socket.userId);
        }
        await updateQueuePositions(io, socket.role);
    });

    socket.on('join_direct_room', async ({ roomId, role, id, language }) => {
        try {
            const normalizedId = String(id).toLowerCase();
            
            // --- KILL-SWITCH: Cleanup any ghost sessions for this model before starting new one ---
            // This is critical for multi-server reliability on Render
            const oldRoomId = await redis.get(`user_active_room:${normalizedId}`);
            if (oldRoomId && oldRoomId !== roomId) {
                console.log(`[DirectCall Kill-Switch] User ${id} cleaning up ghost room ${oldRoomId}`);
                await stopBilling(oldRoomId, 'partner_redirected');
            }

            // CRITICAL: If already in a room (according to socket object), disconnect too
            if (socket.currentRoom && socket.currentRoom !== roomId) {
                console.log(`[DirectCall] Socket ${socket.id} already in room ${socket.currentRoom}. Disconnecting before join.`);
                await disconnectFromRoom(io, socket, 'direct_call_accepted');
            }

            console.log(`[DirectCall] Socket ${socket.id} joining room ${roomId} as ${role} (ID: ${id})`);
            socket.role = role;
            socket.data.role = role;
            
            socket.language = language || 'en';
            socket.data.language = socket.language;

            socket.userId = id;
            socket.data.userId = id;

            socket.currentRoom = roomId;
            socket.data.currentRoom = roomId;
            
            if (socket.userId) {
                await socket.join(`id:${socket.userId}`);
            }
            await socket.join(roomId);

            // Store room mapping in Redis (More robust than in-memory socket.currentRoom)
            await redis.set(`socket_room:${socket.id}`, roomId, 'EX', 7200);
            // 1. Remove this specific socket
            await redis.lrem(role === 'model' ? QUEUE_MODELS : QUEUE_USERS, 0, socket.id);
            
            // 2. Remove any other socket for this same ID
            if (socket.userId) {
                const oldSocketId = await redis.get(`queue_socket:${socket.userId}`);
                if (oldSocketId && oldSocketId !== socket.id) {
                    console.log(`[DirectCall Cleanup] Removing old queue socket ${oldSocketId} for ID ${socket.userId}`);
                    await redis.lrem(role === 'model' ? QUEUE_MODELS : QUEUE_USERS, 0, oldSocketId);
                }
                // Store this new socket as the "current" one
                await redis.set(`queue_socket:${socket.userId}`, socket.id, 'EX', 86400);
            }

            await updateQueuePositions(io, role);
            
            // Notify the room that someone joined
            const myPseudo = socket.userId ? (await resolvePseudo(socket.userId, role) || 'Partner') : 'Guest';
            socket.to(roomId).emit('partner_joined', { 
                socketId: socket.id, 
                role, 
                userId: socket.userId, 
                name: myPseudo
            });

            // Start billing if it's a model-user pair and both are in
            const roomSockets = await io.in(roomId).fetchSockets();
            console.log(`[DirectCall Status] Room ${roomId} now has ${roomSockets.length} sockets (Expected 2 for match)`);
            
            if (roomSockets.length === 2) {
                const userSocket = roomSockets.find(s => s.data.role === 'user');
                const modelSocket = roomSockets.find(s => s.data.role === 'model');

                console.log(`[DirectCall Detection] UserSocket: ${userSocket?.id || 'NOT FOUND'}, ModelSocket: ${modelSocket?.id || 'NOT FOUND'}`);

                if (userSocket && modelSocket) {
                    console.log(`[DirectCall] Both parties detected in room ${roomId}. Emitting matched events.`);
                    
                    const userId = userSocket.data.userId;
                    const modelId = modelSocket.data.userId;

                    const userPseudo = await resolvePseudo(userId, 'user');
                    const modelPseudo = await resolvePseudo(modelId, 'model');

                    // Unified 'matched' event for full frontend compatibility
                    userSocket.emit('matched', {
                        roomId,
                        initiator: userSocket.id, // Caller is initiator 
                        partnerId: modelId,
                        partnerPseudo: modelPseudo,
                        partnerName: modelPseudo, // Compatibility
                        partnerRole: 'model',
                        isBlocked: false,
                        blockEnd: null,
                        isRestricted: false 
                    });

                    modelSocket.emit('matched', {
                        roomId,
                        initiator: userSocket.id,
                        partnerId: userId,
                        partnerPseudo: userPseudo,
                        partnerName: userPseudo, // Compatibility
                        partnerRole: 'user',
                        isBlocked: false,
                        blockEnd: null,
                        isRestricted: false
                    });

                    console.log(`[DirectBilling] Starting billing for room ${roomId}`);
                    const userCountryCode = userSocket.data.countryCode || 'Unknown';
                    await startBilling(roomId, userId, modelId, userSocket.id, modelSocket.id, userCountryCode);
                }
            }
        } catch (err) {
            console.error('[DirectCall Error] Crash in join_direct_room:', err);
        }
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
    const myIdentifier = (socket.userId || `${socket.role}:${socket.userIp || 'unknown'}`).toLowerCase();
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
                const partnerId = isModel ? roomData.userId : roomData.modelId;

                if (isModel) {
                    roomData.modelSocketId = socket.id;
                } else {
                    roomData.userSocketId = socket.id;
                }
                await redis.hset('billing:active_rooms', existingRoomId, JSON.stringify(roomData));

                // Check if this room was in a private session
                const blockDataRaw = await redis.get(`billing:is_blocked:${existingRoomId}`);
                const blockData = blockDataRaw ? JSON.parse(blockDataRaw) : null;

                // Fetch initial balance if model
                let modelBalance = 0;
                if (isModel) {
                    const balanceStr = await redis.get(`model:${socket.userId || socket.userIp}:balance`);
                    modelBalance = parseFloat(balanceStr || 0);
                } else {
                     const balanceStr = await redis.get(`model:${partnerId}:balance`);
                     modelBalance = parseFloat(balanceStr || 0);
                }

                socket.emit('matched', {
                    roomId: existingRoomId,
                    initiator: socket.id,
                    isRecovery: true,
                    partnerId: partnerId,
                    partnerRole: isModel ? 'user' : 'model',
                    partnerName: await resolvePseudo(partnerId, isModel ? 'user' : 'model'),
                    isBlocked: !!blockData,
                    blockEnd: blockData?.blockEnd,
                    blockDurationMin: blockData?.blockDurationMin,
                    modelBalance: modelBalance
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
        const allCandidates = await redis.lrange(targetQueue, -30, -1);
        console.log(`[Queue] Found ${allCandidates.length} total candidates in ${targetQueue}`);
        
        // 1. Filter candidates by Geo-Blocking
        const allowedCandidates = [];
        for (const cId of allCandidates) {
            const cSocket = io.sockets.sockets.get(cId);
            if (!cSocket) continue;

            const cRole = cSocket.data.role || (targetQueue === QUEUE_MODELS ? 'model' : 'user');
            const isModelSearching = socket.data.role === 'model';
            const isCandidateModel = cRole === 'model';
            
            let isBlocked = false;
            if (isModelSearching) {
                const blocked = socket.data.blockedCountries || [];
                const userCountry = cSocket.data.country || 'Unknown';
                if (blocked.includes(userCountry)) {
                    console.log(`[GeoBlock] Filtered: Model ${socket.id} (searching) blocked User ${cId} (Country: ${userCountry})`);
                    isBlocked = true;
                }
            } else if (isCandidateModel) {
                const blocked = cSocket.data.blockedCountries || [];
                const userCountry = socket.data.country || 'Unknown';
                if (blocked.includes(userCountry)) {
                    console.log(`[GeoBlock] Filtered: Candidate Model ${cId} blocked User ${socket.id} (searching) (Country: ${userCountry})`);
                    isBlocked = true;
                }
            }
            
            if (!isBlocked) {
                allowedCandidates.push(cId);
            }
        }

        console.log(`[Queue] ${allowedCandidates.length}/${allCandidates.length} candidates allowed after Geo-Blocking`);

        let targetId = null;
        
        // 2. Try to find a candidate not yet seen
        for (let i = allowedCandidates.length - 1; i >= 0; i--) {
            const cId = allowedCandidates[i];
            const cSocket = io.sockets.sockets.get(cId);
            const cRole = cSocket.data.role || (targetQueue === QUEUE_MODELS ? 'model' : 'user');
            const cIdentifier = (cSocket.data.userId || `${cRole}:${cSocket.data.userIp || 'unknown'}`).toLowerCase();
            
            const alreadySeen = await redis.get(`seen:${myIdentifier.toLowerCase()}:${cIdentifier.toLowerCase()}`);
            if (!alreadySeen) {
                console.log(`[Matching] Found allowed candidate ${cId} (${cIdentifier}). Not seen yet.`);
                targetId = cId;
                break;
            }
        }

        // 3. Fallback to oldest ALLOWED candidate if all seen
        if (!targetId && allowedCandidates.length > 0) {
            targetId = allowedCandidates[allowedCandidates.length - 1];
            console.log(`[Match Cooldown] Everyone allowed already seen. Falling back to oldest allowed: ${targetId}`);
        }

        if (targetId) {
            const chosenId = targetId;

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
            const pIdentifier = (partnerSocket.userId || partnerSocket.userIp || partnerSocket.id).toLowerCase();
            const myIdentifierSorted = [myIdentifier.toLowerCase(), pIdentifier].sort();
            const roomId = `room_${myIdentifierSorted[0]}_${myIdentifierSorted[1]}_${Date.now()}`;
            
            console.log(`[Match SUCCESS] ${socket.id} <-> ${partnerId}. Deterministic Room ${roomId}`);

            await socket.join(roomId);
            socket.currentRoom = roomId;

            await partnerSocket.join(roomId);
            partnerSocket.currentRoom = roomId;
            
            // ENSURE BOTH ARE REMOVED FROM ALL QUEUES to prevent dual-matching
            await redis.lrem(QUEUE_USERS, 0, socket.id);
            await redis.lrem(QUEUE_MODELS, 0, socket.id);
            await redis.lrem(QUEUE_USERS, 0, partnerId);
            await redis.lrem(QUEUE_MODELS, 0, partnerId);

            // --- NEW: Mark as seen to avoid immediate rematching after hangup ---
            if (myIdentifier && pIdentifier) {
                // Increased cooldown to 12s to definitively prevent "bounce" rematches
                await redis.set(`seen:${myIdentifier.toLowerCase()}:${pIdentifier.toLowerCase()}`, '1', 'EX', 12);
                await redis.set(`seen:${pIdentifier.toLowerCase()}:${myIdentifier.toLowerCase()}`, '1', 'EX', 12);
            }

            const userSocket = isModel ? partnerSocket : socket;
            const userCountryCode = userSocket.data.countryCode || 'Unknown';
            const settings = await getSettings();
            const isRestricted = settings.restrictedCountries && settings.restrictedCountries.includes(userCountryCode);

            // Pass billing ID: UUID if registered, IP if guest
            const userBillingId = (isModel ? (partnerSocket.userId || partnerSocket.userIp) : (socket.userId || socket.userIp))?.toLowerCase();
            const modelBillingId = (isModel ? (socket.userId || socket.id) : (partnerSocket.userId || partnerId))?.toLowerCase();
            
            await startBilling(roomId, userBillingId, modelBillingId, isModel ? partnerId : socket.id, isModel ? socket.id : partnerId, userCountryCode);

            // Fetch model balances for the matched event
            const modelBalance = parseFloat(await redis.get(`model:${modelBillingId}:balance`) || 0);

            // Notify both parties with partner info for reporting
            socket.emit('matched', { 
                roomId, 
                initiator: socket.id, 
                partnerId: partnerSocket.userId || partnerSocket.userIp, 
                partnerRole: partnerSocket.role,
                partnerName: partnerSocket.pseudo || 'Partner',
                isBlocked: false,
                blockEnd: null,
                isRestricted: socket.role === 'user' ? isRestricted : false,
                modelBalance: socket.role === 'model' ? modelBalance : undefined
            });
            partnerSocket.emit('matched', { 
                roomId, 
                initiator: socket.id, 
                partnerId: socket.userId || socket.userIp, 
                partnerRole: socket.role,
                partnerName: socket.pseudo || 'Guest',
                isBlocked: false,
                blockEnd: null,
                isRestricted: partnerSocket.role === 'user' ? isRestricted : false,
                modelBalance: partnerSocket.role === 'model' ? modelBalance : undefined
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
    // 1. Try local memory first, fallback to Redis for multi-server reliability
    let roomId = socket.currentRoom;
    if (!roomId) {
        roomId = await redis.get(`socket_room:${socket.id}`);
        if (roomId) console.log(`[Disconnect] Recovered roomId ${roomId} from Redis for socket ${socket.id}`);
    }

    if (roomId) {
        // Find partner socket ID before we clear anything
        const roomDataStr = await redis.hget('billing:active_rooms', roomId);
        let partnerSocketId = null;
        if (roomDataStr) {
            const roomData = JSON.parse(roomDataStr);
            partnerSocketId = socket.id === roomData.userSocketId ? roomData.modelSocketId : roomData.userSocketId;
        }

        console.log(`[Disconnect] cleaning room ${roomId}. Initiator: ${socket.id}, Partner found: ${partnerSocketId}, Reason: ${reason}`);

        // Stop billing for this room - this emits partner_left via ioInstance.to(roomId)
        await stopBilling(roomId, reason);

        // --- NEW: Aggressive Queue Cleanup on Disconnect ---
        if (reason === 'balance_exhausted' || reason === 'guest_limit_reached') {
            console.log(`[Disconnect Cleanup] Removing socket ${socket.id} (and IP/ID) from queue due to exhaustion.`);
            await redis.lrem(socket.role === 'model' ? QUEUE_MODELS : QUEUE_USERS, 0, socket.id);
            if (socket.userId) {
                await redis.del(`queue_socket:${socket.userId}`);
            } else if (socket.userIp) {
                await redis.del(`queue_socket:ip:${socket.userIp}`);
            }
        }

        socket.leave(roomId);
        socket.currentRoom = null;
        await redis.del(`socket_room:${socket.id}`);

        // --- MULTI-SERVER SAFE RE-QUEUE ---
        if (partnerSocketId) {
            const isDirectCall = roomId.startsWith('direct-call-');
            if (blockDataRaw || isDirectCall) {
                console.log(`[Auto-Next] Gating auto-requeue for partner ID ${partnerSocketId} (Private/Direct detected)`);
                io.to(partnerSocketId).emit('clean_room', { roomId }); 
            } else {
                console.log(`[Auto-Next] Sending force_requeue to partner ID ${partnerSocketId}`);
                io.to(partnerSocketId).emit('force_requeue', { lastRoomId: roomId });
            }
        }
    }
}

module.exports = { setupMatching, handleJoinQueue, disconnectFromRoom };
