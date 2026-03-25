"use client";

import { useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Camera,
    CheckCircle2,
    ShieldCheck,
    MapPin,
    Phone,
    User,
    Mail,
    Lock,
    Check,
    DollarSign,
    Clock,
    EyeOff,
    HeartPulse
} from "lucide-react";
import Link from "next/link";

export default function ModelSignupPage() {
    const [step, setStep] = useState(1);

    // Form State
    const [country, setCountry] = useState("");
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [photo3Fingers, setPhoto3Fingers] = useState<string | null>(null);
    const [photo5Fingers, setPhoto5Fingers] = useState<string | null>(null);
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => Math.max(1, s - 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/auth/model/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country, phone, name, dob, email, password, photo3Fingers, photo5Fingers })
            });
            const data = await res.json();
            if (data.success) {
                setStep(5); // Confirmation Step
            } else {
                setApiError(data.error || "Une erreur s'est produite.");
            }
        } catch (err) {
            setApiError("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    // Fake Camera Capture
    const mockCapture = (type: 3 | 5) => {
        setTimeout(() => {
            if (type === 3) setPhoto3Fingers("captured");
            if (type === 5) setPhoto5Fingers("captured");
        }, 800);
    };

    const steps = [
        { id: 1, label: "Pays" },
        { id: 2, label: "Contact" },
        { id: 3, label: "Identité" },
        { id: 4, label: "Vérification" }
    ];

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col font-sans relative overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none translate-x-1/2 -translate-y-1/2 opacity-50" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 translate-y-1/2 opacity-30" />

            {/* Navbar */}
            <nav className="relative z-30 flex justify-between items-center px-6 lg:px-12 py-6 border-b border-white/5 backdrop-blur-md bg-black/20">
                <Link href="/" className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
                    KINKY<span className="text-pink-500">.</span> <span className="text-xs font-bold text-white/40 ml-2 tracking-widest uppercase align-middle">Modèles</span>
                </Link>
                <Link href="/login" className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">
                    Déjà membre ? Connexion
                </Link>
            </nav>

            {/* Split Content */}
            <div className="flex-1 flex flex-col lg:flex-row relative z-20">

                {/* Left Side: Benefits (Desktop only/ordered first) */}
                <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-24 py-12 bg-white/[0.02] border-r border-white/5">
                    <div className="max-w-md space-y-12">
                        <div className="space-y-4">
                            <h1 className="text-4xl xl:text-5xl font-black leading-tight">
                                Transformez votre <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">potentiel en revenus.</span>
                            </h1>
                            <p className="text-lg text-white/40 font-light">
                                Rejoignez le réseau #1 des créatrices VIP. Un environnement sécurisé pour des revenus exceptionnels.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { icon: DollarSign, title: "Gagnez jusqu'à 200€ / Heure", desc: "Le meilleur reversement du marché, payé chaque semaine sans délai.", color: "text-green-400" },
                                { icon: EyeOff, title: "100% Anonyme & Sécurisé", desc: "Contrôlez votre visibilité. Pas de replay, pas de screenshots techniques.", color: "text-indigo-400" },
                                { icon: Clock, title: "Liberté totale", desc: "Aucun contrat, aucune obligation. Connectez-vous quand vous le souhaitez.", color: "text-pink-400" },
                                { icon: HeartPulse, title: "Support Premium 24/7", desc: "Une équipe dédiée pour vous accompagner dans votre succès.", color: "text-rose-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 group items-center">
                                    <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-xl`}>
                                        <item.icon size={26} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white/90">{item.title}</h3>
                                        <p className="text-sm text-white/30 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

                    {/* Progress Indicator */}
                    {step < 5 && (
                        <div className="w-full max-w-md mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <button onClick={handlePrev} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors ${step === 1 ? 'invisible' : 'text-neutral-500'}`}>
                                    <ArrowLeft size={14} /> Précédent
                                </button>
                                <div className="text-[10px] font-black tracking-[0.3em] text-pink-500 uppercase">Étape {step} / 4</div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                                {steps.map(s => (
                                    <div key={s.id} className={`h-full flex-1 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-gradient-to-r from-pink-500 to-indigo-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-white/5'}`} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-md bg-neutral-900 border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">

                        {/* Internal Glow */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500/20 via-indigo-500/20 to-pink-500/20" />

                        {apiError && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm text-center animate-in zoom-in duration-300">
                                {apiError}
                            </div>
                        )}

                        {/* STEP 1: PAYS */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-2xl">
                                        <MapPin size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-3">Votre Pays</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed px-4">Cette information est uniquement utilisée pour la validation et ne sera jamais visible par les utilisateurs.</p>
                                </div>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                    <select
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-white/30 transition-all cursor-pointer"
                                        value={country}
                                        onChange={e => setCountry(e.target.value)}
                                    >
                                        <option value="" disabled>Où vivez-vous ?</option>
                                        <option value="FR">France</option>
                                        <option value="BE">Belgique</option>
                                        <option value="CH">Suisse</option>
                                        <option value="CA">Canada</option>
                                        <option value="IT">Italie</option>
                                        <option value="ES">Espagne</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                        <ArrowRight size={16} className="rotate-90" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleNext}
                                    disabled={!country}
                                    className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl shadow-indigo-500/10 active:scale-95"
                                >
                                    Continuer <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* STEP 2: TELEPHONE */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mx-auto mb-6 shadow-2xl">
                                        <Phone size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-3">Contact Direct</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed px-4">Recevez une notification SMS dès que votre compte est approuvé par notre équipe.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-[100px] shrink-0">
                                        <select className="w-full bg-black/50 border border-white/10 rounded-2xl py-4.5 px-2 text-white appearance-none focus:outline-none focus:border-white/30 text-center font-bold">
                                            <option>+33</option>
                                            <option>+32</option>
                                            <option>+41</option>
                                            <option>+39</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="Numéro de mobile"
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em] font-bold pt-4">Aucune publicité, 100% privé</p>
                                <button
                                    onClick={handleNext}
                                    disabled={phone.length < 8}
                                    className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl shadow-pink-500/10 active:scale-95"
                                >
                                    Suivant <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* STEP 3: IDENTITÉ & COMPTE */}
                        {step === 3 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-2xl">
                                        <User size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Identification</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed">Assurons-nous que vous êtes une personne réelle et majeure.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom (Pièce d'identité)" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10" />
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold uppercase tracking-widest">Né(e) le</div>
                                        <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-24 pr-4 text-white focus:outline-none focus:border-white/30 transition-all [&::-webkit-calendar-picker-indicator]:filter-[invert(0.5)]" />
                                    </div>

                                    <div className="h-px bg-white/5 w-full my-4"></div>

                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (Identifiant)" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10" />
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10" />
                                    </div>
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={!name || !dob || !email || !password}
                                    className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl active:scale-95"
                                >
                                    Suivant <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* STEP 4: PHOTOS VERIFICATION */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mx-auto mb-6 shadow-2xl">
                                        <Camera size={28} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Vérification</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed px-4">Photos simples pour valider votre dossier (usage interne uniquement).</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { id: 3, label: "3 doigts à côté du visage", photo: photo3Fingers },
                                        { id: 5, label: "5 doigts à côté du visage", photo: photo5Fingers }
                                    ].map((p, idx) => (
                                        <div key={idx} className={`p-5 rounded-3xl border transition-all duration-300 ${p.photo ? 'bg-green-500/10 border-green-500/40' : 'bg-black/40 border-white/5 group hover:border-white/20'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="font-bold text-xs uppercase tracking-widest text-white/50">{idx + 1}. Consigne</p>
                                                {p.photo && <CheckCircle2 className="text-green-500" size={18} />}
                                            </div>
                                            <p className="text-sm font-medium mb-4 text-white/90">{p.label}</p>
                                            {!p.photo ? (
                                                <button onClick={() => mockCapture(p.id as 3 | 5)} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-98">
                                                    <Camera size={18} /> Ouvrir Caméra
                                                </button>
                                            ) : (
                                                <div className="w-full py-3 text-green-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                                    Validé
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!photo3Fingers || !photo5Fingers || loading}
                                    className="w-full mt-6 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl active:scale-95"
                                >
                                    {loading ? 'Soumission...' : 'Soumettre mon dossier'}
                                    {!loading && <Check size={20} />}
                                </button>
                            </div>
                        )}

                        {/* STEP 5: CONFIRMATION */}
                        {step === 5 && (
                            <div className="text-center py-6 animate-in zoom-in-95 duration-500 space-y-8">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 animate-bounce">
                                        <Check size={48} className="text-green-400" />
                                    </div>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-green-400/30 rounded-full blur-2xl animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-3xl font-black">Bienvenue chez KINKY !</h1>
                                    <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto">
                                        Votre candidature est entre de bonnes mains. Notre équipe vérifie les dossiers sous <span className="text-white font-bold text-base">24 heures</span> en moyenne.<br /><br />
                                        Gardez un oeil sur votre téléphone et vos emails !
                                    </p>
                                </div>

                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full py-5 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-[0.3em] transition-all block active:scale-95"
                                >
                                    J'ai compris, merci !
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-white/20 text-[10px] flex items-center gap-2 uppercase tracking-[0.2em] font-bold">
                        <ShieldCheck size={14} className="text-white/40" />
                        Données confidentielles & Sécurisées
                    </div>
                </div>
            </div>
        </div>
    );
}
