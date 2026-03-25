"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, SkipForward, Send, LayoutDashboard, Coins, PhoneOff, SendHorizontal } from "lucide-react";
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

            <div className="flex-1 relative flex items-center justify-center overflow-hidden h-[100dvh]">

                {/* LOGO */}
                <div className="absolute top-6 left-6 z-40 pointer-events-none">
                    <span className="text-xl md:text-3xl font-black tracking-tighter text-white drop-shadow-md">KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span></span>
                </div>

                {showAuthModal && (
                    <UnifiedAuthModal onSuccess={(email, userRole) => {
                        localStorage.setItem('kinky_account_status', 'registered');
                        localStorage.setItem('kinky_user_email', email);
                        localStorage.setItem('kinky_credits', '5');
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
                    <div className={`absolute top-16 left-6 md:top-6 md:right-6 z-30 flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-lg transition-all duration-700 overflow-hidden ${userCredits <= 2 ? 'max-w-[calc(100vw-3rem)] md:max-w-2xl border-red-500/50 shadow-red-500/20' : 'max-w-fit'}`}>
                        <span className="text-white/80 text-[10px] md:text-xs font-bold tracking-wider uppercase whitespace-nowrap hidden sm:block">Balance</span>
                        <span className={`font-mono text-xs md:text-lg font-bold whitespace-nowrap flex items-center gap-1.5 ${userCredits <= 2 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                            {userCredits} <Coins size={12} className="md:w-[18px] text-yellow-400 fill-yellow-500/30" />
                        </span>

                        {userCredits <= 2 && (
                            <div className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 ml-2 border-l border-white/10">
                                <button
                                    onClick={() => setShowPaywall(true)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded-full text-[10px] sm:text-sm font-black transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-red-500/20"
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
                        className="absolute top-24 right-6 z-30 flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-xl rounded-full border border-white/10 text-white/80 transition-all text-xs sm:text-sm font-medium"
                    >
                        <LayoutDashboard size={14} className="sm:w-4 sm:h-4" /> Dashboard
                    </Link>
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

                            <h2 className="text-2xl md:text-4xl font-extralight tracking-tight text-white/90 animate-pulse relative z-10">
                                {isMatching ? "Recherche..." : "Connexion..."}
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
                    <button
                        onClick={handleToggleVideo}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all backdrop-blur-md border ${isVideoMuted ? "bg-red-500/80 border-red-500/50 text-white" : "bg-white/10 border-white/10 text-white"}`}
                    >
                        {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-600/80 border border-red-500/50 text-white backdrop-blur-md"
                    >
                        <PhoneOff size={20} />
                    </button>
                </div>

                {/* NEXT Button (Above Input on mobile, Bottom Center on desktop) */}
                <div className="absolute bottom-[100px] right-4 md:bottom-8 md:right-auto md:left-1/2 md:-translate-x-1/2 z-40 flex flex-col items-center gap-3">
                    <button
                        onClick={nextPartner}
                        className="group relative flex items-center justify-center px-8 py-4 md:px-12 md:py-5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <div className="flex items-center gap-2 relative z-10">
                            <SkipForward size={24} className="text-white fill-white" />
                            <span className="text-white font-black tracking-widest uppercase text-sm md:text-lg leading-none">Next</span>
                        </div>
                    </button>
                </div>

                {/* Desktop Controls (Hidden on Mobile) */}
                <div className="hidden md:flex absolute bottom-8 right-6 z-40 flex-row gap-4">
                    <button onClick={handleToggleAudio} className={`p-4 rounded-full ${isAudioMuted ? "bg-red-500" : "bg-white/10"}`}><Mic size={24} /></button>
                    <button onClick={handleToggleVideo} className={`p-4 rounded-full ${isVideoMuted ? "bg-red-500" : "bg-white/10"}`}><Video size={24} /></button>
                    <button onClick={() => window.location.href = '/'} className="p-4 rounded-full bg-red-600"><PhoneOff size={24} /></button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="absolute bottom-0 left-0 w-full md:relative md:w-96 md:h-full z-40 flex flex-col justify-end">
                <div className="flex flex-col bg-transparent md:bg-neutral-900/50 md:backdrop-blur-3xl md:border-l md:border-white/5 h-full max-h-[30dvh] md:max-h-full">
                    <div className="flex-1 overflow-y-auto px-4 md:p-6 space-y-3 [mask-image:linear-gradient(to_bottom,transparent,black_20%)] md:[mask-image:none]">
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full text-white/30 text-sm hidden md:flex">
                                It's quiet here. Send a message!
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === socketId;
                            return (
                                <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-[13px] ${isMe ? "bg-indigo-600/80 text-white border border-white/10" : "bg-neutral-800/80 text-white border border-white/10"}`}>
                                        {msg.text}
                                    </div>
                                </div>
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
                                placeholder="Écrire un message..."
                                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all pr-12 backdrop-blur-md"
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
        </div>
    );
}
