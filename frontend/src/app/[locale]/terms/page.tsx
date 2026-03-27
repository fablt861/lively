"use client";

import { useTranslation } from "@/context/LanguageContext";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    const { t, language } = useTranslation();

    const sections = [
        { title: t('terms.purpose_title'), content: t('terms.purpose_content') },
        { title: t('terms.manager_title'), content: t('terms.manager_content') },
        { title: t('terms.access_title'), content: t('terms.access_content') },
        { title: t('terms.acceptance_title'), content: t('terms.acceptance_content') },
        { title: t('terms.payments_title'), content: t('terms.payments_content') },
        { title: t('terms.services_title'), content: t('terms.services_content') },
        { title: t('terms.financials_title'), content: t('terms.financials_content') },
        { title: t('terms.obligations_title'), content: t('terms.obligations_content') },
        { title: t('terms.moderation_title'), content: t('terms.moderation_content') },
        { title: t('terms.withdrawal_title'), content: t('terms.withdrawal_content') },
        { title: t('terms.jurisdiction_title'), content: t('terms.jurisdiction_content') },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent_50%)] opacity-30 pointer-events-none" />
            
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
            <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24">
                
                {/* Title Section */}
                <div className="mb-20 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 font-bold shadow-lg shadow-indigo-500/5">
                        <FileText size={24} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        {t('terms.title')}
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">
                        {t('terms.updated')}
                    </p>
                </div>

                {/* Document Body */}
                <div className="space-y-12">
                    {sections.map((section, idx) => (
                        <section key={idx} className="group transition-all duration-500">
                            <div className="flex items-start gap-6">
                                <div className="hidden md:flex shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center text-[10px] font-bold text-white/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                                    {idx + 1}
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                                        {section.title}
                                    </h2>
                                    <div className="text-white/50 leading-relaxed whitespace-pre-wrap font-medium">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                            {idx !== sections.length - 1 && (
                                <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                            )}
                        </section>
                    ))}
                </div>

                {/* Closing Note */}
                <div className="mt-24 pt-12 border-t border-white/5 text-center space-y-8">
                    <div className="flex items-center justify-center gap-2 text-indigo-400/50">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('gender.secure')}</span>
                    </div>
                    <p className="text-[10px] text-white/10 font-bold uppercase tracking-[0.4em]">
                        © 2024 MV CAPITAL • ALL RIGHTS RESERVED
                    </p>
                </div>

            </main>
        </div>
    );
}
