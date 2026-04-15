"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Default STUN servers as fallback
const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC(role: "user" | "model" | null, isEnabled: boolean = true) {

    const [socket, setSocket] = useState<Socket | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [isCallConnected, setIsCallConnected] = useState(false);
    const [messages, setMessages] = useState<{ senderId: string; text: string; originalText?: string; timestamp: number }[]>([]);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [partnerInfo, setPartnerInfo] = useState<{ email: string; role: string; name: string } | null>(null);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isLaunch, setIsLaunch] = useState(false);
    const [cameraPermissionError, setCameraPermissionError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'reconnecting'>('excellent');

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastStatsRef = useRef<{ timestamp: number; bytesReceived: number; packetsLost: number } | null>(null);
    const monitoringStartTimeRef = useRef<number>(0);
    const consecutiveBadSamplesRef = useRef<number>(0);
    const iceServersRef = useRef<any[]>(DEFAULT_ICE_SERVERS);
    const localStreamRef = useRef<MediaStream | null>(null);
    const currentRoomRef = useRef<string | null>(null);

    // Sync ref with state
    useEffect(() => {
        localStreamRef.current = localStream;
        
        // Safety: If PC already exists but lacks tracks, add them now
        if (localStream && peerConnectionRef.current) {
            const pc = peerConnectionRef.current;
            const senders = pc.getSenders();
            localStream.getTracks().forEach((track) => {
                if (!senders.find((s) => s.track === track)) {
                    console.log('Synchronizing late-arriving track:', track.kind);
                    pc.addTrack(track, localStream!);
                }
            });
        }
    }, [localStream]);

    useEffect(() => {
        if (!isEnabled) return;

        // 1. Fetch ICE servers from backend (Twilio)
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ice-servers`)
            .then(res => res.json())
            .then(data => {
                if (data.iceServers) {
                    iceServersRef.current = data.iceServers;
                    console.log('ICE servers updated from Twilio');
                }
            })
            .catch(err => console.error("Error fetching ICE servers:", err));

        // 2. Initialize Media Stream
        navigator.mediaDevices
            .getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }, 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            })
            .then((stream) => {
                setLocalStream(stream);
                setCameraPermissionError(false);
            })
            .catch((err) => {
                console.error("Error accessing media devices.", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setCameraPermissionError(true);
                }
            });

        const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live", {
            transports: ["websocket", "polling"],
            forceNew: true,
            reconnectionAttempts: 5
        });

        setSocket(newSocket);

        const urlParams = new URLSearchParams(window.location.search);
        const directRoom = urlParams.get('room');
        const isInit = urlParams.get('init') === 'true';

        if (directRoom) {
            const email = localStorage.getItem("kinky_user_email") || null;
            
            newSocket.on('connect', () => {
                console.log('[DirectCall] Socket connected, joining room:', directRoom);
                newSocket.on('direct_matched_ready', async (data: any) => {
                    console.log('[DirectCall] Both parties ready:', data);
                    
                    if (data?.partnerEmail) {
                        setPartnerInfo({
                            email: data.partnerEmail,
                            role: data.partnerRole,
                            name: data.partnerPseudo || data.partnerEmail
                        });
                    }

                    setIsMatching(false);
                    setIsCallConnected(true);
                    
                    if (isInit) {
                        // WAIT FOR LOCAL STREAM (Critical for media lines in SDP)
                        let attempts = 0;
                        while (!localStreamRef.current && attempts < 10) {
                            console.log('[DirectCall] Waiting for localStream...');
                            await new Promise(r => setTimeout(r, 500));
                            attempts++;
                        }

                        console.log('[DirectCall] Starting handshake as initiator');
                        const pc = createPeerConnection();
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        newSocket.emit("offer", offer);
                    }
                });

                currentRoomRef.current = directRoom;
                newSocket.emit("join_direct_room", { 
                    roomId: directRoom, 
                    role, 
                    email, 
                    language: navigator.language || "en" 
                });
            });
        }

        return () => {
            console.log('[WebRTC Cleanup] Stopping local stream and disconnecting socket');
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`[WebRTC Cleanup] Stopped track: ${track.kind}`);
                });
            }
            stopStatsMonitoring();
            newSocket.disconnect();
        };
    }, [isEnabled, retryCount]);


    // Manual join triggered by UI
    const joinQueue = () => {
        if (!socket || !role) return;
        const language = navigator.language || "en";
        const email = localStorage.getItem("kinky_user_email") || null;
        socket.emit("join_queue", { role, language, email });
        setIsMatching(true);
    };

    const createPeerConnection = () => {
        console.log('Creating PeerConnection with servers:', iceServersRef.current.length);
        const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
        peerConnectionRef.current = pc;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
        }

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit("ice-candidate", event.candidate);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE state changed to: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
                setConnectionQuality('reconnecting');
                // Don't kill the call immediately, wait for auto-recovery or ICE restart
                setTimeout(() => {
                    if (peerConnectionRef.current && (peerConnectionRef.current.iceConnectionState === "disconnected" || peerConnectionRef.current.iceConnectionState === "failed")) {
                        console.log('[WebRTC] Connection remains down, attempting ICE restart...');
                        handleIceRestart();
                    }
                }, 5000);
            } else if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                console.log('[WebRTC] ICE Connection success!');
                socket?.emit('connection_success', { roomId: currentRoomRef.current });
                setIsCallConnected(true);
                monitoringStartTimeRef.current = Date.now();
                consecutiveBadSamplesRef.current = 0;
                startStatsMonitoring();
            }
        };

        return pc;
    };

    const handleIceRestart = async () => {
        const pc = peerConnectionRef.current;
        if (pc && socket && pc.signalingState !== "closed") {
            try {
                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);
                socket.emit("offer", offer);
                console.log('[WebRTC] ICE Restart offer sent');
            } catch (err) {
                console.error('[WebRTC] Failed to create ICE Restart offer:', err);
            }
        }
    };

    const startStatsMonitoring = () => {
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        
        statsIntervalRef.current = setInterval(async () => {
            const pc = peerConnectionRef.current;
            if (!pc || pc.iceConnectionState !== 'connected') return;

            const stats = await pc.getStats();
            let currentBytes = 0;
            let currentPacketsLost = 0;

            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    currentBytes = report.bytesReceived;
                    currentPacketsLost = report.packetsLost;
                }
            });

            const now = Date.now();

            if (lastStatsRef.current && currentBytes > 0) {
                const deltaBytes = currentBytes - lastStatsRef.current.bytesReceived;
                const deltaPacketsLost = currentPacketsLost - lastStatsRef.current.packetsLost;
                const deltaTimeS = (now - lastStatsRef.current.timestamp) / 1000;
                
                // Accurate Bitrate Calculation (Mbps)
                const bitrateMbps = deltaTimeS > 0 ? (deltaBytes * 8) / (deltaTimeS * 1000000) : 0;
                const isWarmup = (now - monitoringStartTimeRef.current) < 10000; // 10s warmup

                // Quality Logic
                let targetQuality: 'excellent' | 'fair' | 'poor' = 'excellent';
                
                if (deltaPacketsLost > 5 || bitrateMbps < 0.2) {
                    targetQuality = 'poor';
                } else if (deltaPacketsLost > 2 || bitrateMbps < 0.5) {
                    targetQuality = 'fair';
                } else {
                    targetQuality = 'excellent';
                }

                // Stabilization:
                // 1. During warmup, we don't downgrade to POOR based on bitrate alone (packets lost still counts)
                if (isWarmup && targetQuality === 'poor' && deltaPacketsLost <= 5) {
                    targetQuality = 'excellent';
                }

                // 2. Smoothing: require consecutive samples for downgrading to 'poor'
                if (targetQuality === 'poor') {
                    consecutiveBadSamplesRef.current++;
                    if (consecutiveBadSamplesRef.current < 2 && !isWarmup) {
                        // Keep current if it's the first bad sample and we out of warmup
                        // but if we were fair, stay fair. If we were excellent, stay excellent.
                    } else {
                        setConnectionQuality('poor');
                        updateQualityParameters(0.2);
                    }
                } else if (targetQuality === 'fair') {
                    consecutiveBadSamplesRef.current = 0;
                    setConnectionQuality('fair');
                    updateQualityParameters(0.5);
                } else {
                    consecutiveBadSamplesRef.current = 0;
                    setConnectionQuality('excellent');
                    updateQualityParameters(1.5);
                }
            }

            lastStatsRef.current = {
                timestamp: now,
                bytesReceived: currentBytes,
                packetsLost: currentPacketsLost
            };
        }, 2000);
    };

    const stopStatsMonitoring = () => {
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
        }
        lastStatsRef.current = null;
    };

    const updateQualityParameters = async (bitrateMbps: number) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');

        if (videoSender) {
            const params = videoSender.getParameters();
            if (!params.encodings || params.encodings.length === 0) return;

            const maxBitrate = bitrateMbps * 1000000;
            const scaleDown = bitrateMbps < 0.5 ? 2.0 : 1.0;

            if (params.encodings[0].maxBitrate !== maxBitrate || params.encodings[0].scaleResolutionDownBy !== scaleDown) {
                console.log(`[WebRTC] Optimizing quality: ${bitrateMbps}Mbps, Scale: ${scaleDown}`);
                params.encodings[0].maxBitrate = maxBitrate;
                params.encodings[0].scaleResolutionDownBy = scaleDown;
                try {
                    await videoSender.setParameters(params);
                } catch (err) {
                    console.error('[WebRTC] Failed to update quality parameters:', err);
                }
            }
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("waiting", ({ position }) => {
            setIsMatching(true);
            setIsCallConnected(false);
            setRemoteStream(null);
            setMessages([]);
            if (position) setQueuePosition(position);
        });

        socket.on("queue_update", ({ position }) => {
            setQueuePosition(position);
        });

        socket.on("matched", async (data: any) => {
            const { roomId, initiator, partnerEmail, partnerRole, partnerName, isRecovery } = data;
            currentRoomRef.current = roomId;
            console.log('[WebRTC] Matched event received. Initiator:', initiator, 'Recovery:', !!isRecovery);
            setRemoteStream(null); // Clear previous stream to avoid stale visuals
            console.log('[WebRTC] Matched -> setting isMatching: false, isCallConnected: true');
            setIsMatching(false);
            setIsCallConnected(true);
            
            if (!isRecovery) {
                setMessages([]);
            }

            if (partnerEmail) {
                setPartnerInfo({
                    email: partnerEmail,
                    role: partnerRole,
                    name: partnerName
                });
            }

            if (peerConnectionRef.current) {
                console.log('[WebRTC] Closing existing PeerConnection before new match');
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            const pc = createPeerConnection();

            if (socket.id === initiator) {
                const offer = await pc.createOffer({ iceRestart: !!isRecovery });
                await pc.setLocalDescription(offer);
                socket.emit("offer", offer);
            }
        });

        socket.on("offer", async (offer) => {
            console.log('[WebRTC] Offer received');
            let pc = peerConnectionRef.current;
            if (pc && pc.signalingState !== "closed") {
                console.log('[WebRTC] Reusing existing PC for offer');
            } else {
                console.log('[WebRTC] Creating new PC for incoming offer');
                if (pc) pc.close();
                pc = createPeerConnection();
            }
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", answer);
        });

        socket.on("answer", async (answer) => {
            console.log('[WebRTC] Answer received');
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on("ice-candidate", async (candidate) => {
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.on("partner_left", () => {
            console.log('[WebRTC] Partner left (permanent)');
            setIsCallConnected(false);
            setRemoteStream(null);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            // Re-queueing logic moved to UI component (VideoRoom) to handle private sessions correctly
        });

        socket.on("partner_disconnected", () => {
            console.log('[WebRTC] Partner disconnected (temporary)');
            // We keep the state but maybe show a UI indicator?
            // For now just log it.
        });

        socket.on("partner_reconnected", async () => {
            console.log('[WebRTC] Partner reconnected! Resuming signaling...');
            // If I am the initiator, I should create a new offer
            const pc = peerConnectionRef.current;
            if (pc && pc.signalingState !== "closed") {
                // Check if we are initiator (we don't have this in state directly, but we can check initiator from partnerInfo or logic)
                // Actually, the simplest is to have the rejoining party always trigger matched.
                // Which I already did in matching.js
            }
        });

        socket.on("maintenance_active", () => {
            console.log('[WebRTC] Maintenance Mode Activated');
            setIsMaintenance(true);
            setIsCallConnected(false);
            setRemoteStream(null);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        });

        socket.on("launch_active", () => {
            console.log('[WebRTC] Launch Mode Activated');
            setIsLaunch(true);
            setIsCallConnected(false);
            setRemoteStream(null);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        });

        socket.on("chat_message", (msg: any) => {
            // Ensure pseudo/role are present even if missing in payload (graceful fallback)
            const enhancedMsg = {
                ...msg,
                senderPseudo: msg.senderPseudo || partnerInfo?.name || "Partner",
                senderRole: msg.senderRole || partnerInfo?.role || "user"
            };
            setMessages((prev) => [...prev, enhancedMsg]);
        });

        return () => {
            socket.off("maintenance_active");
            socket.off("launch_active");
            socket.off("waiting");

            socket.off("queue_update");
            socket.off("matched");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("partner_left");
            socket.off("partner_disconnected");
            socket.off("partner_reconnected");
            socket.off("chat_message");
        };
    }, [socket]); // Only depends on socket


    const handleOutOfCredits = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsCallConnected(false);
        setRemoteStream(null);
        socket?.emit("out_of_credits");
    };

    const endCall = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsCallConnected(false);
        setRemoteStream(null);
        setPartnerInfo(null);
        socket?.emit("next"); // This unmatches but we won't follow with join_queue in the UI
    };

    const nextPartner = () => {
        setIsMatching(true); // Show "Searching..." immediately in the UI
        endCall();
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
        }
    };

    const sendMessage = (text: string) => {
        if (socket && text.trim()) {
            socket.emit("chat_message", text);
            
            const localPseudo = localStorage.getItem('kinky_user_pseudo') || (role === 'model' ? 'Model' : 'Guest');
            const localRole = role || 'user';

            setMessages((prev) => [...prev, { 
                senderId: socket.id || "me", 
                senderPseudo: localPseudo,
                senderRole: localRole,
                text, 
                timestamp: Date.now() 
            }]);
        }
    };

    const handleSendIceCandidate = (candidate: RTCIceCandidate) => {
        if (socket) {
            socket.emit("ice-candidate", candidate);
        }
    };

    return {
        localStream,
        remoteStream,
        isMatching,
        isConnected: isCallConnected,
        joinQueue,
        nextPartner,
        toggleAudio,
        toggleVideo,
        messages,
        sendMessage,
        handleOutOfCredits,
        queuePosition,
        partnerInfo,
        socket,
        socketId: socket?.id,
        endCall,
        isMaintenance,
        isLaunch,
        cameraPermissionError,
        isDirectCall: !!(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('room')),
        retryCamera: () => setRetryCount(prev => prev + 1),
        connectionQuality
    };
}

