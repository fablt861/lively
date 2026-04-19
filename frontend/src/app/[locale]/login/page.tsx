"use client";

import { useState } from "react";
import { ArrowRight, User, Zap, Video, X, Mail, ShieldCheck, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function LoginPage() {
    const { t, language } = useTranslation();
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
            if (password !== confirmPassword) {
                return setError(t('login.error_password_match'));
            }
            if (!acceptCGV) {
                return setError(t('login.error_cgv'));
            }
            if (pseudo.length < 3) {
                return setError(t('login.error_pseudo_short'));
            }
        }

        setLoading(true);

        try {
            let marketingParams = {};
            if (mode === 'signup') {
                const saved = localStorage.getItem("kinky_marketing_params");
                if (saved) {
                    marketingParams = JSON.parse(saved);
                }
            }

            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload = mode === 'login'
                ? { email, password }
                : { email, password, pseudo, ...marketingParams };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("kinky_token", data.token);
                localStorage.setItem("kinky_user_id", data.user.id);
                localStorage.setItem("kinky_user_role", data.user.role);
                localStorage.setItem("kinky_user_email", data.user.email);
                localStorage.setItem("kinky_user_pseudo", data.user.name);

                if (data.user.role === 'model') {
                    localStorage.setItem("kinky_account_status", 'active_model');
                    window.location.href = `/${language}/elite/dashboard`;
                } else {
                    localStorage.setItem("kinky_account_status", 'registered');
                    window.location.href = `/${language}`;
                }
            } else {
                setError(data.error || t('login.error_invalid'));
            }
        } catch (err) {
            setError(t('login.error_connect'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop&crop=faces')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-luminosity"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-[#050505]/80 pointer-events-none"></div>

            <nav className="relative z-20 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <Link href={`/${language}`} className="text-2xl font-black tracking-tighter text-white drop-shadow-md cursor-pointer">
                    KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                </Link>
                <div className="flex gap-4 items-center">
                    <LanguageSelector />
                </div>
            </nav>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto">
                <div className="w-full bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
                    <Link href={`/${language}`} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </Link>

                    <h1 className="text-3xl font-bold mb-2">
                        {mode === 'login' ? t('login.welcome_back') : t('login.welcome')}
                    </h1>
                    <p className="text-sm text-neutral-400 mb-8">
                        {mode === 'login' ? t('login.desc_login') : t('login.desc_signup')}
                    </p>

                    <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8">
                        <button
                            onClick={() => setMode("login")}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                        >
                            {t('login.tab_login')}
                        </button>
                        <button
                            onClick={() => setMode("signup")}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                        >
                            {t('login.tab_signup')}
                        </button>
                    </div>

                    {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl text-center animate-in fade-in duration-300">{t(error)}</div>}

                    <form onSubmit={handleAction} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    placeholder={t('login.pseudo_placeholder')}
                                    className="w-full bg-black/60 border border-white/20 rounded-2xl py-4.5 pl-12 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40"
                                    value={pseudo}
                                    onChange={e => setPseudo(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                            <input
                                type="email"
                                required
                                placeholder={t('login.email_placeholder')}
                                className="w-full bg-black/60 border border-white/20 rounded-2xl py-4.5 pl-12 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                placeholder={t('login.password_placeholder')}
                                className="w-full bg-black/60 border border-white/20 rounded-2xl py-4.5 pl-12 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        {mode === 'signup' && (
                            <>
                                <div className="relative group">
                                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        placeholder={t('login.confirm_password_placeholder')}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl py-4.5 pl-12 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div onClick={() => setAcceptCGV(!acceptCGV)} className="text-white/20 group-hover:text-white/40 transition-colors">
                                            {acceptCGV ? <CheckSquare className="text-pink-500" size={20} /> : <Square size={20} />}
                                        </div>
                                        <span className="text-[10px] text-neutral-500 font-medium">
                                            {t('login.accept_cgv').split('{{terms}}').map((part, index, array) => (
                                                <span key={index}>
                                                    {part}
                                                    {index < array.length - 1 && (
                                                        <Link 
                                                            href={`/${language}/terms`} 
                                                            target="_blank"
                                                            className="text-pink-500 hover:text-pink-400 underline transition-colors mx-0.5"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {t('auth.terms_link')}
                                                        </Link>
                                                    )}
                                                </span>
                                            ))}
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-6 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${mode === 'signup' ? 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-pink-500/20' : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-500/20'}`}
                        >
                            {loading ? t('login.cta_loading') : mode === 'login' ? t('login.cta_login') : t('login.cta_signup')}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                        <ShieldCheck size={14} />
                        {t('login.secure_access')}
                    </div>
                </div>
            </main>
        </div>
    );
}
