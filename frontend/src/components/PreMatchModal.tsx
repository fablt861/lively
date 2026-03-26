"use client";

import { useEffect, useRef } from "react";
import { Play, Camera, Shield, Zap } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface PreMatchModalProps {
    localStream: MediaStream | null;
    onJoin: () => void;
}

export function PreMatchModal({ localStream, onJoin }: PreMatchModalProps) {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] animate-in fade-in duration-700">
            {/* Background Camera Preview (Blurred) */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
            </div>

            <div className="relative z-10 w-full max-w-lg p-6 flex flex-col items-center">
                {/* Logo Area */}
                <div className="mb-6 md:mb-12 text-center scale-90 md:scale-100">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
                        KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                    </span>
                    <div className="mt-1 md:mt-2 text-indigo-400/60 text-[8px] md:text-[10px] uppercase font-black tracking-[0.4em] animate-pulse">
                        {t('prematch.ready')}
                    </div>
                </div>

                {/* Camera Preview Circular */}
                <div className="relative mb-8 md:mb-12">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-[3px] border-white/40 shadow-[0_0_80px_rgba(99,102,241,0.2)] bg-neutral-900 group">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-105"
                        />
                    </div>
                </div>

                <div className="text-center mb-6 md:mb-10 px-4">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 tracking-tight">{t('prematch.title')}</h2>
                    <p className="text-white/40 text-xs md:text-sm max-w-xs mx-auto leading-relaxed">
                        {t('prematch.desc')}
                    </p>
                </div>

                <button
                    onClick={onJoin}
                    className="group relative flex items-center gap-3 md:gap-4 px-8 md:px-12 py-4 md:py-6 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full text-white font-black text-base md:text-lg uppercase tracking-widest shadow-xl transition-all active:scale-95 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                    <Play className="fill-white md:w-6 md:h-6" size={20} />
                    {t('prematch.btn')}
                </button>

                {/* Small Trust Badges */}
                <div className="mt-6 md:mt-16 flex items-center gap-6 md:gap-8 text-white/40 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <Shield size={12} className="text-white/20 md:w-3.5 md:h-3.5" /> {t('prematch.anonymous')}
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <Zap size={12} className="text-white/20 md:w-3.5 md:h-3.5" /> {t('prematch.instant')}
                    </div>
                </div>
            </div>
        </div>
    );
}
