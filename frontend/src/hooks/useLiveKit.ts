"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  LocalVideoTrack,
  LocalAudioTrack,
  ConnectionState,
  Track,
  VideoPresets,
} from "livekit-client";

// DEPLOY CANARY: 2026-04-16T13:08:00Z - Robust Sync
export function useLiveKit(role: "user" | "model" | null, isEnabled: boolean = true) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [messages, setMessages] = useState<{ senderId: string; senderPseudo: string; senderRole: string; text: string; timestamp: number }[]>([]);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<{ id: string; role: string; name: string } | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLaunch, setIsLaunch] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'reconnecting'>('excellent');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  
  const currentRoomIdRef = useRef<string | null>(null);

  // 1. Preview Stream (for PreMatchModal)
  useEffect(() => {
    if (!isEnabled) return;
    
    // Sync preview stream with state
    if (previewStream) {
        previewStream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
        previewStream.getVideoTracks().forEach(t => t.enabled = !isVideoMuted);
    }

    navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true 
    })
    .then(stream => {
        stream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
        stream.getVideoTracks().forEach(t => t.enabled = !isVideoMuted);
        setPreviewStream(stream);
    })
    .catch(err => {
      console.error("[Preview] Camera error:", err);
      setCameraPermissionError(true);
    });

    return () => {
      previewStream?.getTracks().forEach(t => t.stop());
    };
  }, [isEnabled, isAudioMuted, isVideoMuted]);

  // 2. Socket.io Initialization (Queue & Events)
  useEffect(() => {
    if (!isEnabled) return;

    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live", {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnectionAttempts: 5
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to backend:", newSocket.id);
      setIsSocketConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket] Disconnected from backend");
      setIsSocketConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isEnabled]);

  // 2. LiveKit Room Initialization & Cleanup
  useEffect(() => {
    const lkRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      publishDefaults: {
        simulcast: true,
        videoCodec: 'vp8',
        videoEncoding: {
          maxBitrate: 1_500_000, // 1.5 Mbps is better for mobile 4G/LTE
          maxFramerate: 24, // Smoother on mobile devices
          priority: 'high',
        },
        screenShareEncoding: {
          maxBitrate: 3_000_000,
          maxFramerate: 15,
        },
      },
    });

    lkRoom
      .on(RoomEvent.Connected, () => {
        console.log("[LiveKit] Connected to room");
        setIsMatching(false);
        setIsCallConnected(true);
      })
      .on(RoomEvent.Disconnected, () => {
        console.log("[LiveKit] Disconnected");
        setIsCallConnected(false);
      })
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        if (state === ConnectionState.Reconnecting) setConnectionQuality('reconnecting');
        else if (state === ConnectionState.Connected) setConnectionQuality('excellent');
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        // Handle connection quality changes if needed
      });

    setRoom(lkRoom);

    return () => {
      lkRoom.disconnect();
    };
  }, []);

  // 3. Socket Event Handlers
  useEffect(() => {
    if (!socket || !room) return;

    socket.on("waiting", ({ position }) => {
      setIsMatching(true);
      setIsConnecting(false);
      setIsCallConnected(false);
      setMessages([]);
      if (position) setQueuePosition(position);
    });

    socket.on("queue_update", ({ position }) => {
      setQueuePosition(position);
    });

    socket.on("matched", async (data: any) => {
      const { roomId, initiator, partnerId, partnerRole, partnerName } = data;
      currentRoomIdRef.current = roomId;
      setIsConnecting(true);
      
      if (roomId.startsWith('direct-call-')) {
          console.log("[LiveKit] Direct call matched, hiding searching overlay immediately");
          setIsMatching(false);
      }

      if (partnerId) {
        setPartnerInfo({
          id: partnerId,
          role: partnerRole,
          name: partnerName
        });
      }

      try {
        const identity = socket.id || "unknown";
        const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/video/token?room=${roomId}&identity=${identity}`);
        const { token } = await resp.json();

        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live.kinky.live";
        console.log(`[LiveKit] Connecting to ${url} for room ${roomId}`);
        await room.connect(url, token);
        
        // Publish local tracks
        await room.localParticipant.enableCameraAndMicrophone();
        
        // --- CRITICAL SYNC ---
        // Immediately apply user's mute preferences after publication
        console.log("[LiveKit] Match established, enforcing mute states:", { audio: isAudioMuted, video: isVideoMuted });
        await room.localParticipant.setMicrophoneEnabled(!isAudioMuted);
        await room.localParticipant.setCameraEnabled(!isVideoMuted);
        
        console.log("[LiveKit] Tracks published and synced");
      } catch (err) {
        console.error("[LiveKit] Connection error:", err);
      }
    });

    socket.on("partner_left", (data?: { reason?: string }) => {
      console.log("[LiveKit] Partner left");
      room.disconnect();
      setIsCallConnected(false);
      setIsMatching(true);
      setIsConnecting(false);
    });

    socket.on("force_requeue", () => {
        console.log("[LiveKit] Server forced a re-queue");
        room.disconnect();
        setIsCallConnected(false);
        setIsMatching(true);
        joinQueue();
    });

    socket.on("clean_room", () => {
        console.log("[LiveKit] Server cleaned room state");
        room.disconnect();
        setIsCallConnected(false);
        setIsMatching(true);
    });

    socket.on("chat_message", (msg: any) => {
      setMessages((prev) => [...prev, {
        ...msg,
        senderPseudo: msg.senderPseudo || partnerInfo?.name || "Partner",
        senderRole: msg.senderRole || partnerInfo?.role || "user"
      }]);
    });

    return () => {
        socket.off("waiting");
        socket.off("queue_update");
        socket.off("matched");
        socket.off("partner_left");
        socket.off("force_requeue");
        socket.off("clean_room");
        socket.off("chat_message");
    };
  }, [socket, room, partnerInfo, isAudioMuted, isVideoMuted]);

  // 4. WATCHDOG: Connection Timeout
  useEffect(() => {
    if (!isConnecting) return;

    const timeout = setTimeout(() => {
      if (isConnecting && !isCallConnected) {
        console.warn("[Watchdog] Connection timeout. Returning to searching state.");
        setIsConnecting(false);
        setIsMatching(true);
        room?.disconnect();
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [isConnecting, isCallConnected, room]);

  const joinDirectRoom = (roomId: string) => {
    if (!socket || !role) return;
    socket.emit("join_direct_room", { roomId, role, id: localStorage.getItem("kinky_user_id"), language: navigator.language || "en" });
    setIsMatching(false);
    setIsConnecting(true);
  };

  const joinQueue = () => {
    if (!socket || !role) return;
    socket.emit("join_queue", { role, id: localStorage.getItem("kinky_user_id"), language: navigator.language || "en" });
    setIsMatching(true);
  };

  const endCall = async () => {
    if (room) await room.disconnect();
    setIsCallConnected(false);
    setPartnerInfo(null);
    socket?.emit("next");
  };

  const nextPartner = () => {
    setIsMatching(true);
    endCall();
  };

  const sendMessage = (text: string) => {
    if (socket && text.trim()) {
      socket.emit("chat_message", text);
      const localPseudo = localStorage.getItem('kinky_user_pseudo') || (role === 'model' ? 'Model' : 'Guest');
      setMessages((prev) => [...prev, { 
        senderId: socket.id || "me", 
        senderPseudo: localPseudo,
        senderRole: role || 'user',
        text, 
        timestamp: Date.now() 
      }]);
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioMuted;
    setIsAudioMuted(newState);
    if (room?.localParticipant) {
      room.localParticipant.setMicrophoneEnabled(!newState);
    }
    if (previewStream) {
      previewStream.getAudioTracks().forEach(t => t.enabled = !newState);
    }
  };

  const toggleVideo = () => {
    const newState = !isVideoMuted;
    setIsVideoMuted(newState);
    if (room?.localParticipant) {
      room.localParticipant.setCameraEnabled(!newState);
    }
    if (previewStream) {
        previewStream.getVideoTracks().forEach(t => t.enabled = !newState);
    }
  };

  return {
    room,
    isMatching,
    isConnected: isCallConnected,
    isConnecting,
    joinQueue,
    joinDirectRoom,
    nextPartner,
    toggleAudio,
    toggleVideo,
    isAudioMuted,
    isVideoMuted,
    setIsAudioMuted,
    setIsVideoMuted,
    messages,
    sendMessage,
    queuePosition,
    partnerInfo,
    socket,
    socketId: socket?.id,
    endCall,
    isMaintenance,
    isLaunch,
    cameraPermissionError,
    connectionQuality,
    previewStream,
    isSocketConnected,
    finishMatching: () => setIsConnecting(false),
    handleOutOfCredits: () => {},
    retryCamera: () => {},
  };
}
