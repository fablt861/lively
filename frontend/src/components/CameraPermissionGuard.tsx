"use client";

import { VideoOff, Lock, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import Link from "next/link";

interface CameraPermissionGuardProps {
    onRetry: () => void;
}

export function CameraPermissionGuard({ onRetry }: CameraPermissionGuardProps) {
    const { t, language } = useTranslation();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] p-6 text-white text-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none translate-x-1/2 -translate-y-1/2 opacity-50" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 translate-y-1/2 opacity-30" />

            <div className="relative z-10 max-w-lg w-full bg-neutral-900/50 border border-white/10 p-10 md:p-14 rounded-[3rem] shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                {/* Icon Section */}
                <div className="relative mx-auto w-24 h-24 mb-10">
                    <div className="absolute inset-0 bg-red-500/20 rounded-3xl blur-2xl animate-pulse" />
                    <div className="relative w-full h-full bg-neutral-900 border-2 border-red-500/30 rounded-3xl flex items-center justify-center text-red-500 shadow-xl">
                        <VideoOff size={40} />
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-xl shadow-lg">
                            <ShieldAlert size={14} />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <h1 className="text-3xl font-black mb-4 tracking-tight leading-tight">
                    {t('live.camera_required_title') || "Camera Access Required"}
                </h1>
                <p className="text-neutral-400 text-sm leading-relaxed mb-10">
                    {t('live.camera_required_desc') || "To ensure a safe and mutual experience, your camera must be enabled to enter the video chat."}
                </p>

                {/* Instruction Box */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-10 text-left relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 text-white/10 group-hover:text-white/20 transition-colors">
                        <Lock size={40} />
                    </div>
                    <div className="relative z-10 flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0 font-black text-sm">!</div>
                        <p className="text-xs text-white/70 leading-relaxed font-medium">
                            {t('live.camera_instruction') || "Please click the lock icon in your browser's address bar and set camera permissions to 'Allow', then click the button below."}
                        </p>
                    </div>
                </div>

                {/* Buttons Section */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={onRetry}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black py-5 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl shadow-pink-500/20 active:scale-95 text-xs uppercase tracking-widest"
                    >
                        <RefreshCw size={18} /> {t('live.camera_retry_btn') || "I've enabled my camera"}
                    </button>
                    <Link
                        href={`/${language}`}
                        className="w-full py-5 rounded-full bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/5"
                    >
                        <Home size={16} /> {t('live.camera_home_btn') || "Back to Home"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
