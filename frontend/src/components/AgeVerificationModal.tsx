"use client";

import { ShieldAlert, X } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface AgeVerificationModalProps {
    onConfirm: () => void;
}

export function AgeVerificationModal({ onConfirm }: AgeVerificationModalProps) {
    const { t } = useTranslation();

    const handleExit = () => {
        window.location.href = "https://www.google.com";
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            {/* Dark Backdrop with high blur */}
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-700" />

            <div className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in duration-500 flex flex-col p-8 md:p-12 text-center">
                
                {/* Logo Branding */}
                <div className="mb-8 md:mb-12">
                     <div className="text-4xl font-black tracking-tighter text-white drop-shadow-md cursor-default">
                        KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                    </div>
                </div>

                {/* Shield Icon */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-pink-500/10 flex items-center justify-center text-pink-500 mx-auto mb-6 md:mb-8 border border-pink-500/20">
                    <ShieldAlert size={32} className="md:w-10 md:h-10" />
                </div>

                <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
                    {t('age.title')}
                </h2>

                <p className="text-white/40 text-sm md:text-base leading-relaxed mb-10 md:mb-12 max-w-sm mx-auto font-medium">
                    {t('age.desc')}
                </p>

                <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                    <button
                        onClick={onConfirm}
                        className="w-full py-5 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(236,72,153,0.3)] uppercase tracking-tight"
                    >
                        {t('age.btn_enter')}
                    </button>
                    
                    <button
                        onClick={handleExit}
                        className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm tracking-widest hover:bg-white/10 hover:text-white transition-all uppercase"
                    >
                        {t('age.btn_exit')}
                    </button>
                </div>

                {/* Footer Decor */}
                <div className="mt-12 pt-8 border-t border-white/5">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
                        Luxury Private Video Chat • Established 2024
                    </p>
                </div>
            </div>
        </div>
    );
}
