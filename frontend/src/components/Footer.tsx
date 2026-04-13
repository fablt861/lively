"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import Link from "next/link";

export function Footer() {
    const { t, language } = useTranslation();
    const pathname = usePathname();

    // Do not show footer in the video chat interface
    const isRoom = pathname.includes("/live") || pathname.includes("/elite/dashboard");
    if (isRoom) {
        return null;
    }

    return (
        <footer className="relative z-30 bg-[#050505] border-t border-white/5 py-12 md:py-20 px-6 overflow-hidden w-full mt-auto">
            {/* Background Decor */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            
            <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
                
                {/* 1. Legal Links */}
                <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-x-4 md:gap-x-6 gap-y-4 md:gap-y-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-white/70 px-4">
                    <Link href={`/${language}/contact`} className="hover:text-indigo-400 transition-colors">{t('footer.contact')}</Link>
                    <span className="w-px h-3 bg-white/20 hidden sm:block" />
                    <Link href={`/${language}/legal`} className="hover:text-indigo-400 transition-colors">{t('footer.legal')}</Link>
                    <span className="w-px h-3 bg-white/10 hidden sm:block" />
                    <Link href={`/${language}/terms`} className="hover:text-indigo-400 transition-colors">{t('footer.terms')}</Link>
                    <span className="w-px h-3 bg-white/10 hidden sm:block" />
                    <Link href={`/${language}/slavery`} className="hover:text-indigo-400 transition-colors">{t('footer.slavery')}</Link>
                </div>

                {/* 2. Payment & Security Logos */}
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-80 hover:opacity-100 transition-opacity duration-500">
                    
                    {/* Mastercard ID Check */}
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#eb001b]" />
                            <div className="w-8 h-8 rounded-full bg-[#f79e1b] opacity-80" />
                        </div>
                        <div className="h-6 w-px bg-white/20 mx-1" />
                        <span className="text-white font-medium text-sm tracking-tight italic">{t('common.id_check')}</span>
                    </div>

                    {/* Visa Secure */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="bg-[#1a1f71] px-2 py-0.5 rounded-t-sm flex items-center justify-center">
                                <span className="text-[10px] font-black text-white leading-none italic">{t('common.visa')}</span>
                            </div>
                            <div className="bg-[#00579f] px-2 py-0.5 rounded-b-sm flex items-center justify-center border-t border-white/10">
                                <span className="text-[7px] font-bold text-white leading-none uppercase tracking-tighter">{t('common.secure')}</span>
                            </div>
                        </div>
                        <span className="text-[#1a1f71] font-black text-xl italic tracking-tighter mix-blend-screen grayscale brightness-200">{t('common.visa')}</span>
                    </div>

                </div>

                {/* 3. 2257 Disclaimer */}
                <div className="max-w-4xl space-y-4">
                    <p className="text-[10px] md:text-[11px] leading-relaxed text-white/60 font-medium">
                        {t('footer.disclaimer')}
                    </p>
                    
                    <div className="pt-8 flex flex-col items-center gap-4">
                        <div className="text-xl font-black tracking-tighter text-white opacity-20 select-none">
                            KINKY<span className="text-pink-500">.</span>
                        </div>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.4em]">
                            © 2026 KINKY.LIVE • ALL RIGHTS RESERVED
                        </p>
                    </div>
                </div>

            </div>
        </footer>
    );
}
