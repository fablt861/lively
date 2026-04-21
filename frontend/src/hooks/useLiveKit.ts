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
export function useLiveKit(
    role: "user" | "model" | null, 
    isEnabled: boolean = true,
    showAuthModal: boolean = false,
    showPaywall: boolean = false
) {
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
  
  // Refs for stable use inside socket listeners without triggering re-binds
  const isAudioMutedRef = useRef(isAudioMuted);
  const isVideoMutedRef = useRef(isVideoMuted);
  
  const currentRoomIdRef = useRef<string | null>(null);

  // Sync refs with state
  const showAuthModalRef = useRef(showAuthModal);
  const showPaywallRef = useRef(showPaywall);
  const socketRef = useRef(socket);

  useEffect(() => {
    isAudioMutedRef.current = isAudioMuted;
    isVideoMutedRef.current = isVideoMuted;
  }, [isAudioMuted, isVideoMuted]);

  useEffect(() => {
    showAuthModalRef.current = showAuthModal;
    showPaywallRef.current = showPaywall;
    socketRef.current = socket;
  }, [showAuthModal, showPaywall, socket]);

  // 1. Preview Stream (for PreMatchModal)
  useEffect(() => {
    if (!isEnabled) return;
    
    // Sync preview stream with state
    if (previewStream) {
        previewStream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
        previewStream.getVideoTracks().forEach(t => t.enabled = !isVideoMuted);
    }

    // Only fetch if not already present or if camera was blocked
    if (!previewStream || cameraPermissionError) {
        navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true 
        })
        .then(stream => {
            stream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
            stream.getVideoTracks().forEach(t => t.enabled = !isVideoMuted);
            setPreviewStream(stream);
            setCameraPermissionError(false);
        })
        .catch(err => {
          console.error("[Preview] Camera error:", err);
          setCameraPermissionError(true);
        });
    }

    return () => {
      // Don't stop tracks here to allow persistence between matched calls
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

  // 2. LiveKit Room Initialization
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
          maxBitrate: 1_500_000,
          maxFramerate: 24,
          priority: 'high',
        },
      },
    });

    lkRoom
      .on(RoomEvent.Connected, () => {
        setIsMatching(false);
        setIsCallConnected(true);
        if (socketRef.current) {
          console.log("[Socket] Emitting call_active after LiveKit connect");
          socketRef.current.emit('call_active');
        }
      })
      .on(RoomEvent.Disconnected, () => {
        setIsCallConnected(false);
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log(`[LiveKit] Participant ${participant.identity} disconnected.`);
        // Emit a fake Socket event locally so VideoRoom.tsx handles it gracefully
        socketRef.current?.emit('partner_left', { reason: 'livekit_drop' });
        // Manually trigger the listener if needed
        const listeners = socketRef.current ? (socketRef.current as any).listeners('partner_left') : [];
        if (listeners && listeners.length > 0) {
             listeners.forEach((fn: Function) => fn({ reason: 'livekit_drop_local' }));
        }
      })
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        if (state === ConnectionState.Reconnecting) setConnectionQuality('reconnecting');
        else if (state === ConnectionState.Connected) setConnectionQuality('excellent');
      });

    setRoom(lkRoom);

    return () => {
      lkRoom.disconnect();
    };
  }, []);

  // --- CRITICAL SYNC EFFECT ---
  // This effect ENFORCES the mute state regardless of match lifecycle
  useEffect(() => {
    if (!room?.localParticipant || !isCallConnected) return;

    const applyMutes = async () => {
        console.log("[LiveKit] Enforcing mute consistency:", { audio: isAudioMuted, video: isVideoMuted });
        try {
            await room.localParticipant.setMicrophoneEnabled(!isAudioMuted);
            await room.localParticipant.setCameraEnabled(!isVideoMuted);
            
            // Aggressive track-level mute
            room.localParticipant.trackPublications.forEach(pub => {
                if (pub.kind === Track.Kind.Audio && pub.track) {
                    if (isAudioMuted) pub.track.mute();
                    else pub.track.unmute();
                } else if (pub.kind === Track.Kind.Video && pub.track) {
                    if (isVideoMuted) pub.track.mute();
                    else pub.track.unmute();
                }
            });
        } catch (e) {
            console.warn("[LiveKit] Mute enforcement error:", e);
        }
    };

    applyMutes();
    
    // Also re-apply when new tracks are published to catch them early
    room.on(RoomEvent.LocalTrackPublished, applyMutes);
    return () => {
        room.off(RoomEvent.LocalTrackPublished, applyMutes);
    };
  }, [room, isCallConnected, isAudioMuted, isVideoMuted]);

  // 3. Socket Event Handlers (Stable: No mute dependencies)
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
      // --- HARD GATING: Ignore matches if looking at a modal ---
      if (showAuthModalRef.current || showPaywallRef.current) {
        console.log("[useLiveKit] Gated: Match received while modal open. Emitting stop.");
        socket.emit('stop'); // Tell server to remove us from queue definitively
        setIsMatching(false);
        return;
      }

      const { roomId, initiator, partnerId, partnerRole, partnerName } = data;
      currentRoomIdRef.current = roomId;
      setIsConnecting(true);
      
      if (roomId.startsWith('direct-call-')) {
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

        // Check if we were aborted while waiting for token
        if (currentRoomIdRef.current !== roomId) {
          console.log("[useLiveKit] Aborting match connection: Room ID changed/cleared during token fetch.");
          return;
        }

        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live.kinky.live";
        console.log(`[LiveKit] Connecting to ${url} for room ${roomId}`);
        
        // Safety Timeout: if we don't stabilize in 10s, abort match
        const connTimeout = setTimeout(() => {
            if (currentRoomIdRef.current === roomId) {
                console.warn("[LiveKit] Connection timeout. Backing out.");
                setIsConnecting(false);
                room.disconnect();
                socket.emit('stop'); // Stop server session
                setIsMatching(true); // Restart search
            }
        }, 10000);

        await room.connect(url, token);
        clearTimeout(connTimeout);

        // Check if we were aborted while connecting
        if (currentRoomIdRef.current !== roomId) {
          console.log("[useLiveKit] Aborting match connection: Room ID changed/cleared during room.connect.");
          room.disconnect();
          return;
        }
        
        // Publish local tracks
        await room.localParticipant.enableCameraAndMicrophone();
        setIsConnecting(false);
        
        // Initial sync after publication using Refs to avoid closure staleness
        console.log("[LiveKit] Initial publication sync:", { audio: isAudioMutedRef.current, video: isVideoMutedRef.current });
        await room.localParticipant.setMicrophoneEnabled(!isAudioMutedRef.current);
        await room.localParticipant.setCameraEnabled(!isVideoMutedRef.current);
        
      } catch (err) {
        console.error("[LiveKit] Connection error:", err);
        setIsConnecting(false);
        setIsMatching(true);
        room.disconnect();
        socket.emit('stop'); // Abort backend session to prevent unfair billing
      }
    });

    socket.on("partner_left", (data: any) => {
      if (data?.roomId && currentRoomIdRef.current && data.roomId !== currentRoomIdRef.current) {
         console.log(`[Socket] Ignored partner_left from stale/parallel room (${data.roomId}). Current: ${currentRoomIdRef.current}`);
         return;
      }
      room.disconnect();
      setIsCallConnected(false);
      setIsConnecting(false);
    });

    socket.on("match_aborted", () => {
      console.log("[useLiveKit] Match aborted signal received.");
      currentRoomIdRef.current = null; // Signal current matched handler to stop
      room.disconnect();
      setIsCallConnected(false);
      setIsConnecting(false);
      setIsMatching(true); // Put back in searching state
    });

    socket.on("force_requeue", () => {
        room.disconnect();
        setIsCallConnected(false);
        setIsConnecting(false);
    });

    socket.on("clean_room", () => {
        room.disconnect();
        setIsCallConnected(false);
    });

    socket.on("chat_message", (msg: any) => {
      setMessages((prev) => [...prev, {
        ...msg,
        senderPseudo: msg.senderPseudo || "Partner",
        senderRole: msg.senderRole || "user"
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
  }, [socket, room]); // IMPORTANT: dependencies are now stable!

  // 4. WATCHDOG: Connection Timeout
  useEffect(() => {
    if (!isConnecting) return;
    const timeout = setTimeout(() => {
      if (isConnecting && !isCallConnected) {
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

  const toggleAudio = useCallback(async () => {
    const newState = !isAudioMutedRef.current;
    setIsAudioMuted(newState);
    console.log("[LiveKit] Manually toggling audio to:", !newState);
    
    if (room?.localParticipant) {
      try {
          await room.localParticipant.setMicrophoneEnabled(!newState);
          // Loop through audio publications for aggressive mute
          room.localParticipant.trackPublications.forEach(pub => {
              if (pub.kind === Track.Kind.Audio && pub.track) {
                  if (newState) pub.track.mute();
                  else pub.track.unmute();
              }
          });
      } catch (e) {
          console.warn("[LiveKit] Manual toggle fail:", e);
      }
    }
    if (previewStream) {
      previewStream.getAudioTracks().forEach(t => t.enabled = !newState);
    }
  }, [room, previewStream, setIsAudioMuted]);

  const toggleVideo = useCallback(async () => {
    const newState = !isVideoMutedRef.current;
    setIsVideoMuted(newState);
    
    if (room?.localParticipant) {
      try {
          await room.localParticipant.setCameraEnabled(!newState);
          room.localParticipant.trackPublications.forEach(pub => {
              if (pub.kind === Track.Kind.Video && pub.track) {
                  if (newState) pub.track.mute();
                  else pub.track.unmute();
              }
          });
      } catch (e) {
          console.warn("[LiveKit] Manual toggle fail:", e);
      }
    }
    if (previewStream) {
        previewStream.getVideoTracks().forEach(t => t.enabled = !newState);
    }
  }, [room, previewStream, setIsVideoMuted]);

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
    setIsMatching,
    finishMatching: () => setIsConnecting(false),
    handleOutOfCredits: () => {},
    retryCamera: () => {},
  };
}
