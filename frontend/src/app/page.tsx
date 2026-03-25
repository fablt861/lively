"use client";

import { useState, useEffect } from "react";
import { Camera, ShieldCheck, Flame, Play } from "lucide-react";
import Link from "next/link";
import { GenderModal } from "../components/GenderModal";

export default function Home() {
    const [showGenderModal, setShowGenderModal] = useState(false);

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col relative overflow-x-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 lg:hidden bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop&crop=faces')] bg-cover bg-center opacity-30 pointer-events-none mix-blend-luminosity"></div>
            <div className="absolute inset-0 lg:hidden bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/30 pointer-events-none"></div>

            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[140px] pointer-events-none translate-x-1/3 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/4 translate-y-1/4" />

            {/* Navbar */}
            <nav className="relative z-20 flex justify-between items-center px-6 py-6 lg:px-12 w-full max-w-7xl mx-auto">
                <div className="text-3xl font-bold tracking-tighter text-white drop-shadow-md cursor-default">
                    LIVELY<span className="text-indigo-500">.</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
                        Connexion
                    </Link>
                    <Link href="/model/signup" className="text-sm font-semibold text-white/90 bg-white/10 hover:bg-white/20 transition-all border border-white/10 rounded-full px-5 py-2.5 hover:border-white/30 truncate">
                        Devenir Créatrice
                    </Link>
                </div>
            </nav>

            {/* Main Hero */}
            <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 w-full max-w-7xl mx-auto gap-16 pt-8 pb-24">

                {/* Left Text / CTA */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-[11px] font-bold text-white/90 tracking-widest uppercase mt-px">+2,400 filles en ligne ce soir</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05]">
                        Découvrez qui vous attend de <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            l'autre côté.
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-neutral-400 font-light max-w-xl leading-relaxed">
                        Le chat roulette VIP de nouvelle génération. Connexion vidéo instantanée, 100% anonyme, avec les modèles les plus exclusives du moment.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto pt-6">
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('lively_token');
                                const role = localStorage.getItem('lively_role');

                                if (token) {
                                    if (role === 'model') {
                                        window.location.href = '/model/dashboard';
                                    } else {
                                        window.location.href = '/live';
                                    }
                                } else {
                                    setShowGenderModal(true);
                                }
                            }}
                            className="group relative w-full sm:w-auto px-8 py-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-90 shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 overflow-hidden border border-white/20"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                            <Play size={24} className="text-white fill-white relative z-10" />
                            <span className="text-white font-bold text-lg tracking-wide relative z-10">Lancer l'appel en direct</span>
                        </button>

                        <div className="flex flex-col items-center sm:items-start opacity-70">
                            <p className="text-xs text-white font-bold tracking-wide flex items-center gap-1.5 uppercase">
                                <ShieldCheck size={16} className="text-green-400" />
                                30 secondes offertes
                            </p>
                            <p className="text-[10px] text-white/50 tracking-wider">Aucune carte requise</p>
                        </div>
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
                                <span className="text-white text-[10px] font-bold tracking-widest mt-px">LIVE</span>
                            </div>
                        </div>

                        {/* Mockup UI Bottom */}
                        <div className="relative z-10 w-full pb-8 text-center flex flex-col items-center">
                            <h3 className="text-3xl font-bold text-white drop-shadow-2xl mb-1">Match #4892</h3>
                            <p className="text-sm text-white/90 drop-shadow-md font-medium">Recherche d'un partenaire...</p>
                            <div className="mt-6 w-16 h-16 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/50 flex items-center justify-center animate-bounce shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                                <Camera className="text-white" size={24} />
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
                            <p className="text-white text-sm font-extrabold">+15k appels</p>
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Aujourd'hui</p>
                        </div>
                    </div>
                </div>
            </main>

            {showGenderModal && <GenderModal onClose={() => setShowGenderModal(false)} />}
        </div>
    );
}
