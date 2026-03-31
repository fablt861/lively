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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] animate-in fade-in duration-700">
            {/* Background Camera Preview (Blurred) */}
            <div className="absolute inset-0 z-0 text-white">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
            </div>

            <div className="relative z-10 w-full max-w-lg p-6 flex flex-col items-center translate-y-[-20px]">
                {/* Logo Area */}
                <div className="mb-6 md:mb-10 text-center scale-90 md:scale-100">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
                        KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                    </span>
                    <div className="mt-1 md:mt-2 text-indigo-400/60 text-[8px] md:text-[10px] uppercase font-black tracking-[0.4em] animate-pulse">
                        {t('prematch.ready')}
                    </div>
                </div>

                {step === "earnings" ? (
                    /* Step 2: Model Remuneration Table */
                    <div className="w-full bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 mb-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                                <Zap className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight uppercase">
                                    {t('prematch.model_title')}
                                </h3>
                                <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full mt-1" />
                            </div>
                        </div>
                        
                        <p className="text-white/70 text-sm mb-8 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl">
                            {t('prematch.model_desc')}
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-3xl border border-white/10 transition-colors hover:bg-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                    <span className="text-white/90 text-sm font-semibold tracking-wide">0 - 5 min</span>
                                </div>
                                <span className="text-indigo-400 font-black text-lg">$0.40 / min</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 transition-colors hover:bg-indigo-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-white/90 text-sm font-semibold tracking-wide">5 - 10 min</span>
                                </div>
                                <span className="text-indigo-400 font-black text-lg">$0.50 / min</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-pink-500/10 rounded-3xl border border-pink-500/20 transition-colors hover:bg-pink-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                                    <span className="text-white/90 text-sm font-semibold tracking-wide">+ 10 min</span>
                                </div>
                                <span className="text-pink-400 font-black text-lg">$0.55 / min</span>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-2.5 text-[11px] text-white/40 font-black uppercase tracking-[0.2em] text-center justify-center bg-black/20 py-3 rounded-full">
                            <Shield size={14} className="text-indigo-400" /> {t('prematch.anti_fraud')}
                        </div>
                    </div>
                ) : (
                    /* Step 1: Camera Preview (Now for everyone initially) */
                    <div className="relative mb-8 md:mb-12 group">
                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-[4px] border-white/20 shadow-[0_0_100px_rgba(99,102,241,0.3)] bg-neutral-900 relative transition-transform duration-500 group-hover:scale-105">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent pointer-events-none" />
                        </div>
                        <div className="absolute -bottom-2 right-4 bg-indigo-500 p-3 rounded-2xl shadow-xl border-4 border-[#050505]">
                            <Camera className="text-white w-5 h-5" />
                        </div>
                    </div>
                )}

                <div className="text-center mb-8 md:mb-10 px-4">
                    <h2 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tight">
                        {step === "earnings" ? t('prematch.model_title') : t('prematch.title')}
                    </h2>
                    <p className="text-white/40 text-xs md:text-sm max-w-xs mx-auto leading-relaxed font-bold uppercase tracking-widest opacity-60">
                        {step === "earnings" ? t('prematch.model_desc') : t('prematch.desc')}
                    </p>
                </div>

                <button
                    onClick={handleJoinClick}
                    className="group relative flex items-center gap-4 px-10 md:px-14 py-5 md:py-7 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 rounded-full text-white font-black text-lg md:text-xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(99,102,241,0.4)] transition-all hover:scale-105 active:scale-95 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                    {step === "earnings" ? (
                        <>
                            <ArrowRight className="md:w-6 md:h-6 transition-transform group-hover:translate-x-1" size={24} />
                            {t('prematch.model_confirm')}
                        </>
                    ) : (
                        <>
                            <Play className="fill-white md:w-6 md:h-6" size={24} />
                            {t('prematch.btn')}
                        </>
                    )}
                </button>

                {/* Small Trust Badges */}
                <div className="mt-8 md:mt-16 flex items-center gap-8 text-white/30 font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px]">
                    <div className="flex items-center gap-2 hover:text-white/50 transition-colors">
                        <Shield size={14} className="text-indigo-500/50" /> {t('prematch.anonymous')}
                    </div>
                    <div className="flex items-center gap-2 hover:text-white/50 transition-colors">
                        <Zap size={14} className="text-pink-500/50" /> {t('prematch.instant')}
                    </div>
                </div>
            </div>
        </div>
    );
}

