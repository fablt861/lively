"use client";

import { useEffect, useRef } from "react";
import { Play, Camera, Shield, Zap } from "lucide-react";

interface PreMatchModalProps {
    localStream: MediaStream | null;
    onJoin: () => void;
}

export function PreMatchModal({ localStream, onJoin }: PreMatchModalProps) {
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
                <div className="mb-12 text-center">
                    <span className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
                        KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                    </span>
                    <div className="mt-2 text-indigo-400/60 text-[10px] uppercase font-black tracking-[0.4em] animate-pulse">
                        Ready to connect?
                    </div>
                </div>

                {/* Camera Preview Circular */}
                <div className="relative mb-12">
                    <div className="w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-[3px] border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.2)] bg-neutral-900 group">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white/60" size={32} />
                        </div>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute -bottom-2 right-8 px-4 py-1.5 bg-green-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-green-500/40 animate-bounce">
                        CAMÉRA OK
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Voulez-vous lancer la recherche ?</h2>
                    <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
                        Vérifiez votre cadrage et votre éclairage. Une fois prêt, cliquez ci-dessous pour rencontrer votre prochain partenaire.
                    </p>
                </div>

                <button
                    onClick={onJoin}
                    className="group relative flex items-center gap-4 px-12 py-6 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full text-white font-black text-lg uppercase tracking-widest shadow-[0_20px_50px_rgba(168,85,247,0.3)] transition-all hover:scale-105 active:scale-95 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                    <Play className="fill-white" size={24} />
                    Lancer le Live
                </button>

                {/* Small Trust Badges */}
                <div className="mt-16 flex items-center gap-8 text-white/10">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Shield size={14} /> Anonyme
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Zap size={14} /> Instantané
                    </div>
                </div>
            </div>
        </div>
    );
}
