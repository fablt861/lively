"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Default STUN servers as fallback
const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC(role: "user" | "model" | null) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<{ senderId: string; text: string; originalText?: string; timestamp: number }[]>([]);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const iceServersRef = useRef<any[]>(DEFAULT_ICE_SERVERS);
    const localStreamRef = useRef<MediaStream | null>(null);

    // Sync ref with state
    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    useEffect(() => {
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
            .then((stream) => setLocalStream(stream))
            .catch((err) => console.error("Error accessing media devices.", err));

        // 3. Initialize Socket
        const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket && role) {
            const language = navigator.language || "en";
            const email = localStorage.getItem("kinky_user_email") || null;
            socket.emit("join_queue", { role, language, email });
            setIsMatching(true);
        }
    }, [socket, role]);

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

        socket.on("waiting", () => {
            setIsMatching(true);
            setIsConnected(false);
            setRemoteStream(null);
            setMessages([]);
        });

        socket.on("matched", async ({ initiator }: { initiator: string }) => {
            console.log('[WebRTC] Matched event received. Initiator:', initiator);
            setIsMatching(false);
            setIsConnected(true);
            setMessages([]);

            const pc = createPeerConnection();

            if (socket.id === initiator) {
                const offer = await pc.createOffer();
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
            console.log('[WebRTC] Partner left');
            setIsConnected(false);
            setRemoteStream(null);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            // Instantly start matching again
            socket.emit("next");
        });

        socket.on("chat_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("waiting");
            socket.off("matched");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("partner_left");
            socket.off("chat_message");
        };
    }, [socket]); // Only depends on socket

    const joinQueue = () => {
        const language = navigator.language || "en";
        socket?.emit("join_queue", { role, language });
    };

    const handleOutOfCredits = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsConnected(false);
        setRemoteStream(null);
        socket?.emit("out_of_credits");
    };

    const nextPartner = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsConnected(false);
        setRemoteStream(null);
        socket?.emit("next");
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
        socketId: socket?.id,
        handleOutOfCredits
    };
}
