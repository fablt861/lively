"use client";

import { useState } from "react";
import { ArrowRight, User, Lock, Video, X, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [role, setRole] = useState<"user" | "model">("user");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload = mode === 'login'
                ? { email, password, role }
                : { email, password, role: 'user' }; // Signup is always user (client)

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("kinky_token", data.token);
                localStorage.setItem("kinky_role", data.user.role);
                localStorage.setItem("kinky_email", data.user.email);

                if (data.user.role === 'model') {
                    localStorage.setItem("kinky_account_status", 'active_model');
                    window.location.href = '/model/dashboard';
                } else {
                    localStorage.setItem("kinky_account_status", 'registered');
                    window.location.href = '/';
                }
            } else {
                setError(data.error || "Une erreur est survenue.");
            }
        } catch (err) {
            setError("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop&crop=faces')] bg-cover bg-center opacity-10 pointer-events-none mix-blend-luminosity"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-[#050505]/80 pointer-events-none"></div>

            <nav className="relative z-20 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <Link href="/" className="text-2xl font-black tracking-tighter text-white drop-shadow-md cursor-pointer">
                    KINKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">.</span>
                </Link>
            </nav>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto">
                <div className="w-full bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
                    {/* Close Button */}
                    <Link href="/" className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </Link>

                    <h1 className="text-3xl font-bold mb-2">
                        {mode === 'login' ? 'Bon retour.' : 'Bienvenue.'}
                    </h1>
                    <p className="text-sm text-neutral-400 mb-8">
                        {mode === 'login' ? 'Connectez-vous à votre compte.' : 'Créez votre compte client.'}
                    </p>

                    {/* Mode Tabs */}
                    <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8">
                        <button
                            onClick={() => setMode("login")}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Connexion
                        </button>
                        <button
                            onClick={() => setMode("signup")}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Inscription
                        </button>
                    </div>

                    {mode === 'login' && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => setRole("user")}
                                className={`py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg border transition-all ${role === 'user' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                            >
                                Client
                            </button>
                            <button
                                onClick={() => setRole("model")}
                                className={`py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg border transition-all ${role === 'model' ? 'bg-pink-500/10 border-pink-500/50 text-pink-400' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                            >
                                Créatrice
                            </button>
                        </div>
                    )}

                    {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl text-center animate-in fade-in zoom-in duration-300 tracking-tight">{error}</div>}

                    <form onSubmit={handleAction} className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                            <input
                                type="email"
                                required
                                placeholder="Adresse Email"
                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                placeholder="Mot de passe"
                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-6 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${mode === 'signup' || role === 'model' ? 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-pink-500/20' : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-500/20'}`}
                        >
                            {loading ? 'Traitement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    {mode === 'login' && role === 'model' && (
                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-xs text-neutral-500 mb-4 uppercase tracking-widest font-bold">Pas encore de compte ?</p>
                            <Link href="/model/signup" className="text-pink-400 text-sm font-bold flex items-center justify-center gap-1.5 hover:text-pink-300 group">
                                <Video size={16} className="group-hover:scale-110 transition-transform" /> Soumettre ma candidature
                            </Link>
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-center gap-2 text-white/10 text-[9px] font-black uppercase tracking-[0.3em]">
                        <ShieldCheck size={12} />
                        Accès 100% sécurisé
                    </div>
                </div>
            </main>
        </div>
    );
}
