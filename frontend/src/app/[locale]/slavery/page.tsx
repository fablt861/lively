"use client";

import { useTranslation } from "@/context/LanguageContext";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function SlaveryPage() {
    const { t, language } = useTranslation();

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-pink-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#312e81,transparent_50%)] opacity-20 pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_0%_100%,#831843,transparent_40%)] opacity-10 pointer-events-none" />

            {/* Header / Navigation */}
            <header className="relative z-10 px-6 py-8 lg:px-12 w-full max-w-7xl mx-auto flex justify-between items-center">
                <Link href={`/${language}`} className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-5 py-2.5 transition-all">
                    <ArrowLeft size={18} className="text-white/40 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('nav.back_home') || 'Back'}</span>
                </Link>

                <div className="text-2xl font-black tracking-tighter text-white drop-shadow-md cursor-default">
                    KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-24">
                
                {/* Section Header */}
                <div className="mb-16 md:mb-24 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 mb-8">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
                        {t('slavery.title')}
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-pink-500 mx-auto rounded-full" />
                </div>

                {/* Declaration Content */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-16 backdrop-blur-sm shadow-2xl">
                    <p className="text-lg md:text-xl text-white/70 leading-relaxed font-medium first-letter:text-5xl first-letter:font-black first-letter:text-pink-500 first-letter:mr-3 first-letter:float-left">
                        {t('slavery.content')}
                    </p>
                </div>

                {/* Legal Badge */}
                <div className="mt-16 text-center">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.5em]">
                        Ethics • Integrity • Compliance
                    </p>
                </div>

            </main>
        </div>
    );
}
