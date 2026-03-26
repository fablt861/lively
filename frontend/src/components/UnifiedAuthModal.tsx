"use client";

import { useState } from "react";
import { ArrowRight, User, Lock, Mail, ShieldCheck, X, CheckSquare, Square } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface UnifiedAuthModalProps {
    onSuccess: (email: string, role: string, pseudo: string) => void;
}

export function UnifiedAuthModal({ onSuccess }: UnifiedAuthModalProps) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [acceptCGV, setAcceptCGV] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (mode === 'signup') {
            if (password !== confirmPassword) return setError(t('auth.error.password_match'));
            if (!acceptCGV) return setError(t('auth.error.cgv'));
            if (pseudo.length < 3) return setError(t('auth.error.pseudo_short'));
        }

        setLoading(true);
        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload = mode === 'login' ? { email, password } : { email, password, pseudo };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                onSuccess(data.user.email, data.user.role, data.user.name);
            } else {
                setError(t(data.error) || t('auth.error.invalid'));
            }
        } catch (err) {
            setError(t('auth.error.network'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {mode === 'login' ? t('auth.login_title') : t('auth.signup_title')}
                    </h2>
                    <p className="text-white/60 text-sm">
                        {mode === 'login' ? t('auth.login_desc') : t('auth.signup_desc')}
                    </p>
                </div>

                <div className="flex bg-black/40 p-1 rounded-2xl mb-8 border border-white/5">
                    <button
                        onClick={() => setMode("login")}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${mode === 'login' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                    >
                        {t('auth.login_tab')}
                    </button>
                    <button
                        onClick={() => setMode("signup")}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${mode === 'signup' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                    >
                        {t('auth.signup_tab')}
                    </button>
                </div>

                {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold rounded-xl text-center animate-shake uppercase tracking-tight">{error}</div>}

                <form onSubmit={handleAction} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={18} />
                            <input type="text" required placeholder={t('auth.pseudo_placeholder')} className="w-full bg-neutral-800 border border-white/30 rounded-2xl py-4 pl-12 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-white/60" value={pseudo} onChange={e => setPseudo(e.target.value)} />
                        </div>
                    )}
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors" size={18} />
                        <input type="email" required placeholder={t('auth.email_placeholder')} className="w-full bg-neutral-800 border border-white/30 rounded-2xl py-4 pl-12 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-white/60" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors" size={18} />
                        <input type="password" required placeholder={t('auth.password_placeholder')} className="w-full bg-neutral-800 border border-white/30 rounded-2xl py-4 pl-12 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-white/60" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    {mode === 'signup' && (
                        <>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/80 transition-colors" size={18} />
                                <input type="password" required placeholder={t('auth.confirm_password_placeholder')} className="w-full bg-neutral-800 border border-white/30 rounded-2xl py-4 pl-12 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-white/60" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div onClick={() => setAcceptCGV(!acceptCGV)} className="text-white/20 group-hover:text-white/40 transition-colors">
                                        {acceptCGV ? <CheckSquare className="text-pink-500" size={20} /> : <Square size={20} />}
                                    </div>
                                    <span className="text-[10px] text-white/50 font-medium">{t('auth.accept_cgv')}</span>
                                </label>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-6 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${mode === 'signup' ? 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-pink-500/20' : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-500/20'}`}
                    >
                        {loading ? t('auth.loading') : mode === 'login' ? t('auth.login_btn') : t('auth.signup_btn')}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <ShieldCheck size={14} />
                    {t('auth.secure')}
                </div>
            </div>
        </div>
    );
}
