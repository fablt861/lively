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
import { ModelSimulator } from "../../components/ModelSimulator";

export default function ModelLandingPage() {
    return (
        <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans relative selection:bg-pink-500/30">
            {/* Mesh Gradient Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse duration-[10s]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-600/15 rounded-full blur-[100px] animate-pulse duration-[8s]" />
                <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[80px]" />

                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex justify-between items-center px-6 lg:px-12 py-10 max-w-7xl mx-auto w-full">
                <Link href="/" className="text-3xl font-black tracking-tighter text-white group">
                    KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 group-hover:from-indigo-500 transition-all duration-500">.</span>
                    <span className="text-[10px] font-black text-white/40 ml-2 uppercase tracking-[0.4em] align-middle">Elite Suite</span>
                </Link>
                <div className="hidden md:flex items-center gap-10">
                    <a href="#simulator" className="text-[11px] font-black text-white/50 hover:text-white transition-colors uppercase tracking-[0.2em]">Simulateur</a>
                    <a href="#benefits" className="text-[11px] font-black text-white/50 hover:text-white transition-colors uppercase tracking-[0.2em]">Avantages</a>
                    <Link href="/model/signup" className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all shadow-xl">
                        Rejoindre
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 min-h-[80vh] flex flex-col items-center justify-center px-6 pt-12 pb-24 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 animate-in fade-in slide-in-from-bottom-4">
                    <Star size={14} className="fill-indigo-400" />
                    Le réseau #1 des créatrices VIP
                </div>

                <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[0.95] tracking-tighter animate-in fade-in slide-in-from-bottom-6">
                    Votre beauté est <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-400">votre empire.</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/40 font-light max-w-2xl leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-8">
                    Kinky.live offre aux modèles d'exception un environnement ultra-premium, anonyme et hautement rémunérateur.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-10">
                    <Link href="/model/signup" className="px-10 py-6 rounded-full bg-white text-black font-black text-lg shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">
                        Postuler maintenant
                    </Link>
                    <a href="#simulator" className="px-10 py-6 rounded-full bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 transition-all">
                        Voir mes revenus
                    </a>
                </div>
            </header>

            {/* Statistics / Trust Bar */}
            <div className="relative z-10 border-y border-white/5 bg-white/[0.01] backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    <div>
                        <div className="text-3xl font-black text-white/90 mb-1">60€ - 200€</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Par Heure</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white/90 mb-1">Hebdo</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Virement Rapide</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white/90 mb-1">100%</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Discrétion VIP</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white/90 mb-1">Privé</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Accès Sécurisé</div>
                    </div>
                </div>
            </div>

            {/* Income Simulator Section */}
            <section id="simulator" className="relative z-10 py-48 px-6 flex flex-col items-center max-w-7xl mx-auto w-full gap-24">
                <div className="text-center space-y-4 max-w-2xl">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Projetez votre succès.</h2>
                    <p className="text-white/40 text-lg md:text-xl font-light">L'outil de calcul pour les créatrices qui exigent le meilleur.</p>
                </div>

                <div className="w-full flex justify-center">
                    <ModelSimulator />
                </div>
            </section>

            {/* Features / Benefits */}
            <section id="benefits" className="relative z-10 py-48 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-24 md:gap-12 lg:gap-20">
                    <div className="space-y-8 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 transition-all duration-500 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                            <Lock size={28} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold tracking-tight">Anonymat Garanti</h3>
                            <p className="text-white/40 leading-relaxed font-light text-lg">Contrôle total sur votre image. Floutage et blocage géographique avancés.</p>
                        </div>
                        <ul className="space-y-4 pt-4 border-t border-white/5">
                            {["Floutage facial IA", "Zones interdites", "No Recording Tech"].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/50">
                                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-8 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 transition-all duration-500 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                            <DollarSign size={28} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold tracking-tight">Reversement Élite</h3>
                            <p className="text-white/40 leading-relaxed font-light text-lg">Gagnez plus sur chaque interaction. Pas de frais cachés, pas de surprises.</p>
                        </div>
                        <ul className="space-y-4 pt-4 border-t border-white/5">
                            {["Taux fixe élevé", "Tips illimités", "Cashout hebdo"].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/50">
                                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-8 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 transition-all duration-500 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                            <Zap size={28} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold tracking-tight">Flexibilité Totale</h3>
                            <p className="text-white/40 leading-relaxed font-light text-lg">Aucun quota, aucune pression. Votre vie, votre planning, vos règles.</p>
                        </div>
                        <ul className="space-y-4 pt-4 border-t border-white/5">
                            {["Sans exclusivité", "Zéro frais fixes", "Dashboard temps réel"].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/50">
                                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="relative z-10 py-48 border-t border-white/5 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-16">
                    <div className="space-y-6">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">Rejoignez <br /> l'exclusivité.</h2>
                        <p className="text-xl text-white/40 max-w-xl mx-auto font-light leading-relaxed">Devenez une égérie Kinky et transformez votre charisme en liberté financière.</p>
                    </div>

                    <div className="pt-8">
                        <Link href="/model/signup" className="group relative inline-flex items-center justify-center gap-4 px-12 py-8 rounded-full bg-white text-black font-black text-xl shadow-[0_30px_60px_rgba(255,255,255,0.1)] transition-all duration-500 hover:scale-[1.05] active:scale-95 overflow-hidden">
                            <span className="relative z-10">Créer mon compte modèle</span>
                            <ArrowRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform duration-500" />
                        </Link>
                    </div>

                    <div className="pt-24 flex items-center justify-center gap-12 opacity-20 filter grayscale hover:grayscale-0 transition-all duration-700">
                        <ShieldCheck size={48} />
                        <Globe size={48} />
                        <Heart size={48} />
                    </div>

                    <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] pt-12">© 2026 KINKY.LIVE • LUXURY DIGITAL EXPERIENCE</p>
                </div>
            </footer>
        </div>
    );
}
