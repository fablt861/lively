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
        localStorage.setItem('kinky_user_role', 'user');
        window.location.href = '/live';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>

            <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[95dvh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-white/40 hover:text-white transition-colors z-20">
                    <X size={20} className="md:w-6 md:h-6" />
                </button>

                {step === 'select' ? (
                    <div className="p-6 md:p-12 text-center overflow-y-auto">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 leading-tight">Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 font-black">KINKY.</span></h2>
                        <p className="text-white/60 mb-6 md:mb-10 text-sm">Veuillez sélectionner votre profil</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Option Homme */}
                            <button
                                onClick={handleSelectMale}
                                className="group relative flex flex-col items-center gap-3 md:gap-4 p-5 md:p-8 rounded-2xl md:rounded-3xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300"
                            >
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Mars size={24} className="md:w-8 md:h-8" />
                                </div>
                                <span className="block text-lg md:text-xl font-bold text-white uppercase tracking-tight">Homme</span>
                                <ArrowRight className="absolute bottom-3 right-3 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" size={16} />
                            </button>

                            {/* Option Femme */}
                            <button
                                onClick={() => setStep('female_info')}
                                className="group relative flex flex-col items-center gap-3 md:gap-4 p-5 md:p-8 rounded-2xl md:rounded-3xl bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 hover:border-pink-500/50 transition-all duration-300"
                            >
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                                    <Venus size={24} className="md:w-8 md:h-8" />
                                </div>
                                <span className="block text-lg md:text-xl font-bold text-white uppercase tracking-tight">Femme</span>
                                <ArrowRight className="absolute bottom-3 right-3 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" size={16} />
                            </button>
                        </div>

                        <div className="mt-6 md:mt-10 flex items-center justify-center gap-2 text-white/40 text-[9px] font-bold uppercase tracking-widest">
                            <ShieldCheck size={12} className="text-green-500/80" />
                            Accès 100% sécurisé & privé
                        </div>
                    </div>
                ) : (
                    <div className="p-6 md:p-12 text-center animate-in fade-in slide-in-from-right-10 duration-500 overflow-y-auto">
                        <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 mx-auto mb-4 md:mb-8">
                            <Venus size={24} className="md:w-10 md:h-10" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-4">Espace Créatrices</h2>
                        <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto mb-6 md:mb-10 px-4 md:px-0">
                            Sur <span className="text-white font-bold">KINKY</span>, les profils féminins sont réservés à nos créatrices vérifiées.
                        </p>

                        <div className="flex flex-col gap-3 md:gap-4 max-w-xs mx-auto">
                            <Link
                                href="/model/signup"
                                className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold text-base md:text-lg hover:opacity-90 transition-all shadow-lg"
                            >
                                Créer mon compte gratuite
                            </Link>
                            <Link
                                href="/login"
                                className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base md:text-lg hover:bg-white/10 transition-all"
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
                                    localStorage.setItem('kinky_user_role', 'model');
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
        </div >
    );
}
