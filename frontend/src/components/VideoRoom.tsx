"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, SkipForward, Send, LayoutDashboard, Coins, PhoneOff, SendHorizontal, AlertCircle, ShieldAlert, X, CheckCircle2, Sparkles } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { MaintenanceGuard } from "./MaintenanceGuard";
import { LaunchPage } from "./LaunchPage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PaywallModal } from "./PaywallModal";
import { UnifiedAuthModal } from "./UnifiedAuthModal";
import { PreMatchModal } from "./PreMatchModal";
import { OrientationGuard } from "./OrientationGuard";


function EarningsCounter({ hasVideo, currentRate, totalEarned }: { hasVideo: boolean; currentRate: number; totalEarned: number }) {
    const { t } = useTranslation();

    return (
        <div className="absolute top-[160px] right-4 md:top-6 md:right-6 z-30 flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all">
                <span className="text-white/80 text-xs font-semibold tracking-wider uppercase hidden sm:block">{t('room.earnings_call')}</span>
                <span className="text-green-400 font-mono text-base sm:text-lg font-bold">
                    ${totalEarned.toFixed(2)}
                </span>
            </div>
            {currentRate > 0 && (
                <div className="px-3 py-1 bg-indigo-500/80 backdrop-blur-md rounded-full border border-indigo-400/30 text-[10px] font-black uppercase tracking-tighter shadow-lg animate-in slide-in-from-right-4 duration-500">
                    {t('room.current_rate', { rate: currentRate.toFixed(2) })}
                </div>
            )}
        </div>
    );
}

interface VideoRoomProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMatching: boolean;
    isConnected: boolean;
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
    handleOutOfCredits: () => void;
    partnerInfo: { email: string; role: string; name: string } | null;
    language: string;
    onCreditsUpdate: (credits: number) => void;
    onCallEnd: () => void;
    queuePosition?: number | null;
    isLaunch?: boolean;
    isLaunchOverride?: boolean;
    packs?: any[];
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
    packs
}: VideoRoomProps) {
    const { t, language } = useTranslation();
    const router = useRouter();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [accountStatus, setAccountStatus] = useState<'guest' | 'registered' | 'premium'>('guest');
    const [userCredits, setUserCredits] = useState<number | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [hasStartedMatch, setHasStartedMatch] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState("");
    const [payoutInfo, setPayoutInfo] = useState({ rate: 0, earned: 0 });

    // Load state from localStorage on mount
    useEffect(() => {
        if (role !== "user") return;
        const storedStatus = (localStorage.getItem('kinky_account_status') as any) || 'guest';
        const storedEmail = localStorage.getItem('kinky_user_email');
        console.log(`[VideoRoom] Init - Status: ${storedStatus}, Email: ${storedEmail}`);
        setAccountStatus(storedStatus);

        let storedCredits = localStorage.getItem('kinky_credits');
        if (storedCredits === null) {
            // New guest starts with 5 credits (which is 30s at $1/min)
            storedCredits = "5";
            localStorage.setItem('kinky_credits', storedCredits);
        }
        setUserCredits(Number(storedCredits));
    }, [role]);

    useEffect(() => {
        if (!socket) return;

        const handleOutOfCredits = () => {
            if (role === 'user') {
                if (onCallEnd) onCallEnd();
                if (accountStatus === 'guest') setShowAuthModal(true);
                else setShowPaywall(true);
            }
        };

        const handlePartnerOutOfCredits = () => {
            if (role === 'model') {
                console.log("[Auto-Next] Partner out of credits, re-joining queue");
                onNext();
            }
        };

        const handleCreditsUpdate = (newCredits: number) => {
            if (role === 'user') {
                console.log(`[Socket Sync] Credits updated: ${newCredits}`);
                setUserCredits(newCredits);
                localStorage.setItem('kinky_credits', String(newCredits));
                
                if (newCredits <= 0) {
                    if (onCallEnd) onCallEnd();
                    if (accountStatus === 'guest') setShowAuthModal(true);
                    else setShowPaywall(true);
                }
            }
        };

        const handlePayoutUpdate = (data: { rate: number; earned: number }) => {
            if (role === 'model') {
                setPayoutInfo(data);
            }
        };

        socket.on('out_of_credits', handleOutOfCredits);
        socket.on('partner_out_of_credits', handlePartnerOutOfCredits);
        socket.on('credits_update', handleCreditsUpdate);
        socket.on('payout_update', handlePayoutUpdate);

        return () => {
            socket.off('out_of_credits', handleOutOfCredits);
            socket.off('partner_out_of_credits', handlePartnerOutOfCredits);
            socket.off('credits_update', handleCreditsUpdate);
            socket.off('payout_update', handlePayoutUpdate);
        };
    }, [socket, role, accountStatus, onNext, onCallEnd]);

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
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

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
        }
    };

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
            const reporterEmail = localStorage.getItem('kinky_user_email') || 'Guest';
            const reporterName = localStorage.getItem('kinky_user_pseudo') || 'Guest';
            const reporterRole = localStorage.getItem('kinky_user_role') || 'guest';

            // We don't have the reported email directly in props, 
            // but we can assume the backend knows who is in the room.
            // However, the instructions say "capture screenshots of the reported party".
            // For now, we send what we have. 
            // In a real scenario, the signaling server would provide peer info.
            // I'll use a placeholder 'peer@example.com' or similar if not available, 
            // but ideally we should have it.
            
            // Let's check if we can get the peer info. 
            // The backend report.js expects reportedEmail.
            
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            const response = await fetch(`${backendUrl}/api/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterEmail,
                    reporterName,
                    reporterRole,
                    reason: reportReason,
                    screenshots,
                    reportedEmail: partnerInfo?.email || 'unknown@kinky.live',
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

    const handleStartMatch = () => {
        setHasStartedMatch(true);
        joinQueue();
    };

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-neutral-950 text-white font-sans overflow-hidden no-scroll overscroll-none touch-none">
            {!hasStartedMatch && (
                <PreMatchModal localStream={localStream} onJoin={handleStartMatch} role={role as any} />
            )}

            <OrientationGuard />


            <div className="flex-1 relative flex items-center justify-center overflow-hidden h-[100dvh]">

                {/* LOGO */}
                <div className="absolute top-6 left-6 z-40 pointer-events-none">
                    <span className="text-xl md:text-3xl font-black tracking-tighter text-white drop-shadow-md">KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span></span>
                </div>

                {showAuthModal && (
                    <UnifiedAuthModal 
                        onClose={() => {
                            setShowAuthModal(false);
                            if (role === 'user' && (userCredits === null || userCredits <= 0)) {
                                router.push('/');
                            }
                        }}
                        onSuccess={(email, userRole, name, credits) => {
                            localStorage.setItem('kinky_account_status', 'registered');
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
                            const email = localStorage.getItem('kinky_user_email');
                            if (email) {
                                try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/auth/add-credits`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email, amount: credits, priceUsd })
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
                        <span className="text-white/80 text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap hidden sm:block">{t('room.balance')}</span>
                        <span className={`font-mono text-xs md:text-lg font-bold whitespace-nowrap flex items-center gap-1.5 ${userCredits <= 2 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                {userCredits !== null ? Math.floor(userCredits) : 0} <Coins size={12} className="md:w-[18px] text-yellow-400 fill-yellow-500/30" />
                        </span>

                        {userCredits <= 2 && (
                            <div className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 ml-2 border-l border-white/10">
                                <button
                                    onClick={() => {
                                        if (accountStatus === 'guest') {
                                            setShowAuthModal(true);
                                        } else {
                                            setShowPaywall(true);
                                        }
                                    }}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded-full text-[10px] sm:text-sm font-black transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-red-500/20"
                                >
                                    {t('room.topup')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {/* Model Earning Counter */}
                {role === "model" && isConnected && (
                    <EarningsCounter 
                        hasVideo={!!remoteStream} 
                        currentRate={payoutInfo.rate} 
                        totalEarned={payoutInfo.earned} 
                    />
                )}


                {/* Remote Video (Full Screen) */}
                <div className="absolute inset-0 z-0 h-[100dvh]">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${(!isConnected || isMatching || showPaywall) ? "blur-2xl opacity-40 scale-105" : "blur-0 opacity-100 scale-100"
                            }`}
                    />
                    {(!isConnected || isMatching) && !showPaywall && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-2xl transition-all duration-1000 overflow-hidden">
                            {/* Glowing Orbs for Sexy Vibe */}
                            <div className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                            <div className="absolute w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

                            <div className="w-20 h-20 md:w-28 md:h-28 border-[3px] border-white/5 border-t-indigo-500 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(99,102,241,0.5)] relative z-10"></div>

                            <h2 className="text-sm sm:text-lg md:text-3xl font-extralight tracking-[0.2em] text-white/90 animate-pulse relative z-10 text-center px-12 uppercase leading-relaxed">
                                {isMatching ? t('room.searching') : t('room.connecting')}
                                {isMatching && queuePosition !== null && (
                                    <div className="mt-4 text-xs md:text-sm font-bold text-pink-500/80 tracking-widest uppercase animate-pulse">
                                        {t('room.queue_position', { position: queuePosition })}
                                    </div>
                                )}
                            </h2>
                        </div>
                    )}
                </div>

                {/* Local Video (Top Right on Mobile) */}
                <div className="absolute top-4 right-4 md:top-auto md:bottom-24 md:left-6 md:right-auto z-40 w-24 md:w-48 aspect-[3/4] bg-neutral-900 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 transition-all duration-500">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isVideoMuted ? "opacity-0" : "opacity-100"}`}
                    />
                    {isVideoMuted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                            <VideoOff className="w-6 h-6 md:w-8 md:h-8 text-neutral-500" />
                        </div>
                    )}
                </div>

                {/* Mobile Right Sidebar Controls */}
                <div className="flex md:hidden absolute top-1/2 -translate-y-[40%] right-4 z-40 flex-col gap-4">
                    <button
                        onClick={handleToggleAudio}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all backdrop-blur-md border ${isAudioMuted ? "bg-red-500/80 border-red-500/50 text-white" : "bg-white/10 border-white/10 text-white"}`}
                    >
                        {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    {role !== 'model' && (
                        <button
                            onClick={handleToggleVideo}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all backdrop-blur-md border ${isVideoMuted ? "bg-red-500/80 border-red-500/50 text-white" : "bg-white/10 border-white/10 text-white"}`}
                        >
                            {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>
                    )}
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-500/80 border border-orange-400/50 text-white backdrop-blur-md"
                    >
                        <ShieldAlert size={20} />
                    </button>
                    <button
                        onClick={() => window.location.href = `/${language}`}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-600/80 border border-red-500/50 text-white backdrop-blur-md"
                    >
                        <PhoneOff size={20} />
                    </button>
                </div>

                {/* NEXT Button (Above Input on mobile, Bottom Center on desktop) */}
                <div className="absolute bottom-[100px] right-4 md:bottom-8 md:right-auto md:left-1/2 md:-translate-x-1/2 z-40 flex flex-col items-center gap-3">
                    <button
                        onClick={nextPartner}
                        className="group relative flex items-center justify-center px-6 py-3 md:px-12 md:py-5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
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
                    {role !== 'model' && (
                        <button onClick={handleToggleVideo} className={`p-4 rounded-full ${isVideoMuted ? "bg-red-500" : "bg-white/10"}`}><Video size={24} /></button>
                    )}
                    <button onClick={() => setIsReportModalOpen(true)} className="p-4 rounded-full bg-orange-600/80 hover:bg-orange-500 transition-colors border border-orange-400/30">
                        <ShieldAlert size={24} />
                    </button>
                    <button onClick={() => window.location.href = `/${language}`} className="p-4 rounded-full bg-red-600"><PhoneOff size={24} /></button>
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

                    <form onSubmit={handleSend} className="p-4 md:p-6 bg-transparent md:bg-neutral-950/80 flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={t('room.chat_placeholder')}
                                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-base text-white focus:outline-none focus:border-indigo-500 transition-all pr-12 backdrop-blur-md"
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
        </div>
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
                    className={`px-4 py-2 rounded-2xl text-[13px] text-left break-words ${isMe
                        ? "bg-indigo-600/80 text-white border border-white/10 shadow-lg"
                        : "bg-neutral-800/80 text-white border border-white/10 backdrop-blur-sm"
                        }`}
                >
                    <div className="flex flex-col gap-1">
                        <span>{decodeHTML(message.text)}</span>
                        {hasTranslation && (
                            <span className="text-[11px] text-white/40 italic leading-tight border-t border-white/5 pt-1 mt-1">
                                {decodeHTML(message.originalText)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
