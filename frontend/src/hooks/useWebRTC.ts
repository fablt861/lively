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
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<{ senderId: string; text: string; originalText?: string; timestamp: number }[]>([]);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [partnerInfo, setPartnerInfo] = useState<{ email: string; role: string; name: string } | null>(null);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isLaunch, setIsLaunch] = useState(false);
    const [cameraPermissionError, setCameraPermissionError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);


    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const iceServersRef = useRef<any[]>(DEFAULT_ICE_SERVERS);
    const localStreamRef = useRef<MediaStream | null>(null);

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
            .getUserMedia({ video: true, audio: true })
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

        // 3. Initialize Socket
        const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live");
        setSocket(newSocket);

        return () => {
            console.log('[WebRTC Cleanup] Stopping local stream and disconnecting socket');
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`[WebRTC Cleanup] Stopped track: ${track.kind}`);
                });
            }
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
            if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
                setIsConnected(false);
                setRemoteStream(null);
            }
        };

        return pc;
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("waiting", ({ position }) => {
            setIsMatching(true);
            setIsConnected(false);
            setRemoteStream(null);
            setMessages([]);
            if (position) setQueuePosition(position);
        });

        socket.on("queue_update", ({ position }) => {
            setQueuePosition(position);
        });

        socket.on("matched", async (data: any) => {
            const { initiator, partnerEmail, partnerRole, partnerName, isRecovery } = data;
            console.log('[WebRTC] Matched event received. Initiator:', initiator, 'Recovery:', !!isRecovery);
            setIsMatching(false);
            setIsConnected(true);
            
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
            if (!pc || pc.signalingState === "closed") {
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
            setIsConnected(false);
            setRemoteStream(null);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            // Instantly start matching again
            socket.emit("next");
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
            setIsConnected(false);
            setRemoteStream(null);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        });

        socket.on("launch_active", () => {
            console.log('[WebRTC] Launch Mode Activated');
            setIsLaunch(true);
            setIsConnected(false);
            setRemoteStream(null);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        });

        socket.on("chat_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
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
        setIsConnected(false);
        setRemoteStream(null);
        socket?.emit("out_of_credits");
    };

    const endCall = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsConnected(false);
        setRemoteStream(null);
        setPartnerInfo(null);
        socket?.emit("next"); // This unmatches but we won't follow with join_queue in the UI
    };

    const nextPartner = () => {
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
            setMessages((prev) => [...prev, { senderId: socket.id || "me", text, timestamp: Date.now() }]);
        }
    };

    return {
        localStream,
        remoteStream,
        isMatching,
        isConnected,
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
        retryCamera: () => setRetryCount(prev => prev + 1)
    };
}

