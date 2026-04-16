"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, SkipForward, Send, LayoutDashboard, Coins, PhoneOff, SendHorizontal, AlertCircle, ShieldAlert, X, CheckCircle2, Sparkles, Lock, Timer, Check, Plus, Heart, Smile, Signal, Wifi } from "lucide-react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { LiveKitRoom, VideoTrack, useTracks, RoomAudioRenderer, TrackLoop, isTrackReference } from '@livekit/components-react';
import { Track, RemoteParticipant, LocalParticipant, VideoQuality } from 'livekit-client';
import { CallListener } from './CallListener';
import { useTranslation } from "@/context/LanguageContext";
import { MaintenanceGuard } from "./MaintenanceGuard";
import { LaunchPage } from "./LaunchPage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PaywallModal } from "./PaywallModal";
import { UnifiedAuthModal } from "./UnifiedAuthModal";
import { PreMatchModal } from "./PreMatchModal";
import { OrientationGuard } from "./OrientationGuard";

function ConnectionQualityBadge({ quality }: { quality: 'excellent' | 'good' | 'fair' | 'poor' | 'reconnecting' }) {
    if (quality === 'reconnecting') return null;
    
    const colors = {
        excellent: 'text-green-400',
        good: 'text-blue-400',
        fair: 'text-yellow-400',
        poor: 'text-red-400'
    };
    
    const icons = {
        excellent: <Signal size={12} />,
        good: <Signal size={12} />,
        fair: <Wifi size={12} />,
        poor: <Wifi size={12} className="animate-pulse" />
    };

    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/20 backdrop-blur-md border border-white/5 ${colors[quality as keyof typeof colors]}`}>
            {icons[quality as keyof typeof icons]}
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {quality}
            </span>
        </div>
    );
}


function EarningsCounter({ hasVideo, currentRate, totalBalance }: { hasVideo: boolean; currentRate: number; totalBalance: number }) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all">
            <span className="text-white/80 text-[10px] md:text-xs font-bold tracking-wider uppercase hidden sm:block group-hover:text-green-400 transition-colors">
                {t('room.balance')}
            </span>
            <span className="text-green-400 font-mono text-base sm:text-xl font-black drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                ${totalBalance.toFixed(2)}
            </span>
        </div>
    );
}

interface VideoRoomProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMatching: boolean;
    isConnected: boolean; // Keep prop name same for compatibility with useWebRTC destructuring, but internal usage will be clearer
    joinQueue: () => void;
    nextPartner: () => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
    messages: any[];
    sendMessage: (text: string) => void;
    socketId: string | undefined;
    socket: any;
    role: "user" | "model" | null;
    onNext: () => void;
    handleOutOfCredits?: () => void;
    partnerInfo: { id: string; role: string; name: string } | null;
    language: string;
    onCreditsUpdate: (credits: number) => void;
    onCallEnd: () => void;
    queuePosition?: number | null;
    isLaunch?: boolean;
    isLaunchOverride?: boolean;
    packs?: any[];
    onPurchase?: (credits: number, priceUsd: number) => Promise<void>;
    isDirectCall?: boolean;
    connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'reconnecting';
    room?: any; // LiveKit Room
    finishMatching: () => void;
    isConnecting?: boolean;
    previewStream?: MediaStream | null;
}

export function VideoRoom({
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
    socketId,
    socket,
    role,
    onNext,
    handleOutOfCredits,
    onCallEnd,
    partnerInfo,
    queuePosition,
    isLaunch,
    isLaunchOverride,
    packs,
    onPurchase,
    isDirectCall,
    connectionQuality = 'excellent',
    room,
    finishMatching,
    isConnecting = false,
    previewStream = null
}: VideoRoomProps) {
    const { t, language } = useTranslation();
    const router = useRouter();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    
    // LiveKit Track hooks (must be used inside LiveKitRoom or passed room)
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: false },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { room: room || undefined, onlySubscribed: true },
    ).filter(t => isTrackReference(t)); // Ensure we only have valid tracks

    const remoteVideoTrack = room ? tracks.find(t => t.participant instanceof RemoteParticipant && t.source === Track.Source.Camera) : null;
    const localVideoTrack = room ? tracks.find(t => t.participant instanceof LocalParticipant && t.source === Track.Source.Camera) : null;

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [accountStatus, setAccountStatus] = useState<'guest' | 'registered' | 'premium'>('guest');

    // Force high quality subscription as soon as remote track is available
    // AND wait for stabilization before hiding the matching overlay
    useEffect(() => {
        if (remoteVideoTrack && (remoteVideoTrack as any).publication) {
            console.log("[LiveKit] Requesting HIGH quality for remote track immediately");
            (remoteVideoTrack as any).publication.setVideoQuality(VideoQuality.HIGH);

            // Wait for 1200ms for the stream to stabilize (ramp-up + keyframe) 
            // before telling the hook to hide the "Searching" overlay
            const timer = setTimeout(() => {
                console.log("[LiveKit] Stream stabilized, hiding overlay");
                finishMatching();
            }, 1200);

            return () => clearTimeout(timer);
        }
    }, [remoteVideoTrack, finishMatching]);
    const [userCredits, setUserCredits] = useState<number | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [hasStartedMatch, setHasStartedMatch] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState("");
    const [payoutInfo, setPayoutInfo] = useState({ rate: 0, earned: 0, totalBalance: 0 });
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockEndTime, setBlockEndTime] = useState<number | null>(null);
    const [isRestricted, setIsRestricted] = useState(false);
    const [showBlockRequestModal, setShowBlockRequestModal] = useState(false);
    const [showSpecialPackModal, setShowSpecialPackModal] = useState(false);
    const [incomingBlockRequest, setIncomingBlockRequest] = useState<any>(null);
    const [isWaitingForBlockResponse, setIsWaitingForBlockResponse] = useState(false);

    useEffect(() => {
        if (isDirectCall && !hasStartedMatch) {
            console.log('[DirectCall] Skipping PreMatchModal');
            setHasStartedMatch(true);
        }
    }, [isDirectCall, hasStartedMatch]);
    const [blockTimeLeft, setBlockTimeLeft] = useState("");
    const [displayedCredits, setDisplayedCredits] = useState<number | null>(null);
    const [showNextConfirm, setShowNextConfirm] = useState(false);
    const [privateSummary, setPrivateSummary] = useState<any>(null);
    const [isRequeuingBlocked, setIsRequeuingBlocked] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
    const [showBlockRefused, setShowBlockRefused] = useState(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isBlockedRef = useRef(isBlocked);
    const privateSummaryRef = useRef(privateSummary);

    // Sync refs for use in socket listeners (to avoid stale closures)
    useEffect(() => { isBlockedRef.current = isBlocked; }, [isBlocked]);
    useEffect(() => { privateSummaryRef.current = privateSummary; }, [privateSummary]);

    console.log(`[VideoRoom Render] isConnected: ${isConnected}, isMatching: ${isMatching}, remoteVideoTrack (bool): ${!!remoteVideoTrack}`);

    const handleNext = (force = false) => {
        if (!force && isBlockedRef.current) {
            setShowNextConfirm(true);
            return;
        }

        // --- NEW SAFETY: Cannot re-queue while looking at the money! ---
        if (privateSummaryRef.current && role === 'model') {
            console.log("[Block] Cannot re-queue while viewing summary modal.");
            return;
        }

        setIsBlocked(false);
        setBlockEndTime(null);
        setShowNextConfirm(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (onNext) onNext();
        else nextPartner();
    };

    const handleStartMatch = () => {
        setHasStartedMatch(true);
        joinQueue();
    };

    // Favorites Management
    useEffect(() => {
        if (role === 'user' && partnerInfo?.id) {
            const userId = localStorage.getItem('kinky_user_id');
            if (userId) {
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/favorites/check?userId=${userId}&modelId=${partnerInfo.id}`)
                    .then(res => res.json())
                    .then(data => setIsFavorite(data.isFavorite))
                    .catch(console.error);
            }
        } else {
            setIsFavorite(false);
        }
    }, [partnerInfo?.id, role]);

    const toggleFavorite = async () => {
        if (role !== 'user' || !partnerInfo?.id || isTogglingFavorite) return;
        const userId = localStorage.getItem('kinky_user_id');
        if (!userId) return;

        setIsTogglingFavorite(true);
        const action = isFavorite ? 'remove' : 'add';
        console.log(`[Favorites] Attempting to ${action}:`, { userId, modelId: partnerInfo.id });
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/favorites/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, modelId: partnerInfo.id })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsFavorite(!isFavorite);
                console.log(`[Favorites] Successfully ${action}ed`);
            } else {
                console.error(`[Favorites] Error during ${action}:`, data);
            }
        } catch (err) {
            console.error(`[Favorites] Network error during ${action}:`, err);
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    // Load state from localStorage on mount
    useEffect(() => {
        const storedStatus = (localStorage.getItem('kinky_account_status') as any) || 'guest';
        const storedId = localStorage.getItem('kinky_user_id');
        setAccountStatus(storedStatus);

        let storedCredits = localStorage.getItem('kinky_credits');
        if (storedCredits === null) {
            storedCredits = "5";
            localStorage.setItem('kinky_credits', storedCredits);
        }
        setUserCredits(Number(storedCredits));

        if (storedId) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/auth/me?id=${storedId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.credits !== undefined) {
                        setUserCredits(data.credits);
                        localStorage.setItem('kinky_credits', data.credits.toString());
                    }
                })
                .catch(console.error);
        }

        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/settings`)
            .then(res => res.json())
            .then(setSettings)
            .catch(console.error);

        if (role !== "user") return;

        // Restore block state if we are a model and just refreshed
        const savedBlock = localStorage.getItem(`active_block_${role}`);
        if (savedBlock) {
            try {
                const { roomId, blockEnd } = JSON.parse(savedBlock);
                // We'll trust the socket recovery more, but this is a fallback for UI stability
                console.log("[Block] Found saved block state in localStorage:", roomId);
                setIsBlocked(true);
                setBlockEndTime(blockEnd);
            } catch (e) {}
        }
    }, [role]);

    useEffect(() => {
        if (!socket) return;

        const handleOutOfCredits = () => {
            if (role === 'user') {
                setIsBlocked(false);
                setBlockEndTime(null);
                if (onCallEnd) onCallEnd();
                if (accountStatus === 'guest') setShowAuthModal(true);
                else setShowPaywall(true);
            }
        };

        const handlePartnerOutOfCredits = () => {
            if (role === 'model') {
                console.log("[Auto-Next] Partner out of credits. Gating check...");
                if (!isBlocked) {
                    handleNext();
                } else {
                    console.log("[Auto-Next] Private session summary expected, waiting for acknowledgment.");
                }
            }
        };

        const handleCreditsUpdate = (newCredits: number) => {
            if (role === 'user') {
                console.log(`[Socket Sync] Credits updated: ${newCredits}`);
                setUserCredits(newCredits);
                localStorage.setItem('kinky_credits', String(newCredits));
                
                // If it's the first time or we just jumped up (purchase), update displayed credits immediately
                setDisplayedCredits(prev => {
                    if (prev === null || newCredits > prev) return newCredits;
                    return prev;
                });

                if (newCredits <= 0) {
                    setIsBlocked(false);
                    setBlockEndTime(null);
                    if (onCallEnd) onCallEnd();
                    if (accountStatus === 'guest') setShowAuthModal(true);
                    else setShowPaywall(true);
                }
            }
        };

        const handlePayoutUpdate = (data: { rate: number; earned: number; totalBalance: number }) => {
            if (role === 'model') {
                setPayoutInfo(prev => ({ 
                    ...data, 
                    totalBalance: data.totalBalance !== undefined ? data.totalBalance : prev.totalBalance 
                }));
            }
        };

        const handleRequestBlockSession = (payload: any) => {
            if (role === 'model') {
                setIncomingBlockRequest(payload);
            }
        };

        const handleRespondBlockSession = (payload: any) => {
            if (role === 'user') {
                setIsWaitingForBlockResponse(false);
                if (!payload.accepted) {
                    setShowBlockRefused(true);
                }
            }
        };

        const handleBlockSessionStarted = (payload: { blockEnd: number; durationMin: number }) => {
            console.log("[Block] Session started officially:", payload);
            setIsBlocked(true);
            setBlockEndTime(payload.blockEnd);
            setIncomingBlockRequest(null);

            // Close all request-related modals on start
            setShowBlockRequestModal(false);
            setShowSpecialPackModal(false);
            setIsWaitingForBlockResponse(false);
            
            // Persist for recovery
            localStorage.setItem(`active_block_${role}`, JSON.stringify({
                blockEnd: payload.blockEnd,
                timestamp: Date.now()
            }));
        };

        const handleBlockSessionEnded = () => {
            console.log("[Block] Session ended signal received");
            setIsBlocked(false);
            setBlockEndTime(null);
            localStorage.removeItem(`active_block_${role}`);
        };

        const handlePartnerLeft = () => {
            console.log("[Socket] Partner left. isBlocked state (ref):", isBlockedRef.current);
            
            // We need to know if we were in a block to decide if we auto-requeue
            const processAutoNext = !isBlockedRef.current;

            setIsBlocked(false);
            setBlockEndTime(null);
            localStorage.removeItem(`active_block_${role}`);

            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            
            if (processAutoNext) {
                console.log("[Auto-Next] Ordinary session ended, re-joining queue");
                handleNext(true);
            } else {
                console.log("[Auto-Next] Private session ended, re-queueing gated by summary modal");
            }
        };
        

        const handlePrivateSummary = (data: any) => {
            console.log("[Block] Received private summary:", data);
            if (role === 'model') {
                setPrivateSummary(data);
                setIsRequeuingBlocked(true); // Prevent auto-requeue until acknowledged
            }
        };

        const handleCloseSummary = () => {
            console.log("[Block] Closing summary modal. Current state - isMatching:", isMatching, "remoteVideoTrack:", !!remoteVideoTrack);
            setPrivateSummary(null);
            setIsRequeuingBlocked(false);
            
            // Safety: If someone already matched us while we were on the summary,
            // we are already "in a match" (even if the video hasn't arrived).
            // In that case, DO NOT call handleNext, otherwise we skip the person.
            // But if we are clearly IDLE (not matching and no track), then we must rejoin.
            const isIdle = !isMatching && !remoteVideoTrack;
            
            if (isIdle) {
                console.log("[Block] Summary closed and idle, re-joining queue");
                handleNext(true);
            } else {
                console.log("[Block] Summary closed but match already in progress, skipping re-queue");
            }
        };

        const handleMatched = (data: any) => {
            console.log("[Socket] Matched event received in VideoRoom:", data);
            
            if (data.modelBalance !== undefined && role === 'model') {
                setPayoutInfo(prev => ({ ...prev, totalBalance: data.modelBalance }));
            }
            if (data.isBlocked) {
                console.log("[Block] Recovering active private session state from Matched event", data.blockEnd);
                setIsBlocked(true);
                setBlockEndTime(data.blockEnd);
                localStorage.setItem(`active_block_${role}`, JSON.stringify({
                    blockEnd: data.blockEnd,
                    timestamp: Date.now()
                }));
            }
            if (data.isRestricted && role === 'user') {
                console.log("[GeoRestricted] Fast-tracking paywall for restricted country");
                setIsRestricted(true);
                if (accountStatus === 'guest') setShowAuthModal(true);
                else setShowPaywall(true);
            } else {
                // Clear any stale block state from a previous session
                setIsBlocked(false);
                setBlockEndTime(null);
                localStorage.removeItem(`active_block_${role}`);
            }
        };

        socket.on('matched', handleMatched);
        socket.on('out_of_credits', handleOutOfCredits);
        socket.on('partner_out_of_credits', handlePartnerOutOfCredits);
        socket.on('credits_update', handleCreditsUpdate);
        socket.on('payout_update', handlePayoutUpdate);
        socket.on('request_block_session', handleRequestBlockSession);
        socket.on('respond_block_session', handleRespondBlockSession);
        socket.on('block_session_started', handleBlockSessionStarted);
        socket.on('block_session_ended', handleBlockSessionEnded);
        socket.on('private_session_summary', handlePrivateSummary);
        socket.on('partner_left', handlePartnerLeft);

        return () => {
            socket.off('out_of_credits', handleOutOfCredits);
            socket.off('partner_out_of_credits', handlePartnerOutOfCredits);
            socket.off('credits_update', handleCreditsUpdate);
            socket.off('payout_update', handlePayoutUpdate);
            socket.off('request_block_session', handleRequestBlockSession);
            socket.off('respond_block_session', handleRespondBlockSession);
            socket.off('block_session_started', handleBlockSessionStarted);
            socket.off('block_session_ended', handleBlockSessionEnded);
            socket.off('private_session_summary', handlePrivateSummary);
            socket.off('partner_left', handlePartnerLeft);
        };
    }, [socket, role, accountStatus, onNext, onCallEnd]);

    const handleSendBlockRequest = () => {
        if (!socket) return;
        const cost = settings?.blockCreditsCost || 600;
        
        if ((userCredits || 0) < cost) {
            setShowSpecialPackModal(true);
            return;
        }
        
        setIsWaitingForBlockResponse(true);
        socket.emit('request_block_session', {
            durationMin: settings?.blockDurationMin || 30,
            creditsCost: cost
        });
        setShowBlockRequestModal(false);
    };

    const handleRespondToBlock = (accepted: boolean) => {
        if (!socket || !incomingBlockRequest) return;
        
        socket.emit('respond_block_session', {
            accepted,
            requestorId: incomingBlockRequest.senderId,
            durationMin: incomingBlockRequest.durationMin,
            creditsCost: incomingBlockRequest.creditsCost
        });
        setIncomingBlockRequest(null);
    };

    useEffect(() => {
        if (!isBlocked || !blockEndTime) {
            setBlockTimeLeft("");
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = blockEndTime - now;
            if (diff <= 0) {
                setBlockTimeLeft("00:00");
                clearInterval(interval);
                
                // --- Safe-Cleanup Fallback ---
                // If the server is late with the 'block_session_ended' event, 
                // we clean up locally after a 3s grace period to unblock the UI.
                setTimeout(() => {
                    setIsBlocked(current => {
                        if (current) {
                            console.log("[Block Timer] Server event late, cleaning up locally.");
                            setBlockEndTime(null);
                            return false;
                        }
                        return current;
                    });
                }, 3000);
                return;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setBlockTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [isBlocked, blockEndTime]);

    if (isLaunch || isLaunchOverride) {
        return <LaunchPage />;
    }

    // Teaser logic (only for 0-credit entries)
    const teaserTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (role !== "user" || !isConnected || userCredits === null) {
            if (teaserTimerRef.current) {
                clearTimeout(teaserTimerRef.current);
                teaserTimerRef.current = null;
            }
            return;
        }

        // --- 0 CREDITS TEASER (on initial connect only) ---
        if (userCredits <= 0) {
            if (isRestricted) return; // Already handled by immediate paywall

            console.log("[Teaser] Starting 4s teaser countdown");
            teaserTimerRef.current = setTimeout(() => {
                console.log("[Teaser] Teaser ended");
                if (accountStatus === 'guest') setShowAuthModal(true);
                else setShowPaywall(true);
            }, 4000);
            return () => {
                if (teaserTimerRef.current) clearTimeout(teaserTimerRef.current);
            };
        }
    }, [role, isConnected, userCredits, accountStatus]);

    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream || previewStream;
        }
    }, [localStream, previewStream, hasStartedMatch]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const userCreditsRef = useRef(userCredits);
    useEffect(() => { userCreditsRef.current = userCredits; }, [userCredits]);

    // Visual Throttling: Sync displayedCredits with userCredits every 20 seconds
    useEffect(() => {
        if (role !== 'user' || !isConnected || isMatching || !remoteVideoTrack) {
            // Not in an active call, keep sync
            if (userCredits !== null && (displayedCredits === null || Math.abs((displayedCredits || 0) - userCredits) > 5)) {
                setDisplayedCredits(userCredits);
            }
            return;
        }

        const interval = setInterval(() => {
            console.log(`[Throttle] Syncing displayed credits to latest: ${userCreditsRef.current}`);
            setDisplayedCredits(userCreditsRef.current);
        }, 20000);

        return () => clearInterval(interval);
    }, [role, isConnected, isMatching, !!remoteVideoTrack]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleToggleAudio = () => {
        toggleAudio();
        setIsAudioMuted(!isAudioMuted);
    };

    const handleToggleVideo = () => {
        toggleVideo();
        setIsVideoMuted(!isVideoMuted);
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            sendMessage(chatInput);
            setChatInput("");
            setShowEmojiPicker(false);
        }
    };

    const onEmojiClick = (emojiData: any) => {
        setChatInput(prev => prev + emojiData.emoji);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showEmojiPicker && !target.closest('.emoji-picker-container') && !target.closest('.emoji-toggle-btn')) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    const captureScreenshots = async (): Promise<string[]> => {
        const video = remoteVideoRef.current;
        if (!video) return [];

        const screenshots: string[] = [];
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");

        for (let i = 0; i < 3; i++) {
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                screenshots.push(canvas.toDataURL("image/jpeg", 0.7));
            }
            if (i < 2) await new Promise(r => setTimeout(r, 500));
        }
        return screenshots;
    };

    const handleReportSubmit = async () => {
        if (!reportReason || isReporting) return;
        setIsReporting(true);
        setReportError("");

        try {
            const screenshots = await captureScreenshots();
            const reporterId = localStorage.getItem('kinky_user_id') || 'unknown';
            const reporterName = localStorage.getItem('kinky_user_pseudo') || 'Guest';
            const reporterRole = localStorage.getItem('kinky_user_role') || 'guest';

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live";
            const response = await fetch(`${backendUrl}/api/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterId,
                    reporterName,
                    reporterRole,
                    reason: reportReason,
                    screenshots,
                    reportedId: partnerInfo?.id || 'unknown',
                    reportedName: partnerInfo?.name || 'Unknown',
                    reportedRole: partnerInfo?.role || (role === 'model' ? 'user' : 'model')
                })
            });

            if (response.ok) {
                setReportSuccess(true);
                setTimeout(() => {
                    setIsReportModalOpen(false);
                    setReportSuccess(false);
                    setReportReason("");
                }, 2000);
            } else {
                setReportError("report.error.failed");
            }
        } catch (err) {
            console.error("Report failed:", err);
            setReportError("report.error.network");
        } finally {
            setIsReporting(false);
        }
    };


    return (
        <LiveKitRoom
            room={room || undefined}
            token=""
            serverUrl=""
            data-testid="livekit-room"
        >
            <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-neutral-950 text-white font-sans overflow-hidden no-scroll overscroll-none touch-none">
            {!hasStartedMatch && (
                <PreMatchModal localStream={localStream} onJoin={handleStartMatch} role={role as any} />
            )}

            <OrientationGuard />


            <div className="flex-1 relative flex items-center justify-center overflow-hidden h-[100dvh]">

                <div className="absolute top-6 left-6 z-40 pointer-events-none">
                    <span className="text-xl md:text-3xl font-black tracking-tighter text-white drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span></span>
                </div>

                {showAuthModal && (
                    <UnifiedAuthModal 
                        onClose={() => {
                            setShowAuthModal(false);
                            if (role === 'user' && (userCredits === null || userCredits <= 0)) {
                                router.push(`/${language}`);
                            }
                        }}
                        onSuccess={(id, email, userRole, name, credits) => {
                            localStorage.setItem('kinky_account_status', 'registered');
                            localStorage.setItem('kinky_user_id', id);
                            localStorage.setItem('kinky_user_email', email);
                            localStorage.setItem('kinky_user_pseudo', name);
                            localStorage.setItem('kinky_user_role', userRole);
                            localStorage.setItem('kinky_credits', String(credits));
                            setAccountStatus('registered');
                            setUserCredits(credits);
                            setShowAuthModal(false);
                            nextPartner();
                        }} />
                )}

                {showPaywall && (
                    <PaywallModal
                        onClose={() => {
                            setShowPaywall(false);
                            if (userCredits !== null && userCredits <= 0) {
                                router.push('/');
                            }
                        }}
                        onPurchase={async (credits, priceUsd) => {
                            const userId = localStorage.getItem('kinky_user_id');
                            if (userId) {
                                try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/auth/add-credits`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId, amount: credits, priceUsd })
                                    });
                                    if (!res.ok) {
                                        console.error('[Purchase] Failed to sync credits with backend:', await res.text());
                                        alert(t('billing.error_sync'));
                                        return;
                                    }
                                } catch (err) {
                                    console.error('[Purchase Exception]', err);
                                    alert(t('billing.error_network'));
                                    return;
                                }
                            }

                            localStorage.setItem('kinky_account_status', 'premium');
                            const newBalance = (userCredits || 0) + credits;
                            localStorage.setItem('kinky_credits', newBalance.toString());
                            setAccountStatus('premium');
                            setUserCredits(newBalance);
                            setShowPaywall(false);
                            nextPartner();
                        }}
                    />
                )}

                {/* User Credit Counter */}
                {role === "user" && isConnected && !showPaywall && !showAuthModal && userCredits !== null && (
                    <div className={`absolute top-16 left-6 md:top-6 md:right-6 md:left-auto z-30 flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-lg transition-all duration-700 overflow-hidden ${userCredits <= 2 ? 'max-w-[calc(100vw-3rem)] md:max-w-2xl border-red-500/50 shadow-red-500/20' : 'max-w-fit'}`}>
                        <div className="flex items-center gap-2">
                            <span className="text-white/80 text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap hidden sm:block">{t('room.balance')}</span>
                            <span className={`font-mono text-xs md:text-lg font-bold whitespace-nowrap flex items-center gap-1.5 ${userCredits <= 2 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                    {displayedCredits !== null ? Math.floor(displayedCredits) : (userCredits !== null ? Math.floor(userCredits) : 0)} <Coins size={12} className="md:w-[18px] text-yellow-400 fill-yellow-500/30" />
                            </span>
                            
                            {/* Constant Purchase Button */}
                            <button 
                                onClick={() => {
                                    if (accountStatus === 'guest') setShowAuthModal(true);
                                    else setShowPaywall(true);
                                }}
                                className="ml-1 md:ml-2 p-1 md:p-1.5 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/40 rounded-full text-yellow-400 transition-all hover:scale-110 active:scale-95"
                                title={t('room.topup')}
                            >
                                <Plus size={14} className="md:w-4 md:h-4 font-black" />
                            </button>
                        </div>

                        {userCredits <= 2 && (
                            <div className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 ml-2 border-l border-white/10">
                                <span className="text-[10px] text-red-400 font-bold animate-pulse hidden md:block uppercase tracking-tighter">
                                    {t('room.low_balance_warning')}
                                </span>
                            </div>
                        )}
                    </div>
                )}
                {/* Model Earning Counter */}
                {role === "model" && isConnected && (
                    <div className="absolute top-[160px] right-4 md:top-6 md:right-6 z-30 flex flex-col items-end gap-2">
                        <EarningsCounter 
                            hasVideo={!!remoteVideoTrack} 
                            currentRate={payoutInfo.rate} 
                            totalBalance={payoutInfo.totalBalance} 
                        />
                    </div>
                )}


                {/* Remote Video (Full Screen) */}
                <div className="absolute inset-0 z-0 h-[100dvh]">
                    {remoteVideoTrack ? (
                        <VideoTrack
                            trackRef={remoteVideoTrack}
                            className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${(isMatching || isConnecting || showPaywall) ? "blur-2xl opacity-40 scale-105" : "blur-0 opacity-100 scale-100"}`}
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-950" />
                    )}
                    {(isConnected === false || isMatching === true || isConnecting === true) && !showPaywall && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black transition-all duration-1000 overflow-hidden z-[60]">
                            {/* Glowing Orbs for Sexy Vibe */}
                            <div className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                            <div className="absolute w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

                            <div className="w-20 h-20 md:w-28 md:h-28 border-[3px] border-white/5 border-t-indigo-500 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(99,102,241,0.5)] relative z-10"></div>

                            <h2 className="text-sm sm:text-lg md:text-3xl font-extralight tracking-[0.2em] text-white/90 animate-pulse relative z-10 text-center px-12 uppercase leading-relaxed">
                                {(isConnecting && !isMatching) ? t('room.connecting') : t('room.searching')}
                                {isMatching && queuePosition !== null && (
                                    <div className="mt-4 text-xs md:text-sm font-bold text-pink-500/80 tracking-widest uppercase animate-pulse">
                                        {t('room.queue_position', { position: queuePosition })}
                                    </div>
                                )}
                            </h2>
                        </div>
                    )}

                    {/* Reconnecting Overlay */}
                    {connectionQuality === 'reconnecting' && isConnected && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl transition-all duration-500">
                             <div className="w-16 h-16 border-4 border-white/5 border-t-yellow-500 rounded-full animate-spin mb-6"></div>
                             <h2 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
                                 {t('room.reconnecting') || "Reconnecting..."}
                             </h2>
                             <p className="text-white/40 text-sm mt-2 uppercase tracking-tighter">
                                 {t('room.stabilizing') || "Stabilizing your connection"}
                             </p>
                        </div>
                    )}
                </div>

                {/* Local Video (Top Right on Mobile) */}
                {hasStartedMatch && (
                    <div className="absolute top-4 right-4 md:top-auto md:bottom-24 md:left-6 md:right-auto z-[100] w-24 md:w-48 aspect-[3/4] bg-neutral-900 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 transition-all duration-500">
                        {localVideoTrack ? (
                            <VideoTrack
                                trackRef={localVideoTrack}
                                className={`w-full h-full object-cover ${isVideoMuted ? "opacity-0" : "opacity-100"}`}
                            />
                        ) : (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${(isVideoMuted || (!localStream && !previewStream)) ? "opacity-0" : "opacity-100"}`}
                            />
                        )}
                        
                        {/* Mobile Mic Toggle Overlay */}
                        <div className="md:hidden absolute bottom-2 right-2">
                            <button
                                onClick={handleToggleAudio}
                                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all backdrop-blur-md border ${isAudioMuted ? "bg-red-500/80 border-red-500/50 text-white" : "bg-black/40 border-white/10 text-white"}`}
                            >
                                {isAudioMuted ? <MicOff size={14} /> : <Mic size={14} />}
                            </button>
                        </div>

                        {isVideoMuted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                                <VideoOff className="w-6 h-6 md:w-8 md:h-8 text-neutral-500" />
                            </div>
                        )}
                    </div>
                )}

                {/* Block Session Timer (Overlaid on Video) */}
                {isBlocked && (
                    <div className="absolute top-[115px] left-6 md:top-[110px] md:right-6 md:left-auto md:translate-x-0 z-40 bg-black/60 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-pink-500/30 flex items-center gap-2 md:gap-3 shadow-xl shadow-pink-500/10 transition-all duration-500">
                        <Timer className="text-pink-500 w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-base md:text-xl font-mono font-black text-white tracking-widest">{blockTimeLeft}</span>
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-bold text-pink-400 uppercase tracking-tighter leading-none">{t('room.block_timer_label')}</span>
                            <span className="text-[6px] md:text-[8px] text-white/50 uppercase leading-none">{t('room.block_locked_label')}</span>
                        </div>
                    </div>
                )}

                {/* Mobile Right Sidebar Controls */}
                <div className="flex md:hidden absolute top-1/2 -translate-y-[40%] right-4 z-40 flex-col gap-4">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-500/80 border border-orange-400/50 text-white backdrop-blur-md"
                    >
                        <ShieldAlert size={20} />
                    </button>
                    <button
                        onClick={() => setShowExitConfirm(true)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-600/80 border border-red-500/50 text-white backdrop-blur-md"
                    >
                        <PhoneOff size={20} />
                    </button>
                    {/* User Block Button */}
                    {role === 'user' && isConnected && !isBlocked && (
                        <button
                            onClick={() => setShowBlockRequestModal(true)}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-pink-600/80 border border-pink-500/50 text-white backdrop-blur-md shadow-lg shadow-pink-500/20"
                        >
                            <Lock size={20} />
                        </button>
                    )}
                    {/* Favorite Button */}
                    {role === 'user' && partnerInfo?.id && localStorage.getItem('kinky_user_id') && (
                        <button
                            onClick={toggleFavorite}
                            disabled={isTogglingFavorite}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border shadow-lg transition-all duration-300 ${isFavorite ? "bg-violet-600 border-violet-400 text-white scale-110" : "bg-white border-neutral-200 text-neutral-400"}`}
                        >
                            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} className={`${isTogglingFavorite ? "animate-pulse" : ""} ${isFavorite ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}`} />
                        </button>
                    )}
                </div>

                {/* NEXT Button (Above Input on mobile, Bottom Center on desktop) */}
                <div className="absolute bottom-[100px] right-4 md:bottom-8 md:right-auto md:left-1/2 md:-translate-x-1/2 z-40 flex flex-col items-center gap-3">
                    <button
                        onClick={() => handleNext()}
                        disabled={isBlocked && role === 'model'}
                        className={`group relative flex items-center justify-center px-6 py-3 md:px-12 md:py-5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 ${isBlocked && role === 'model' ? 'opacity-50 grayscale cursor-not-allowed scale-95' : ''}`}
                    >
                        <div className="flex items-center gap-2 relative z-10">
                            <SkipForward className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                            <span className="text-white font-black tracking-widest uppercase text-[12px] md:text-lg leading-none">{t('room.next')}</span>
                        </div>
                    </button>
                </div>

                {/* Desktop Controls (Hidden on Mobile) */}
                <div className="hidden md:flex absolute bottom-8 right-6 z-40 flex-row gap-4">
                    <button onClick={handleToggleAudio} className={`p-4 rounded-full ${isAudioMuted ? "bg-red-500" : "bg-white/10"}`}><Mic size={24} /></button>
                    <button onClick={() => setIsReportModalOpen(true)} className="p-4 rounded-full bg-orange-600/80 hover:bg-orange-500 transition-colors border border-orange-400/30">
                        <ShieldAlert size={24} />
                    </button>
                    <button onClick={() => setShowExitConfirm(true)} className="p-4 rounded-full bg-red-600 hover:bg-red-500 transition-colors shadow-lg"><PhoneOff size={24} /></button>
                    {/* Favorite Button Desktop */}
                    {role === 'user' && partnerInfo?.id && localStorage.getItem('kinky_user_id') && (
                        <button
                            onClick={toggleFavorite}
                            disabled={isTogglingFavorite}
                            className={`p-4 rounded-full transition-all duration-300 border shadow-xl flex items-center justify-center ${isFavorite ? "bg-violet-600 border-violet-400 text-white scale-110" : "bg-white border-neutral-200 text-neutral-400 hover:text-violet-500 hover:border-violet-200"}`}
                            title={isFavorite ? t('favorite.remove') : t('favorite.add')}
                        >
                            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} className={`${isTogglingFavorite ? "animate-pulse" : ""} ${isFavorite ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""}`} />
                        </button>
                    )}
                    {/* User Block Button Desktop */}
                    {role === 'user' && isConnected && !isBlocked && (
                        <button
                            onClick={() => setShowBlockRequestModal(true)}
                            className="p-4 rounded-full bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-lg shadow-pink-500/20 active:scale-95"
                            title={t('room.block_cta_tooltip')}
                        >
                            <Lock size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="absolute bottom-0 left-0 w-full md:relative md:w-96 md:h-full z-40 flex flex-col justify-end">
                <div className="flex flex-col bg-transparent md:bg-neutral-900/50 md:backdrop-blur-3xl md:border-l md:border-white/5 h-full max-h-[40dvh] md:max-h-full">
                    <div className="flex-1 overflow-y-auto px-4 pr-32 md:pr-6 md:p-6 space-y-3 [mask-image:linear-gradient(to_bottom,transparent,black_20%)] md:[mask-image:none]">
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full text-white/30 text-sm hidden md:flex">
                                {t('room.chat_quiet')}
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === socketId;
                            return (
                                <ChatMessage
                                    key={i}
                                    message={msg}
                                    isMe={isMe}
                                />
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-4 md:p-6 bg-transparent md:bg-neutral-950/80 flex items-center gap-2 relative">
                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-4 md:right-6 z-50 mb-4 emoji-picker-container shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.DARK}
                                    lazyLoadEmojis={true}
                                    searchPlaceholder={t('common.search') || "Search..."}
                                    width={320}
                                    height={400}
                                    skinTonesDisabled
                                />
                            </div>
                        )}
                        <div className="relative flex-1">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("[Emoji] Toggle clicked, current state:", showEmojiPicker);
                                    setShowEmojiPicker(!showEmojiPicker);
                                }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 transition-colors emoji-toggle-btn z-20"
                                title="Emoji"
                            >
                                <Smile size={20} />
                            </button>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={t('room.chat_placeholder')}
                                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-base text-white focus:outline-none focus:border-indigo-500 transition-all backdrop-blur-md"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                <SendHorizontal size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* REPORT MODAL */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
                        <button 
                            onClick={() => setIsReportModalOpen(false)}
                            className="absolute top-6 right-6 text-white/50 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-8">
                            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/30">
                                <ShieldAlert size={32} className="text-orange-500" />
                            </div>

                            <h2 className="text-2xl font-black mb-2">{t('report.modal.title')}</h2>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed">
                                {t('report.modal.desc')}
                            </p>

                            {reportError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold rounded-xl text-center animate-shake uppercase">
                                    {t(reportError)}
                                </div>
                            )}

                            {reportSuccess ? (
                                <div className="py-8 flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                        <CheckCircle2 size={32} className="text-green-500" />
                                    </div>
                                    <p className="text-green-400 font-bold">{t('report.success')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {[
                                        { id: 'nudity', key: 'report.reason.nudity' },
                                        { id: 'harassment', key: 'report.reason.harassment' },
                                        { id: 'scam', key: 'report.reason.scam' },
                                        { id: 'underage', key: 'report.reason.underage' },
                                        { id: 'other', key: 'report.reason.other' },
                                    ].map((reason) => (
                                        <button
                                            key={reason.id}
                                            onClick={() => setReportReason(reason.id)}
                                            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                                                reportReason === reason.id 
                                                ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' 
                                                : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="font-semibold text-sm">{t(reason.key)}</span>
                                            {reportReason === reason.id && <CheckCircle2 size={18} />}
                                        </button>
                                    ))}

                                    <button
                                        disabled={!reportReason || isReporting}
                                        onClick={handleReportSubmit}
                                        className="w-full mt-6 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                                    >
                                        {isReporting ? (
                                            <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            t('report.submit')
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* EXIT CONFIRMATION MODAL */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 relative">
                        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30 mx-auto">
                            <PhoneOff size={32} className="text-red-500" />
                        </div>

                        <h2 className="text-2xl font-black mb-6 text-center">{t('room.exit_confirm_title')}</h2>
                        
                        <div className={`p-6 rounded-[2rem] mb-8 flex flex-col items-center gap-4 transition-all ${
                            isBlocked && role === 'model' 
                            ? 'bg-red-500/20 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                            : 'bg-white/5 border border-white/10'
                        }`}>
                            {isBlocked && role === 'model' && (
                                <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/40 border-4 border-white/20">
                                    <ShieldAlert size={32} className="text-white" />
                                </div>
                            )}
                            <p className={`${isBlocked && role === 'model' ? 'text-white font-black text-lg' : 'text-white/60 text-sm'} leading-tight text-center`}>
                                {(isBlocked && role === 'model') 
                                    ? t('room.exit_confirm_private_model') 
                                    : t('room.exit_confirm_desc')
                                }
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all active:scale-95"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (socket) socket.emit('stop');
                                    window.location.href = `/${language}`;
                                }}
                                className="py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-sm hover:bg-red-500 transition-all active:scale-95 shadow-xl shadow-red-600/20"
                            >
                                {t('room.exit_confirm_action')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BLOCK REQUEST MODAL (USER SIDE) */}
            {showBlockRequestModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl transition-all">
                    <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/30">
                            <Lock size={32} className="text-pink-500" />
                        </div>

                        <h2 className="text-2xl font-black mb-4">{t('room.block_request_title', { duration: settings?.blockDurationMin || 30 })}</h2>
                        <p className="text-white/60 text-sm mb-8 leading-relaxed">
                            {t('room.block_request_desc', { duration: settings?.blockDurationMin || 30 })}
                        </p>

                        <div className="bg-white/5 rounded-2xl p-4 mb-8 flex items-center justify-between border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t('room.block_cost_label')}</span>
                                <span className="text-xl font-black text-white">{settings?.blockCreditsCost || 600} {t('room.block_credits_unit')}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t('common.premium')}</span>
                                <span className="text-xs text-pink-400 font-bold uppercase tracking-widest">{t('room.block_premium_label')}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleSendBlockRequest}
                                disabled={isWaitingForBlockResponse}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isWaitingForBlockResponse ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Check size={18} />}
                                {isWaitingForBlockResponse ? t('room.block_request_sent') : t('room.block_send_request')}
                            </button>
                            <button
                                onClick={() => setShowBlockRequestModal(false)}
                                className="w-full py-4 text-white/40 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                            >
                                {t('room.block_cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SPECIAL PACK MODAL (USER SIDE) */}
            {showSpecialPackModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="w-full max-w-sm bg-[#0a0a0a] border-2 border-indigo-500/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -mr-24 -mt-24" />
                        
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                            <Sparkles size={32} className="text-indigo-400" />
                        </div>

                        <h2 className="text-2xl font-black mb-4">{t('room.block_insufficient_credits')}</h2>
                        <p className="text-white/60 text-sm mb-8 leading-relaxed">
                            {t('room.block_special_offer_desc', { duration: settings?.blockDurationMin || 30 })}
                        </p>

                        <div className="bg-indigo-500/10 rounded-3xl p-6 mb-8 border border-indigo-500/20 relative">
                            <div className="absolute -top-3 -right-3 bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-bounce">{t('room.block_best_deal')}</div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-white">{settings?.blockCreditsCost || 600}</span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t('room.block_credits_pack')}</span>
                                </div>
                                <div className="text-4xl font-light text-white/20">/</div>
                                <div className="flex flex-col items-end">
                                    <span className="text-3xl font-black text-white">${settings?.blockSpecialPackPrice || 59}</span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t('room.block_one_time_offer')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    const cost = settings?.blockCreditsCost || 600;
                                    const price = settings?.blockSpecialPackPrice || 59;
                                    if (onPurchase) {
                                        await onPurchase(cost, price);
                                        setShowSpecialPackModal(false);
                                        // Auto-request block after purchase
                                        setTimeout(() => {
                                            socket?.emit('request_block_session', {
                                                durationMin: settings?.blockDurationMin || 30,
                                                creditsCost: cost
                                            });
                                            setIsWaitingForBlockResponse(true);
                                        }, 1000);
                                    }
                                }}
                                className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                            >
                                <Coins size={20} />
                                {t('room.block_buy_and_continue')}
                            </button>
                            <button
                                onClick={() => setShowSpecialPackModal(false)}
                                className="w-full py-4 text-white/40 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
                            >
                                {t('room.block_no_thanks')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* INCOMING REQUEST MODAL (MODEL SIDE) */}
            {incomingBlockRequest && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-sm bg-neutral-900 border-2 border-pink-500/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/30">
                            <Sparkles size={32} className="text-pink-500" />
                        </div>

                        <h2 className="text-2xl font-black mb-4">{t('room.block_incoming_title')}</h2>
                        <p className="text-white/60 text-sm mb-8 leading-relaxed">
                            {t('room.block_incoming_desc', { duration: incomingBlockRequest.durationMin || 30 })}
                        </p>

                        <div className="bg-pink-500/10 rounded-2xl p-6 mb-8 border border-pink-500/20 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{t('room.block_bonus_label')}</span>
                            <span className="text-4xl font-black text-white">${settings?.blockModelGain || 25}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleRespondToBlock(true)}
                                className="py-4 bg-green-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-green-400 transition-all active:scale-95"
                            >
                                {t('room.block_accept')}
                            </button>
                            <button
                                onClick={() => handleRespondToBlock(false)}
                                className="py-4 bg-white/10 text-white/50 font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white/20 transition-all active:scale-95"
                            >
                                {t('room.block_refuse')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEXT CONFIRMATION MODAL */}
            {showNextConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="text-pink-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{t('room.next_confirm_title')}</h3>
                        <p className="text-white/60 text-sm mb-8 leading-relaxed">
                            {role === 'user' 
                                ? t('room.next_confirm_user_desc')
                                : t('room.next_confirm_model_desc')
                            }
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleNext(true)}
                                className="w-full py-4 bg-pink-600 hover:bg-pink-500 rounded-2xl font-bold transition-all"
                            >
                                {t('common.confirm') || "Confirmer"}
                            </button>
                            <button
                                onClick={() => setShowNextConfirm(false)}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all"
                            >
                                {t('common.cancel') || "Annuler"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BLOCK REFUSED MODAL (USER SIDE) */}
            {showBlockRefused && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <X className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{t('room.block_refused_title')}</h3>
                        <p className="text-white/60 text-sm mb-8 leading-relaxed">
                            {t('room.block_refused_desc')}
                        </p>
                        <button
                            onClick={() => setShowBlockRefused(false)}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all text-white"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            )}

            {/* PRIVATE EARNINGS SUMMARY MODAL */}
            {privateSummary && (
                // ... (summary content)
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="w-full max-w-md bg-neutral-900/50 border border-indigo-500/30 rounded-[3rem] p-10 shadow-[0_0_50px_rgba(99,102,241,0.2)] text-center relative overflow-hidden">
                        {/* Background Decorations */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                        
                        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
                            <Sparkles className="text-white -rotate-12" size={48} />
                        </div>

                        <h3 className="text-3xl font-black tracking-tight mb-2 uppercase italic">{t('room.private_summary_title')}</h3>
                        <p className="text-indigo-300/80 text-xs font-bold tracking-[0.3em] uppercase mb-8">{t('room.private_summary_subtitle')}</p>
                        
                        <div className="bg-black/40 rounded-[2rem] p-8 mb-8 border border-white/5">
                            <div className="flex flex-col gap-1 mb-6">
                                <span className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none">{t('room.earned_amount_label')}</span>
                                <span className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
                                    ${parseFloat(privateSummary.earned).toFixed(2)}
                                </span>
                            </div>
                            
                            <div className="h-px bg-white/5 w-1/2 mx-auto mb-6" />
                            
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">{t('room.duration_label')}</span>
                                    <span className="text-sm font-bold text-white/90">{Math.floor(privateSummary.durationSec / 60)} min {privateSummary.durationSec % 60}s</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">{t('room.status_label')}</span>
                                    <span className="text-sm font-bold text-indigo-400">
                                        {t(`room.summary_reason_${privateSummary.reason}`)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setPrivateSummary(null);
                                setIsRequeuingBlocked(false);
                                handleNext(true); // Now join next partner
                            }}
                            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                        >
                            {t('room.private_summary_close')}
                            <SkipForward size={20} fill="currentColor" />
                        </button>
                    </div>
                </div>
            )}

            {/* DIRECT CALL LISTENER (MODEL SIDE) */}
            <CallListener />
            {/* LiveKit Audio Handling (Silent) */}
            {isConnected && !isConnecting && !isMatching && room && <RoomAudioRenderer />}
            </div>
        </LiveKitRoom>
    );
}

function ChatMessage({ message, isMe }: { message: any; isMe: boolean }) {
    const hasTranslation = !isMe && message.originalText && message.text !== message.originalText;

    // Browser-native decoder as a safeguard
    const decodeHTML = (html: string) => {
        if (!html || typeof window === 'undefined') return html;
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div className="flex flex-row justify-start w-full animate-chat-bubble">
            <div className="flex flex-col gap-1.5 max-w-[85%]">
                <div
                    className={`px-4 py-2 rounded-2xl text-[13px] text-left break-words bg-white text-neutral-900 shadow-sm border-[1.5px] ${
                        message.senderRole === 'model' 
                        ? 'border-pink-500/50' 
                        : 'border-sky-500/50'
                    }`}
                >
                    <div className="flex flex-col gap-1">
                        <span className="leading-relaxed">
                            {message.senderPseudo && (
                                <span className={`font-semibold mr-1.5 capitalize ${
                                    message.senderRole === 'model' 
                                    ? 'text-pink-600' 
                                    : 'text-sky-600'
                                }`}>
                                    {message.senderPseudo}:
                                </span>
                            )}
                            {decodeHTML(message.text)}
                        </span>
                        {hasTranslation && (
                            <span className="text-[11px] text-neutral-400 italic leading-tight border-t border-neutral-100 pt-1 mt-1">
                                {decodeHTML(message.originalText)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
