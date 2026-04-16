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

export function useLiveKit(role: "user" | "model" | null, isEnabled: boolean = true) {
  const [socket, setSocket] = useState<Socket | null>(null);
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
  
  const currentRoomIdRef = useRef<string | null>(null);

  // 1. Preview Stream (for PreMatchModal)
  useEffect(() => {
    if (!isEnabled) return;
    
    navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true 
    })
    .then(setPreviewStream)
    .catch(err => {
      console.error("[Preview] Camera error:", err);
      setCameraPermissionError(true);
    });

    return () => {
      previewStream?.getTracks().forEach(t => t.stop());
    };
  }, [isEnabled]);

  // 2. Socket.io Initialization (Queue & Events)
  useEffect(() => {
    if (!isEnabled) return;

    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live", {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnectionAttempts: 5
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
          maxBitrate: 3_000_000, // Hint for 3 Mbps
          maxFramerate: 30,
          priority: 'high',
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
      // Keep isMatching true until room is connected to mask negotiation
      setIsConnecting(true);

      if (partnerId) {
        setPartnerInfo({
          id: partnerId,
          role: partnerRole,
          name: partnerName
        });
      }

      // Fetch Token and Connect to LiveKit
      try {
        const identity = socket.id || "unknown";
        const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/video/token?room=${roomId}&identity=${identity}`);
        const { token } = await resp.json();

        await room.connect("wss://live.kinky.live", token);
        
        // Publish local tracks (uses the HD 720p defaults set in constructor)
        await room.localParticipant.enableCameraAndMicrophone();
        console.log("[LiveKit] Tracks published");
      } catch (err) {
        console.error("[LiveKit] Connection error:", err);
      }
    });

    socket.on("partner_left", () => {
      room.disconnect();
      setIsCallConnected(false);
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
        socket.off("chat_message");
    };
  }, [socket, room, partnerInfo]);

  const joinDirectRoom = (roomId: string) => {
    if (!socket || !role) return;
    const id = localStorage.getItem("kinky_user_id") || null;
    socket.emit("join_direct_room", { roomId, role, id, language: navigator.language || "en" });
    setIsMatching(false); // Direct joins skip matching state
    setIsConnecting(true);
  };

  const joinQueue = () => {
    if (!socket || !role) return;
    const id = localStorage.getItem("kinky_user_id") || null;
    socket.emit("join_queue", { role, id, language: navigator.language || "en" });
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
    if (room?.localParticipant) {
      const enabled = room.localParticipant.isMicrophoneEnabled;
      room.localParticipant.setMicrophoneEnabled(!enabled);
    }
  };

  const toggleVideo = () => {
    if (room?.localParticipant) {
      const enabled = room.localParticipant.isCameraEnabled;
      room.localParticipant.setCameraEnabled(!enabled);
    }
  };

  return {
    room, // Exposing the room for LiveKit components
    isMatching,
    isConnected: isCallConnected,
    isConnecting,
    joinQueue,
    joinDirectRoom,
    nextPartner,
    toggleAudio,
    toggleVideo,
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
    finishMatching: () => setIsConnecting(false),
    handleOutOfCredits: () => {}, // Compatibility stub
    retryCamera: () => {}, // Handled by LiveKit internally or via re-connect
  };
}
