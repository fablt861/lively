"use client";

import { useTranslation } from "@/context/LanguageContext";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    const { t, language } = useTranslation();

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,#1e1b4b,transparent_60%)] opacity-30 pointer-events-none" />
            
            {/* Header */}
            <header className="relative z-10 px-6 py-8 lg:px-12 w-full max-w-7xl mx-auto flex justify-between items-center border-b border-white/5">
                <Link href={`/${language}`} className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-5 py-2 transition-all">
                    <ArrowLeft size={16} className="text-white/40 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('nav.back_home')}</span>
                </Link>

                <div className="text-xl font-black tracking-tighter text-white drop-shadow-md">
                    KINKY<span className="text-indigo-500">.</span>
                </div>
            </header>

            {/* Content Area */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16 md:py-24">
                <div className="w-full max-w-2xl text-center space-y-12">
                    
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 shadow-2xl shadow-indigo-500/10 animate-pulse-slow">
                        <Mail size={40} />
                    </div>

                    {/* Title & Text */}
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight tracking-tighter">
                            {t('contact.title')}
                        </h1>
                        <p className="text-xl text-white/50 leading-relaxed font-medium mx-auto max-w-lg">
                            {t('contact.intro')}
                        </p>
                    </div>

                    {/* Email Block */}
                    <div className="group relative pt-8">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <a 
                            href={`mailto:${t('contact.email')}`}
                            className="relative block text-3xl md:text-5xl font-black text-white hover:text-indigo-400 transition-all duration-300 tracking-tighter"
                        >
                            {t('contact.email')}
                        </a>
                        <div className="h-px w-24 bg-indigo-500/50 mx-auto mt-6" />
                    </div>

                    {/* Rights Info */}
                    <div className="pt-24 space-y-8">
                        <div className="flex items-center justify-center gap-2 text-indigo-400/50">
                            <ShieldCheck size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('gender.secure')}</span>
                        </div>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em]">
                            © 2024 MV CAPITAL • ALL RIGHTS RESERVED
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
