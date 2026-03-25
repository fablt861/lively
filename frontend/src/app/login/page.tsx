"use client";

import { useState } from "react";
import { ArrowRight, User, Lock, Video } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"user" | "model">("user");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("kinky_token", data.token);
                localStorage.setItem("kinky_role", data.user.role);
                localStorage.setItem("kinky_email", data.user.email);

                if (data.user.role === 'model') {
                    // Models go directly to Video Room (acting as model) or Dashboard
                    localStorage.setItem("kinky_account_status", 'active_model');
                    window.location.href = '/model/dashboard'; // Or a dedicated launching page
                } else {
                    // Users
                    localStorage.setItem("kinky_account_status", 'registered');
                    window.location.href = '/';
                }
            } else {
                setError(data.error || "Identifiants invalides.");
            }
        } catch (err) {
            setError("Erreur de connexion.");
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
                <div className="w-full bg-neutral-900/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                    <h1 className="text-3xl font-bold mb-2">Bon retour.</h1>
                    <p className="text-sm text-neutral-400 mb-8">Connectez-vous à votre compte.</p>

                    <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                        <button onClick={() => setRole("user")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'user' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}>Client</button>
                        <button onClick={() => setRole("model")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${role === 'model' ? 'bg-pink-500/20 text-pink-400' : 'text-neutral-500 hover:text-white'}`}>Créatrice</button>
                    </div>

                    {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                            <input type="email" required placeholder="Adresse Email" className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 text-white focus:outline-none focus:border-indigo-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                            <input type="password" required placeholder="Mot de passe" className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 text-white focus:outline-none focus:border-indigo-500 transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>

                        <button type="submit" className={`w-full mt-6 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg ${role === 'model' ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:scale-[1.02] shadow-pink-500/20' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] shadow-indigo-500/20'}`}>
                            Se connecter <ArrowRight size={20} />
                        </button>
                    </form>

                    {role === 'model' && (
                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-sm text-neutral-400 mb-4">Pas encore de compte Créatrice ?</p>
                            <Link href="/model/signup" className="text-pink-400 text-sm font-bold flex items-center justify-center gap-1.5 hover:text-pink-300">
                                <Video size={16} /> Soumettre ma candidature
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
