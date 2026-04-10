import { useState } from "react";
import { ArrowRight, ShieldCheck, Mail, Lock, User } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import Link from "next/link";

interface SignupModalProps {
    onSignup: (email: string) => void;
}

export function SignupModal({ onSignup }: SignupModalProps) {
    const { t, language } = useTranslation();
    const [email, setEmail] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [password, setPassword] = useState("");
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed || !email || !pseudo || !password) return;
        onSignup(email);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <div className="bg-neutral-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                <div className="text-center mb-8 mt-2">
                    <h2 className="text-3xl font-bold text-white mb-3">{t('signup.title')}</h2>
                    <p className="text-white/70 text-sm leading-relaxed">
                        {t('signup.desc')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input type="text" placeholder={t('signup.pseudo')} required value={pseudo} onChange={e => setPseudo(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 shadow-inner text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input type="email" placeholder={t('signup.email')} required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 shadow-inner text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input type="password" placeholder={t('signup.password')} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 shadow-inner text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2">
                        <input type="checkbox" id="tos" required checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 checked:bg-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900" />
                        <label htmlFor="tos" className="text-xs text-white/60 leading-tight">
                            {t('signup.tos').split('{{terms}}').map((part, index, array) => (
                                <span key={index}>
                                    {part}
                                    {index < array.length - 1 && (
                                        <Link 
                                            href={`/${language}/terms`} 
                                            target="_blank"
                                            className="text-pink-500 hover:text-pink-400 underline transition-colors mx-0.5"
                                        >
                                            {t('auth.terms_link')}
                                        </Link>
                                    )}
                                </span>
                            ))}
                        </label>
                    </div>

                    <button type="submit" disabled={!agreed} className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-indigo-500/20">
                        {t('signup.cta')} <ArrowRight size={20} />
                    </button>

                    <div className="text-center mt-6 text-white/30 text-[11px] flex items-center justify-center gap-1.5 uppercase tracking-wider font-semibold">
                        <ShieldCheck size={14} /> {t('signup.secure')}
                    </div>
                </form>
            </div>
        </div>
    );
}
