"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Camera, Shield, Zap, ArrowRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface PreMatchModalProps {
    localStream: MediaStream | null;
    onJoin: () => void;
    role?: "user" | "model";
}

export function PreMatchModal({ localStream, onJoin, role = "user" }: PreMatchModalProps) {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [step, setStep] = useState<"camera" | "earnings">("camera");
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        if (step === "earnings") {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/settings`)
                .then(res => res.json())
                .then(data => setSettings(data))
                .catch(console.error);
        }
    }, [step]);

    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream, step]);

    const handleJoinClick = () => {
        if (role === "model" && step === "camera") {
            setStep("earnings");
        } else {
            onJoin();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] animate-in fade-in duration-700 overflow-y-auto scrollbar-hide flex flex-col">
            {/* Background Camera Preview (Blurred) */}
            <div className="fixed inset-0 z-0 text-white gpu-accelerated">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
            </div>

            <div className="relative z-10 w-full max-w-lg mx-auto p-6 flex-1 flex flex-col items-center justify-center py-12 md:py-20 lg:py-24">
                {/* Logo Area */}
                <div className="mb-6 md:mb-8 text-center scale-90 md:scale-100">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
                        KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                    </span>
                    <div className="mt-1 md:mt-2 text-indigo-400/60 text-[8px] md:text-[10px] uppercase font-black tracking-[0.4em] animate-pulse">
                        {t('prematch.ready')}
                    </div>
                </div>

                {step === "earnings" ? (
                    /* Step 2: Model Remuneration Table */
                    <div className="w-full bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-6 md:p-8 mb-6 md:mb-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
                        <div className="flex items-center gap-4 mb-5 md:mb-6">
                            <div className="p-2.5 md:p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                                <Zap className="text-white w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase">
                                    {t('prematch.model_title')}
                                </h3>
                                <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full mt-1" />
                            </div>
                        </div>
                        
                        <p className="text-white/70 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl">
                            {t('prematch.model_desc')}
                        </p>

                        <div className="space-y-3 md:space-y-4">
                            {settings ? (
                                <>
                                    {settings.payoutTiers?.map((tier: any, index: number) => {
                                        const isFirst = index === 0;
                                        const isSecond = index === 1;
                                        const dotColor = isFirst ? 'bg-indigo-400' : isSecond ? 'bg-indigo-500' : 'bg-pink-500';
                                        const textColor = isFirst ? 'text-indigo-400' : isSecond ? 'text-indigo-400' : 'text-pink-400';
                                        const bgColor = isFirst ? 'bg-white/5' : isSecond ? 'bg-indigo-500/10' : 'bg-pink-500/10';
                                        const borderColor = isFirst ? 'border-white/10' : isSecond ? 'border-indigo-500/20' : 'border-pink-500/20';
                                        const hoverBg = isFirst ? 'hover:bg-white/10' : isSecond ? 'hover:bg-indigo-500/20' : 'hover:bg-pink-500/20';

                                        return (
                                            <div key={index} className={`flex justify-between items-center p-3.5 md:p-4 ${bgColor} rounded-2xl md:rounded-3xl border ${borderColor} transition-colors ${hoverBg}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotColor}`} />
                                                    <span className="text-white/90 text-xs md:text-sm font-semibold tracking-wide">
                                                        &gt; {tier.minMinutes} min
                                                    </span>
                                                </div>
                                                <span className={`${textColor} font-black text-base md:text-lg`}>
                                                    ${tier.rate.toFixed(2)} / min
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {settings.blockModelGain && (
                                        <div className="flex justify-between items-center p-3.5 md:p-4 bg-amber-500/10 rounded-2xl md:rounded-3xl border border-amber-500/20 transition-colors hover:bg-amber-500/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500" />
                                                <span className="text-white/90 text-xs md:text-sm font-semibold tracking-wide">
                                                    Private ({settings.blockDurationMin} min)
                                                </span>
                                            </div>
                                            <span className="text-amber-400 font-black text-base md:text-lg">
                                                ${settings.blockModelGain}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-white/50 text-center text-sm py-4 animate-pulse">Loading rates...</div>
                            )}
                        </div>

                        <div className="mt-6 md:mt-8 flex items-center gap-2.5 text-[9px] md:text-[11px] text-white/40 font-black uppercase tracking-[0.2em] text-center justify-center bg-black/20 py-2.5 md:py-3 rounded-full">
                            <Shield size={14} className="text-indigo-400" /> {t('prematch.anti_fraud')}
                        </div>
                    </div>
                ) : (
                    /* Step 1: Camera Preview */
                    <div className="relative mb-6 md:mb-12 group">
                        <div className="w-40 h-40 md:w-64 md:h-64 rounded-full overflow-hidden border-[4px] border-white/20 shadow-[0_0_100px_rgba(99,102,241,0.3)] bg-neutral-900 relative transition-transform duration-500 group-hover:scale-105">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent pointer-events-none" />
                        </div>
                        <div className="absolute -bottom-2 right-2 md:right-4 bg-indigo-500 p-2.5 md:p-3 rounded-2xl shadow-xl border-4 border-[#050505]">
                            <Camera className="text-white w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleJoinClick}
                    className="group relative flex items-center gap-2 px-10 py-5 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 rounded-full text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(99,102,241,0.3)] transition-all hover:scale-105 active:scale-95 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                    {step === "earnings" ? (
                        <>
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                            {t('prematch.model_confirm')}
                        </>
                    ) : (
                        <>
                            <Play className="fill-white w-4 h-4 md:w-5 md:h-5" />
                            {t('prematch.btn')}
                        </>
                    )}
                </button>


                {/* Small Trust Badges */}
                <div className="mt-8 md:mt-16 mb-8 flex items-center gap-6 md:gap-8 text-white/60 font-black uppercase tracking-[0.2em] text-[7px] md:text-[10px]">
                    <div className="flex items-center gap-1.5 md:gap-2 hover:text-white transition-colors">
                        <Shield size={12} className="text-indigo-400" /> {t('prematch.anonymous')}
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 hover:text-white transition-colors">
                        <Zap size={12} className="text-pink-400" /> {t('prematch.instant')}
                    </div>
                </div>
            </div>
        </div>
    );
}

