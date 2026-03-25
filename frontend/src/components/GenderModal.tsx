"use client";

import { X, User, Venus, Mars, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface GenderModalProps {
    onClose: () => void;
}

export function GenderModal({ onClose }: GenderModalProps) {
    const [step, setStep] = useState<'select' | 'female_info'>('select');

    const handleSelectMale = () => {
        localStorage.setItem('kinky_role', 'user');
        window.location.href = '/live';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>

            <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-20">
                    <X size={24} />
                </button>

                {step === 'select' ? (
                    <div className="p-8 md:p-12 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 font-black">KINKY.</span></h2>
                        <p className="text-white/60 mb-10">Veuillez sélectionner votre profil pour continuer</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Option Homme */}
                            <button
                                onClick={handleSelectMale}
                                className="group relative flex flex-col items-center gap-4 p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Mars size={32} />
                                </div>
                                <div>
                                    <span className="block text-xl font-bold text-white uppercase tracking-tight">Je suis un Homme</span>
                                </div>
                                <ArrowRight className="absolute bottom-4 right-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Option Femme */}
                            <button
                                onClick={() => setStep('female_info')}
                                className="group relative flex flex-col items-center gap-4 p-8 rounded-3xl bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-500/50 transition-all duration-300"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                                    <Venus size={32} />
                                </div>
                                <div>
                                    <span className="block text-xl font-bold text-white uppercase tracking-tight">Je suis une Femme</span>
                                </div>
                                <ArrowRight className="absolute bottom-4 right-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-green-500/80" />
                            Connexions 100% sécurisées & privées
                        </div>
                    </div>
                ) : (
                    <div className="p-8 md:p-12 text-center animate-in fade-in slide-in-from-right-10 duration-500">
                        <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 mx-auto mb-8">
                            <Venus size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Espace Créatrices</h2>
                        <p className="text-white/60 leading-relaxed max-w-sm mx-auto mb-10">
                            Bonjour ! Sur <span className="text-white font-bold">KINKY</span>, les profils féminins sont réservés à nos créatrices vérifiées.
                            Inscrivez-vous pour commencer à échanger et générer des revenus.
                        </p>

                        <div className="flex flex-col gap-4">
                            <Link
                                href="/model/signup"
                                className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-pink-500/20"
                            >
                                Créer mon compte gratuite
                            </Link>
                            <Link
                                href="/login"
                                className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all"
                            >
                                Se connecter
                            </Link>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <button
                                onClick={() => setStep('select')}
                                className="text-white/40 hover:text-white text-sm font-medium transition-colors"
                            >
                                Retour à la sélection
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.setItem('kinky_role', 'model');
                                    window.location.href = '/live';
                                }}
                                className="text-white/20 hover:text-white/40 text-[10px] uppercase font-bold tracking-widest transition-colors mt-2"
                            >
                                [ Accès Test : Bypass Login ]
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
