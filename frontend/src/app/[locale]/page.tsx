"use client";

import { useState, useEffect } from "react";
import { Camera, ShieldCheck, Flame, Play, Video, ChevronDown, CreditCard, Wallet } from "lucide-react";
import Link from "next/link";
import { GenderModal } from "@/components/GenderModal";
import { OnlineGauge } from "@/components/OnlineGauge";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PaywallModal } from "@/components/PaywallModal";

export default function Home() {
    // Build version: 1.0.2 - Matchmaking fixes
    const { t, language } = useTranslation();
    const [showGenderModal, setShowGenderModal] = useState(false);
    const [userPseudo, setUserPseudo] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [userCredits, setUserCredits] = useState(0);

    useEffect(() => {
        const storedPseudo = localStorage.getItem('kinky_user_pseudo');
        if (storedPseudo) {
            setUserPseudo(storedPseudo);
        }
        const storedCredits = localStorage.getItem('kinky_credits');
        if (storedCredits) {
            setUserCredits(parseFloat(storedCredits));
        }
    }, [showPaywall]);

    const handleLogout = () => {
        localStorage.removeItem('kinky_token');
        localStorage.removeItem('kinky_user_pseudo');
        localStorage.removeItem('kinky_user_email');
        localStorage.removeItem('kinky_user_role');
        localStorage.removeItem('kinky_account_status');
        localStorage.removeItem('kinky_credits');
        localStorage.removeItem('kinky_role'); // Legacy cleanup
        localStorage.removeItem('kinky_email'); // Legacy cleanup
        setUserPseudo(null);
    };

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col relative overflow-x-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 lg:hidden bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop&crop=faces')] bg-cover bg-center opacity-30 pointer-events-none mix-blend-luminosity"></div>
            <div className="absolute inset-0 lg:hidden bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/30 pointer-events-none"></div>

            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[140px] pointer-events-none translate-x-1/3 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/4 translate-y-1/4" />

            {/* Navbar */}
            <nav className="relative z-20 flex justify-between items-center px-6 py-6 lg:px-12 w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-6">
                    <div className="text-3xl font-black tracking-tighter text-white drop-shadow-md cursor-default mr-4">
                        KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <LanguageSelector />
                    {userPseudo ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 transition-all group"
                            >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black">
                                    {userPseudo.substring(0, 1).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-white tracking-widest uppercase">
                                    {userPseudo}
                                </span>
                                <ChevronDown size={14} className={`text-white/40 group-hover:text-white transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 animate-in fade-in zoom-in duration-200">
                                        <div className="px-5 py-4 border-b border-white/5">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1.5">{t('nav.menu.balance', { amount: 0 }).split(':')[0]}</p>
                                            <div className="flex items-center gap-2">
                                                <Wallet size={16} className="text-indigo-400" />
                                                <span className="text-sm font-black text-white tracking-tight">
                                                    {userCredits.toFixed(0)} <span className="text-[10px] text-white/60">CREDITS</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setShowPaywall(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white transition-colors group"
                                            >
                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    <CreditCard size={16} />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider">{t('nav.menu.buy')}</span>
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/5 text-red-500 transition-colors mt-1"
                                            >
                                                <div className="p-2 bg-red-500/10 rounded-lg">
                                                    <Play size={16} className="rotate-180" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider">{t('nav.logout')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <Link href={`/${language}/login`} className="text-xs font-bold text-white/90 bg-white/5 hover:bg-white/10 transition-all border border-white/10 rounded-full px-6 py-2.5 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] tracking-widest uppercase">
                            {t('nav.login')}
                        </Link>
                    )}
                </div>
            </nav>

            {/* Main Hero */}
            <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 w-full max-w-7xl mx-auto gap-16 pt-8 pb-24">

                {/* Left Text / CTA */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                    <OnlineGauge />

                    <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05]">
                        {t('hero.title.part1')} <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            {t('hero.title.part2')}
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-neutral-400 font-light max-w-xl leading-relaxed">
                        {t('hero.description')}
                    </p>

                    <div className="flex flex-col items-center lg:items-start gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto pt-6">
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('kinky_token');
                                    const role = localStorage.getItem('kinky_role');

                                    if (token) {
                                        if (role === 'model') {
                                            window.location.href = `/${language}/model/dashboard`;
                                        } else {
                                            window.location.href = `/${language}/live`;
                                        }
                                    } else {
                                        setShowGenderModal(true);
                                    }
                                }}
                                className="group relative w-full sm:w-auto px-10 py-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-90 shadow-[0_0_50px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 border border-white/20"
                            >
                                <Video size={24} className="text-white fill-white relative z-10" />
                                <span className="text-white font-black text-lg tracking-wide relative z-10">{t('hero.cta')}</span>
                            </button>
                        </div>
                        <p className="text-[13px] text-white/80 uppercase tracking-[0.4em] font-bold italic">
                            {t('hero.badge')}
                        </p>
                    </div>
                </div>

                {/* Right Visual Floating Elements */}
                <div className="flex-1 w-full relative hidden lg:flex items-center justify-center h-[550px] perspective-1000">
                    {/* Center App Mockup */}
                    <div className="relative w-[320px] h-[550px] rounded-[2.5rem] border border-white/20 bg-neutral-900/50 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-between overflow-hidden group transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out">
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&crop=faces" alt="Model" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />

                        {/* Mockup UI Top */}
                        <div className="relative z-10 w-full flex justify-between items-center p-5">
                            <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white text-[10px] font-bold tracking-widest mt-px">{t('mockup.live')}</span>
                            </div>
                        </div>

                        {/* Mockup UI Bottom */}
                        <div className="relative z-10 w-full pb-8 text-center flex flex-col items-center">
                            <h3 className="text-3xl font-black text-white drop-shadow-2xl mb-1 uppercase tracking-tighter">{t('mockup.private')}</h3>
                            <p className="text-sm text-white/90 drop-shadow-md font-bold">{t('mockup.connecting')}</p>
                            <div className="mt-6 w-16 h-16 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/50 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                                <Video className="text-white" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Floating element 1 */}
                    <div className="absolute top-12 right-6 w-24 h-24 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-xl p-2 shadow-2xl transform hover:-translate-y-4 hover:rotate-6 transition-all duration-500 cursor-default">
                        <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces" className="w-full h-full rounded-xl object-cover" alt="Floating avatar" />
                    </div>

                    {/* Floating element 2 */}
                    <div className="absolute bottom-24 -left-4 w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl p-2 shadow-2xl transform hover:-translate-y-4 hover:-rotate-6 transition-all duration-500 cursor-default z-20">
                        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces" className="w-full h-full rounded-[1.5rem] object-cover" alt="Floating avatar" />
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute top-1/2 -right-12 px-5 py-3 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-3 transform -translate-y-1/2 hover:scale-110 transition-all duration-300 z-20">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Flame className="text-orange-500" size={20} />
                        </div>
                        <div>
                            <p className="text-white text-sm font-extrabold">{t('hero.stats.calls')}</p>
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{t('hero.stats.today')}</p>
                        </div>
                    </div>
                </div>
            </main>

            {showGenderModal && <GenderModal onClose={() => setShowGenderModal(false)} />}
            {showPaywall && (
                <PaywallModal
                    onClose={() => setShowPaywall(false)}
                    onPurchase={(credits) => {
                        const current = parseFloat(localStorage.getItem('kinky_credits') || "0");
                        localStorage.setItem('kinky_credits', (current + credits).toString());
                        setUserCredits(current + credits);
                        setShowPaywall(false);
                        alert(`Successfully added ${credits} credits!`);
                    }}
                />
            )}
        </div>
    );
}
