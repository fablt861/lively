"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ShieldCheck, MapPin, Phone, User, Mail, Lock, Check } from "lucide-react";

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

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => Math.max(1, s - 1));

    const handleSubmit = async () => {
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
        }
    };

    // Fake Camera Capture using Unsplash base64 mocks for development
    const mockCapture = (type: 3 | 5) => {
        // In reality this would open navigator.mediaDevices.getUserMedia
        setTimeout(() => {
            if (type === 3) setPhoto3Fingers("data:image/jpeg;base64,mock3fingers...");
            if (type === 5) setPhoto5Fingers("data:image/jpeg;base64,mock5fingers...");
        }, 500);
    };

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col font-sans relative overflow-x-hidden">
            {/* Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

            {/* Navbar */}
            <nav className="relative z-20 flex justify-center items-center p-6 border-b border-white/5">
                <div className="text-2xl font-bold tracking-tighter text-white drop-shadow-md">
                    LIVELY<span className="text-pink-500">.</span> <span className="text-sm font-medium text-white/50 ml-2 tracking-wide uppercase">Créatrices</span>
                </div>
            </nav>

            {/* Main Container */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-xl mx-auto">

                {step < 5 && (
                    <div className="w-full flex items-center justify-between mb-8 opacity-70">
                        <button onClick={handlePrev} className={`flex items-center gap-2 text-sm hover:text-white transition-colors ${step === 1 ? 'invisible' : 'text-neutral-400'}`}>
                            <ArrowLeft size={16} /> Retour
                        </button>
                        <div className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Étape {step} sur 4</div>
                    </div>
                )}

                <div className="w-full bg-neutral-900/50 backdrop-blur-2xl border border-white/10 p-8 sm:p-12 rounded-[2rem] shadow-2xl relative">

                    {apiError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                            {apiError}
                        </div>
                    )}

                    {/* STEP 1: PAYS */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-bold mb-3">Pays</h1>
                                <p className="text-neutral-400 text-sm">Veuillez sélectionner votre pays dans la liste ci-dessous. Celui-ci ne sera PAS visible par les utilisateurs.</p>
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-pink-500 transition-colors"
                                    value={country}
                                    onChange={e => setCountry(e.target.value)}
                                >
                                    <option value="" disabled>Sélectionnez votre pays</option>
                                    <option value="FR">France</option>
                                    <option value="BE">Belgique</option>
                                    <option value="CH">Suisse</option>
                                    <option value="CA">Canada</option>
                                </select>
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={!country}
                                className="w-full mt-8 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                Suivant <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: TELEPHONE */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-bold mb-3">Téléphone</h1>
                                <p className="text-neutral-400 text-sm">Veuillez saisir votre numéro de téléphone. Nous vous enverrons un SMS lorsque votre compte sera validé.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1/3 relative">
                                    <select className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-4 text-white appearance-none focus:outline-none focus:border-pink-500 text-center">
                                        <option>+33</option>
                                        <option>+32</option>
                                        <option>+41</option>
                                    </select>
                                </div>
                                <div className="w-2/3 relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="Numéro de téléphone"
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500 text-center">Ces informations sont totalement confidentielles et ne seront jamais divulguées.</p>
                            <button
                                onClick={handleNext}
                                disabled={phone.length < 8}
                                className="w-full mt-8 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                Suivant <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* STEP 3: IDENTITÉ & COMPTE */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold mb-2">Identification</h1>
                                <p className="text-neutral-400 text-sm">Avant d'approuver votre inscription, nous devons nous assurer que vous êtes une personne réelle majeure.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom complet (sur pièce d'identité)" className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 text-white focus:outline-none focus:border-pink-500 transition-colors" />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">Né(e) le</div>
                                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-20 pr-4 text-white focus:outline-none focus:border-pink-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
                                </div>

                                <div className="h-px bg-white/10 w-full my-4"></div>

                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresse Email (Identifiant)" className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 text-white focus:outline-none focus:border-pink-500 transition-colors" />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 text-white focus:outline-none focus:border-pink-500 transition-colors" />
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!name || !dob || !email || !password}
                                className="w-full mt-6 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                Suivant <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* STEP 4: PHOTOS VERIFICATION */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold mb-2">Vérification visuelle</h1>
                                <p className="text-neutral-400 text-sm">Prenez-vous en photo en suivant exactement les instructions ci-dessous pour valider votre dossier.</p>
                            </div>

                            <div className="space-y-4">
                                {/* Photo 1: 3 fingers */}
                                <div className={`p-4 rounded-2xl border transition-colors ${photo3Fingers ? 'bg-green-500/10 border-green-500/50' : 'bg-black/50 border-white/10'}`}>
                                    <p className="font-bold text-sm mb-3">1. Se montrant avec 3 doigts à côté du visage.</p>
                                    {photo3Fingers ? (
                                        <div className="flex items-center gap-3 text-green-400 font-bold"><CheckCircle2 /> Photo capturée</div>
                                    ) : (
                                        <button onClick={() => mockCapture(3)} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                            <Camera size={18} /> Activer la caméra
                                        </button>
                                    )}
                                </div>

                                {/* Photo 2: 5 fingers */}
                                <div className={`p-4 rounded-2xl border transition-colors ${photo5Fingers ? 'bg-green-500/10 border-green-500/50' : 'bg-black/50 border-white/10'}`}>
                                    <p className="font-bold text-sm mb-3">2. Se montrant avec 5 doigts à côté du visage.</p>
                                    {photo5Fingers ? (
                                        <div className="flex items-center gap-3 text-green-400 font-bold"><CheckCircle2 /> Photo capturée</div>
                                    ) : (
                                        <button onClick={() => mockCapture(5)} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                            <Camera size={18} /> Activer la caméra
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!photo3Fingers || !photo5Fingers}
                                className="w-full mt-6 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                Soumettre mon dossier <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* STEP 5: CONFIRMATION */}
                    {step === 5 && (
                        <div className="text-center py-6 animate-in zoom-in-95 duration-500 space-y-6">
                            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={48} className="text-green-400" />
                            </div>
                            <h1 className="text-3xl font-bold">Inscription terminée</h1>
                            <p className="text-neutral-400 leading-relaxed max-w-sm mx-auto">
                                Un membre de notre équipe examinera attentivement votre inscription dans les plus brefs délais.<br /><br />
                                Vous recevrez un e-mail dès que votre compte aura été validé et vous pourrez commencer à générer des revenus sur LIVELY.
                            </p>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full max-w-xs mx-auto mt-8 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-full transition-all block"
                            >
                                J'ai compris, merci !
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-neutral-500 text-xs flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Processus d'identification ultra-sécurisé
                </div>
            </main>
        </div>
    );
}
