"use client";

import React from "react";
import { useTranslation } from "@/context/LanguageContext";
import { Shield, Zap, Heart, Sparkles } from "lucide-react";

export function LaunchPage() {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden font-sans">
            {/* Animated Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
                {/* Logo Section */}
                <div className="mb-12 relative">
                    <div className="absolute -inset-8 bg-white/5 rounded-full blur-2xl animate-pulse" />
                    <div className="relative flex items-end">
                        <span className="text-9xl font-black text-white tracking-tighter leading-none select-none">
                            K
                        </span>
                        <div className="w-6 h-6 bg-gradient-to-tr from-pink-500 to-rose-600 mb-4 ml-1 rounded-sm shadow-[0_0_30px_rgba(236,72,153,0.6)] animate-bounce" />
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[0.9] uppercase italic group">
                        <span className="block">{t('launch.title_1') || "The Future"}</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                            {t('launch.title_2') || "is Coming"}
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-2xl text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
                        {t('launch.subtitle') || "Unfiltered connection is just around the corner. We are preparing something massive."}
                    </p>
                </div>

                {/* Features / Marketing Perks */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    {[
                        { icon: Shield, title: "launch.perk1_title", desc: "launch.perk1_desc", color: "text-indigo-400" },
                        { icon: Zap, title: "launch.perk2_title", desc: "launch.perk2_desc", color: "text-pink-400" },
                        { icon: Heart, title: "launch.perk3_title", desc: "launch.perk3_desc", color: "text-purple-400" }
                    ].map((perk, i) => (
                        <div key={i} className="group p-6 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-md hover:bg-white/[0.05] transition-all hover:scale-105 duration-500">
                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 mx-auto ${perk.color}`}>
                                <perk.icon size={24} />
                            </div>
                            <h3 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">{t(perk.title) || "PRIVATE"}</h3>
                            <p className="text-white/30 text-xs leading-relaxed">{t(perk.desc) || "End-to-end encryption for your ultimate discretion."}</p>
                        </div>
                    ))}
                </div>

                {/* CTA - Stay Tuned */}
                <div className="mt-20">
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer shadow-2xl shadow-indigo-500/20">
                        <Sparkles size={18} />
                        {t('launch.stay_tuned') || "Stay Tuned"}
                    </div>
                </div>
            </div>

            {/* Footer Tagline */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    © 2026 KINKY ELITE • PARIS • LONDON • NYC
                </p>
            </div>
        </div>
    );
}
