"use client";

import Link from "next/link";
import {
    ChevronRight,
    ShieldCheck,
    Globe,
    Zap,
    Heart,
    Lock,
    DollarSign,
    Star,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import { ModelSimulator } from "@/components/ModelSimulator";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function ModelLandingPage() {
    const { t, language } = useTranslation();
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col font-sans relative selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Mesh Gradient Background Layer - Brighter */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse duration-[8s]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-500/15 rounded-full blur-[90px] animate-pulse duration-[6s]" />
                
                {/* Dots Pattern */}
                <div className="absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex justify-between items-center px-6 lg:px-12 py-8 max-w-7xl mx-auto w-full">
                <Link href={`/${language}`} className="text-2xl font-black tracking-tighter text-white group">
                    KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:from-white transition-all duration-500">.</span>
                    <span className="text-[9px] font-black text-white/60 ml-2 uppercase tracking-[0.3em] align-middle hidden sm:inline-block">{t('model.landing.navbar_suite')}</span>
                </Link>
                <div className="flex items-center gap-6 md:gap-10">
                    <a href="#simulator" className="hidden lg:block text-[10px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-[0.2em]">{t('model.landing.nav_simulator')}</a>
                    <LanguageSelector />
                    <Link href={`/${language}/elite/signup`} className="px-6 py-2.5 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-xl">
                        {t('model.landing.nav_join')}
                    </Link>
                </div>
            </nav>

            {/* Combined Hero & Simulator - 2 Columns */}
            <header className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-8 pb-16 md:py-20 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
                    {/* Left: Content */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase tracking-[0.2em]">
                            <Star size={12} className="fill-indigo-300" />
                            {t('model.landing.hero_badge')}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-black leading-[0.9] tracking-tighter text-white">
                            {t('model.landing.hero_title_line1')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                {t('model.landing.hero_title_line2')}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-white/60 font-medium max-w-xl leading-relaxed">
                            {t('model.landing.hero_desc')}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10 flex items-center gap-3 min-w-[160px] hover:bg-white/10 transition-colors cursor-default group">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <DollarSign size={20} />
                                </div>
                                <span className="text-xl font-black text-white leading-none tracking-tight">{t('model.stat.real_time_earnings')}</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10 flex items-center gap-3 min-w-[160px] hover:bg-white/10 transition-colors cursor-default group">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                                    <Zap size={20} />
                                </div>
                                <span className="text-xl font-black text-white leading-none whitespace-nowrap">{t('model.stat.fast_payout_val')}</span>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                            <Link href={`/${language}/elite/signup`} className="w-full sm:w-auto px-10 py-5 rounded-full bg-white text-black font-black text-base shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                                {t('model.landing.hero_cta_apply')}
                                <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>

                    {/* Right: Simulator & Premium Image */}
                    <div className="relative animate-in fade-in slide-in-from-right-8 duration-700">
                        {/* Decorative Premium Image Background */}
                        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full border border-white/5 overflow-hidden opacity-20 blur-sm pointer-events-none hidden lg:block">
                            <img src="/images/model_hero.png" alt="" className="w-full h-full object-cover grayscale" />
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <ModelSimulator />
                            
                            {/* Trust Pill */}
                            <div className="flex items-center gap-6 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-lg">
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/70 uppercase tracking-widest">
                                    <CheckCircle2 size={12} className="text-indigo-400" /> {t('model.stat.discretion')} 100%
                                </div>
                                <div className="w-px h-3 bg-white/20" />
                                <div className="flex items-center gap-2 text-[9px] font-black text-white/70 uppercase tracking-widest">
                                    <Lock size={12} className="text-purple-400" /> {t('model.stat.secure_access_val')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* NEW: Live Cam Section */}
            <section className="relative z-10 py-16 md:py-24 border-y border-white/5 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-6 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[8px] font-black uppercase tracking-[0.3em]">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live Cam Platform
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                            {t('model.landing.live_cam_title')}
                        </h2>
                        <p className="text-lg text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
                            {t('model.landing.live_cam_desc')}
                        </p>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 aspect-[4/3] hover:border-indigo-500/50 transition-all duration-500">
                            <img src="/images/live_cam_mockup_1.png" alt="Live Cam Desktop" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute bottom-6 left-6">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Premium Desktop Experience</p>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 aspect-[4/3] md:translate-y-6 hover:border-purple-500/50 transition-all duration-500">
                            <img src="/images/live_cam_mockup_2.png" alt="Live Cam Mobile" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute bottom-6 left-6">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Mobile Live Streaming</p>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 aspect-[4/3] hover:border-indigo-500/50 transition-all duration-500">
                            <img src="/images/live_cam_mockup_3.png" alt="Pro Camera Setup" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute bottom-6 left-6">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">High-End Equipment Support</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Split Section: Visual + Benefits */}
            <section className="relative z-10 border-t border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        {/* Left: 3D Illustration/Photo */}
                        <div className="relative group flex justify-center">
                            <div className="w-full max-w-md aspect-square rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
                                <img 
                                    src="/images/privacy_illustration.png" 
                                    alt="Privacy Illustration" 
                                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-10">
                                    <span className="text-3xl font-black text-white mb-2 tracking-tighter">{t('model.benefit.anon_title')}</span>
                                    <p className="text-white/60 text-sm font-medium leading-relaxed uppercase tracking-widest">{t('model.landing.hero_badge')}</p>
                                </div>
                            </div>
                            
                            {/* Decorative Floating Element */}
                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl border-4 border-[#0a0a0c] z-20 group-hover:rotate-0 transition-transform duration-500">
                                <ShieldCheck size={48} className="text-white" />
                            </div>
                        </div>

                        {/* Right: Compact Benefits Grid */}
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-black tracking-tight">{t('model.landing.sim_title')}</h2>
                                <p className="text-white/50 text-lg font-medium">{t('model.landing.sim_desc')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { icon: Lock, title: t('model.benefit.anon_title'), desc: t('model.benefit.anon_desc'), color: 'indigo' },
                                    { icon: DollarSign, title: t('model.benefit.payout_title'), desc: t('model.benefit.payout_desc'), color: 'pink' },
                                    { icon: Zap, title: t('model.benefit.flex_title'), desc: t('model.benefit.flex_desc'), color: 'purple' },
                                    { icon: Globe, title: t('model.landing.hero_badge'), desc: t('model.landing.hero_desc'), color: 'blue' }
                                ].slice(0, 3).map((item, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/20 border border-${item.color}-500/30 flex items-center justify-center text-${item.color}-400`}>
                                            <item.icon size={20} />
                                        </div>
                                        <h4 className="text-lg font-bold">{item.title}</h4>
                                        <p className="text-sm text-white/40 leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Compact CTA */}
            <footer className="relative z-10 pt-20 pb-32 border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
                    <div className="space-y-6">
                        <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.95]">
                            {t('model.landing.footer_title_line1')} <br /> 
                            <span className="text-white/20">{t('model.landing.footer_title_line2')}</span>
                        </h2>
                    </div>

                    <div className="flex flex-col items-center gap-10">
                        <Link href={`/${language}/elite/signup`} className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 rounded-full bg-white text-black font-black text-lg shadow-2xl transition-all duration-500 hover:scale-[1.05] active:scale-95">
                            {t('model.landing.footer_cta')}
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </Link>

                        <div className="flex items-center justify-center gap-12 opacity-40">
                            <ShieldCheck size={32} />
                            <Globe size={32} />
                            <Heart size={32} />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
