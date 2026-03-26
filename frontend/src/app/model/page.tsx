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
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-pink-500/30">
            {/* Background Light Effects */}
            <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none translate-x-1/2 -translate-y-1/2 opacity-60" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 translate-y-1/2 opacity-40" />

            {/* Navbar */}
            <nav className="relative z-50 flex justify-between items-center px-6 lg:px-12 py-8 max-w-7xl mx-auto w-full">
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
            <header className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Star size={14} className="fill-indigo-400" />
                    Le réseau #1 des créatrices VIP
                </div>

                <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[0.95] tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    Votre beauté est <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-400">votre empire.</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/40 font-light max-w-2xl leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    Kinky.live offre aux modèles d'exception un environnement ultra-premium, anonyme et hautement rémunérateur. Plus qu'une plateforme, votre salon VIP privé.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
                    <Link href="/model/signup" className="px-10 py-6 rounded-full bg-white text-black font-black text-lg shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all duration-300">
                        Postuler maintenant
                    </Link>
                    <a href="#simulator" className="px-10 py-6 rounded-full bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 transition-all">
                        Voir mes gains potentiels
                    </a>
                </div>
            </header>

            {/* Statistics / Trust Bar */}
            <div className="relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    <div>
                        <div className="text-3xl font-black text-white mb-1">60€ - 200€</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Par Heure</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white mb-1">Hebdo</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Paiement Garanti</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white mb-1">100%</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Anonymat Total</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white mb-1">24/7</div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Support Dédié</div>
                    </div>
                </div>
            </div>

            {/* Income Simulator Section */}
            <section id="simulator" className="relative z-10 py-32 px-6 flex flex-col items-center max-w-7xl mx-auto w-full gap-20">
                <div className="text-center space-y-4 max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight">Projetez votre succès.</h2>
                    <p className="text-white/40 text-lg">Choisissez votre investissement temps et découvrez pourquoi Kinky est le choix numéro 1 des élites.</p>
                </div>

                <div className="w-full flex justify-center">
                    <ModelSimulator />
                </div>
            </section>

            {/* Features / Benefits */}
            <section id="benefits" className="relative z-10 py-32 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
                    <div className="space-y-6 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 transition-all duration-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                            <Lock size={28} />
                        </div>
                        <h3 className="text-2xl font-bold">Confidentialité Absolue</h3>
                        <p className="text-white/40 leading-relaxed font-light">Contrôle total sur votre visibilité. Pas de replay, pas d'enregistrement. Votre vie privée est notre actif le plus précieux.</p>
                        <ul className="space-y-3 pt-4">
                            {["Floutage intelligent", "Blocage géographique", "Capture désactivée"].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/60">
                                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 transition-all duration-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                            <DollarSign size={28} />
                        </div>
                        <h3 className="text-2xl font-bold">Revenus Sans Plafond</h3>
                        <p className="text-white/40 leading-relaxed font-light">Les meilleurs tarifs de l'industrie. Les membres Kinky sont sélectionnés pour leur générosité et leur respect.</p>
                        <ul className="space-y-3 pt-4">
                            {["Commissions premium", "Gifts instantanés", "Bonus hebdomadaires"].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/60">
                                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 transition-all duration-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-2xl font-bold">Liberté Totale</h3>
                        <p className="text-white/40 leading-relaxed font-light">Pas de contrat, pas d'horaires imposés. Soyez votre propre patron et gérez votre temps avec flexibilité.</p>
                        <ul className="space-y-3 pt-4">
                            {["Sans engagement", "Zéro frais initiaux", "Dispo 24/7"].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm font-bold text-white/60">
                                    <CheckCircle2 size={16} className="text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="relative z-10 py-32 border-t border-white/5 bg-white/[0.01]">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight">Prête à rejoindre l'élite ?</h2>
                    <p className="text-xl text-white/40 max-w-xl mx-auto">Rejoignez une communauté de créatrices qui exigent le meilleur. Inscription gratuite et rapide.</p>
                    <div className="pt-8">
                        <Link href="/model/signup" className="group relative inline-flex items-center justify-center gap-4 px-12 py-7 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500 text-white font-black text-xl shadow-[0_30px_60px_rgba(236,72,153,0.3)] transition-all duration-500 hover:scale-[1.05] active:scale-95 overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                            <span className="relative z-10">Créer mon compte modèle</span>
                            <ArrowRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform duration-500" />
                        </Link>
                    </div>
                    <div className="pt-16 flex items-center justify-center gap-10 opacity-30">
                        <ShieldCheck size={40} />
                        <Globe size={40} />
                        <Heart size={40} />
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] pt-8">© 2026 KINKY.LIVE • TOUS DROITS RÉSERVÉS</p>
                </div>
            </footer>
        </div>
    );
}
