"use client";

import { Wrench } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function MaintenanceGuard() {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-[10000] bg-neutral-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative p-8 bg-neutral-900 border border-white/10 rounded-[2.5rem] shadow-2xl">
                    <Wrench size={60} className="text-indigo-500 animate-bounce" />
                </div>
            </div>
            
            <div className="max-w-md space-y-6 relative z-10">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                    {t('maintenance.overlay_title')}
                </h1>
                
                <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-pink-500 mx-auto rounded-full" />
                
                <p className="text-lg text-white/50 leading-relaxed font-medium">
                    {t('maintenance.overlay_desc')}
                </p>

                <div className="pt-8 flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                    </div>
                    <p className="text-[10px] font-black text-indigo-400/50 uppercase tracking-[0.4em]">
                        System Optimization
                    </p>
                </div>
            </div>

            {/* Premium Border Decor */}
            <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20" />
            <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-20" />
        </div>
    );
}
