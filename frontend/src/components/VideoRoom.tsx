"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, SkipForward, Send, LayoutDashboard, Coins, PhoneOff } from "lucide-react";
import Link from "next/link";
import { PaywallModal } from "./PaywallModal";
import { UnifiedAuthModal } from "./UnifiedAuthModal";
import { PreMatchModal } from "./PreMatchModal";

function EarningsCounter({ hasVideo }: { hasVideo: boolean }) {
    const counterRef = useRef<HTMLSpanElement>(null);
    const hasVideoRef = useRef(hasVideo);

    useEffect(() => {
        hasVideoRef.current = hasVideo;
    }, [hasVideo]);

    useEffect(() => {
        let earned = 0;
        let secondsPassed = 0;
        const RATE_PER_SEC = 0.40 / 60;

        const interval = setInterval(() => {
            if (!hasVideoRef.current) return;
            secondsPassed++;
            if (secondsPassed > 5) {
                earned += RATE_PER_SEC;
                if (counterRef.current) {
                    counterRef.current.innerText = `$${earned.toFixed(4)}`;
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute top-6 right-6 z-30 flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-black/60 backdrop-blur-xl rounded-full border border-green-500/30 shadow-2xl shadow-green-500/20 transition-all">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_2px_rgba(34,197,94,0.5)]" />
            <span className="text-white/80 text-xs font-semibold tracking-wider uppercase hidden sm:block">Current Call</span>
            <span ref={counterRef} className="text-green-400 font-mono text-base sm:text-lg font-bold">
                $0.0000
            </span>
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
    role: "user" | "model" | null;
    handleOutOfCredits?: () => void;
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
    role,
    handleOutOfCredits,
}: VideoRoomProps) {
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

    // Load state from localStorage on mount
    useEffect(() => {
        if (role !== "user") return;
        const storedStatus = (localStorage.getItem('kinky_account_status') as any) || 'guest';
        setAccountStatus(storedStatus);

        let storedCredits = localStorage.getItem('kinky_credits');
        if (storedCredits === null) {
            // New guest starts with 5 credits (30s)
            storedCredits = "5";
            localStorage.setItem('kinky_credits', storedCredits);
        }
        setUserCredits(Number(storedCredits));
    }, [role]);

    // Timer logic
    useEffect(() => {
        if (role !== "user" || !isConnected || userCredits === null) return;

        if (userCredits <= 0) {
            if (handleOutOfCredits) handleOutOfCredits();
            if (accountStatus === 'guest') setShowAuthModal(true);
            else setShowPaywall(true);
            return;
        }

        const interval = setInterval(() => {
            setUserCredits((prev) => {
                if (prev === null) return null;
                const next = Math.max(0, prev - 1);
                localStorage.setItem('kinky_credits', next.toString());
                if (next === 0) {
                    if (handleOutOfCredits) handleOutOfCredits();
                    if (accountStatus === 'guest') setShowAuthModal(true);
                    else setShowPaywall(true);
                }
                return next;
            });
        }, 6000); // Decrement 1 credit every 6 seconds (10 credits/min)

        return () => clearInterval(interval);
    }, [role, isConnected, userCredits, accountStatus, handleOutOfCredits]);

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

    const handleStartMatch = () => {
        setHasStartedMatch(true);
        joinQueue();
    };

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-neutral-950 text-white font-sans overflow-hidden">
            {!hasStartedMatch && (
                <PreMatchModal localStream={localStream} onJoin={handleStartMatch} />
            )}

            <div className="flex-1 relative flex items-center justify-center overflow-hidden">

                {/* LOGO */}
                <div className="absolute top-6 left-6 z-40 pointer-events-none">
                    <span className="text-3xl font-black tracking-tighter text-white drop-shadow-md">KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span></span>
                </div>

                {showAuthModal && (
                    <UnifiedAuthModal onSuccess={(email, userRole) => {
                        localStorage.setItem('kinky_account_status', 'registered');
                        localStorage.setItem('kinky_user_email', email);
                        localStorage.setItem('kinky_credits', '5'); // Grant 30s more
                        setAccountStatus('registered');
                        setUserCredits(5);
                        setShowAuthModal(false);
                        nextPartner();
                    }} />
                )}

                {showPaywall && (
                    <PaywallModal
                        onClose={() => setShowPaywall(false)}
                        onPurchase={(credits) => {
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
                    <div className={`absolute top-[170px] right-6 md:top-6 md:right-6 z-30 flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-lg transition-all duration-700 overflow-hidden ${userCredits <= 2 ? 'max-w-[calc(100vw-3rem)] md:max-w-2xl border-red-500/50 shadow-red-500/20' : 'max-w-[150px] sm:max-w-[200px]'}`}>
                        <span className="text-white/80 text-[10px] md:text-xs font-semibold tracking-wider uppercase whitespace-nowrap hidden sm:block">Balance</span>
                        <span className={`font-mono text-sm md:text-lg font-bold whitespace-nowrap flex items-center gap-1.5 ${userCredits <= 2 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                            {userCredits} <Coins size={14} className="md:w-[18px] text-yellow-400 fill-yellow-500/30" />
                        </span>

                        {/* Low Credits Expanded Warning */}
                        {userCredits <= 2 && (
                            <div className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 ml-2 border-l border-white/10">
                                <span className="text-red-400 text-[9px] sm:text-sm whitespace-nowrap hidden md:block animate-pulse font-medium">
                                    Crédits bas
                                </span>
                                <button
                                    onClick={() => {
                                        setShowPaywall(true);
                                        if (handleOutOfCredits) handleOutOfCredits();
                                    }}
                                    className="px-2 py-1 sm:px-5 sm:py-2 bg-red-500 hover:bg-red-400 text-white rounded-full text-[9px] sm:text-sm font-semibold transition-colors whitespace-nowrap shadow-lg shadow-red-500/20"
                                >
                                    Top Up
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {/* Model Earning Counter */}
                {role === "model" && isConnected && <EarningsCounter hasVideo={!!remoteStream} />}

                {/* Model Dashboard Button */}
                {role === "model" && (
                    <Link
                        href={`/model/dashboard?id=${socketId}`}
                        className="absolute top-20 right-6 z-30 flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-xl rounded-full border border-white/10 text-white/80 transition-all text-xs sm:text-sm font-medium"
                    >
                        <LayoutDashboard size={14} className="sm:w-4 sm:h-4" /> Dashboard
                    </Link>
                )}

                {/* Remote Video (Full Screen) */}
                <div className="absolute inset-0 z-0">
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

                            <h2 className="text-2xl md:text-4xl font-extralight tracking-tight text-white/90 animate-pulse relative z-10">
                                {isMatching ? "Recherche de partenaire..." : "En attente de connexion..."}
                            </h2>
                            <p className="mt-5 text-indigo-300/40 text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold relative z-10">
                                Connexion P2P chiffrée
                            </p>
                        </div>
                    )}
                </div>

                {/* Local Video (Picture in Picture) */}
                <div className="absolute top-4 right-4 md:top-auto md:bottom-24 md:left-6 md:right-auto z-40 w-24 md:w-48 aspect-[3/4] bg-neutral-900 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 transition-all duration-500 hover:scale-105 cursor-pointer group">
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

                {/* Desktop Controls Overlay (Hidden on Mobile) */}
                <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex-row items-center justify-center gap-6 px-8 py-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="p-4 rounded-full transition-all duration-300 hover:scale-110 bg-red-500 hover:bg-red-600 text-white"
                        title="Quitter"
                    >
                        <PhoneOff size={24} />
                    </button>

                    <button
                        onClick={handleToggleAudio}
                        className={`p-4 rounded-full transition-all duration-300 hover:scale-110 ${isAudioMuted ? "bg-red-500/80 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
                    >
                        {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        onClick={nextPartner}
                        className="group relative flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <div className="flex items-center gap-2 relative z-10">
                            <SkipForward size={24} className="text-white fill-white" />
                            <span className="text-white font-bold tracking-widest uppercase text-base leading-none">Next</span>
                        </div>
                    </button>

                    <button
                        onClick={handleToggleVideo}
                        className={`p-4 rounded-full transition-all duration-300 hover:scale-110 ${isVideoMuted ? "bg-red-500/80 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
                    >
                        {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                </div>
            </div>

            {/* Chat Area (TikTok overlap on mobile, Sidebar on desktop) */}
            <div className="absolute bottom-0 left-0 w-full h-[35dvh] pointer-events-none z-30 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent md:relative md:w-96 md:h-full md:bg-neutral-900/50 md:backdrop-blur-3xl md:border-l md:border-white/5 md:pointer-events-auto transition-all">
                <div className="p-6 border-b border-white/5 hidden md:block bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <h3 className="text-xl font-bold tracking-tight text-white/90">Live Chat</h3>
                    </div>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest font-black">Sécurisé & Anonyme</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pr-24 md:p-4 pb-2 space-y-4 pointer-events-auto [mask-image:linear-gradient(to_bottom,transparent,black_20%)] md:[mask-image:none]">
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-full text-white/30 text-sm hidden md:flex">
                            It's quiet here. Send a message!
                        </div>
                    )}
                    {messages.map((msg, i) => {
                        const isMe = msg.senderId === socketId;
                        return (
                            <div
                                key={i}
                                className={`flex flex-col animate-chat-bubble ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] px-4 py-2.5 rounded-[1.25rem] text-[14px] leading-relaxed shadow-xl transition-all hover:scale-[1.02] cursor-default ${isMe
                                        ? "glass-morphism-indigo text-white rounded-br-sm border-indigo-500/30 shadow-indigo-500/10"
                                        : "glass-morphism-pink text-white/90 rounded-bl-sm border-pink-500/30 shadow-pink-500/10"
                                        }`}
                                >
                                    {msg.originalText && msg.originalText !== msg.text ? (
                                        <div className="flex flex-col gap-1.5">
                                            <div className="font-medium">{msg.text}</div>
                                            <div className="text-[11px] italic opacity-50 border-t border-white/10 pt-1 mt-0.5">
                                                {msg.originalText}
                                            </div>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                                <span className="text-[9px] mt-1.5 px-2 text-white/30 font-bold uppercase tracking-tighter">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 pb-8 md:pb-6 md:bg-neutral-950/80 backdrop-blur-3xl border-t border-white/5 pointer-events-auto w-full group">
                    {/* Mobile Controls Row (Above input) */}
                    <div className="flex md:hidden items-center justify-between mb-4 px-2">
                        <button
                            type="button"
                            onClick={handleToggleAudio}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isAudioMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/10 text-white"}`}
                        >
                            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleVideo}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isVideoMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/10 text-white"}`}
                        >
                            {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>
                        <button
                            type="button"
                            onClick={nextPartner}
                            className="flex-1 mx-4 h-12 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            <SkipForward size={18} className="fill-white" /> Next
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.href = '/'}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-500/20 text-red-500 border border-red-500/20"
                        >
                            <PhoneOff size={20} />
                        </button>
                    </div>

                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Écrire un message..."
                            className="w-full bg-white/5 md:bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all duration-300 shadow-2xl"
                            disabled={!isConnected}
                        />
                        <button
                            type="submit"
                            disabled={!isConnected || !chatInput.trim()}
                            className="absolute right-2.5 p-2.5 rounded-xl text-white bg-gradient-to-tr from-indigo-500 to-purple-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-90 shadow-lg shadow-indigo-500/30 z-10"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
}
