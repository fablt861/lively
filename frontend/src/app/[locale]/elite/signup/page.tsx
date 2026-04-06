"use client";

import { useState, useEffect } from "react";
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
import { useTranslation } from "@/context/LanguageContext";
import { countries } from "@/utils/countries";
import CameraCapture from "@/components/CameraCapture";

export default function ModelSignupPage() {
    const { t, language } = useTranslation();
    const [step, setStep] = useState(1);

    // Form State
    const [country, setCountry] = useState("");
    const [phonePrefix, setPhonePrefix] = useState("+33");
    const [phone, setPhone] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [dob, setDob] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [photoProfile, setPhotoProfile] = useState<string | null>(null);
    const [photoId, setPhotoId] = useState<string | null>(null);
    const [photoIdSelfie, setPhotoIdSelfie] = useState<string | null>(null);
    const [apiError, setApiError] = useState("");
    const [validationError, setValidationError] = useState("");
    const [loading, setLoading] = useState(false);
    const [compressing, setCompressing] = useState<number | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraTarget, setCameraTarget] = useState<'profile' | 'id' | 'selfie' | null>(null);

    // Persistence: Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('kinky_model_signup_draft');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.step) setStep(data.step);
                if (data.country) setCountry(data.country);
                if (data.phonePrefix) setPhonePrefix(data.phonePrefix);
                if (data.phone) setPhone(data.phone);
                if (data.firstName) setFirstName(data.firstName);
                if (data.lastName) setLastName(data.lastName);
                if (data.pseudo) setPseudo(data.pseudo);
                if (data.dob) setDob(data.dob);
                if (data.email) setEmail(data.email);
            } catch (e) {
                console.error("Failed to load signup draft", e);
            }
        }
    }, []);

    // Persistence: Save to localStorage
    useEffect(() => {
        if (step === 5) {
            localStorage.removeItem('kinky_model_signup_draft');
            return;
        }
        const data = { country, phonePrefix, phone, firstName, lastName, pseudo, dob, email, step };
        localStorage.setItem('kinky_model_signup_draft', JSON.stringify(data));
    }, [country, phonePrefix, phone, firstName, lastName, pseudo, dob, email, step]);

    const validateStep = () => {
        setValidationError("");
        setApiError("");
        
        if (step === 1) {
            if (!country) return false;
        }
        if (step === 2) {
            if (phone.length < 8) return false;
        }
        if (step === 3) {
            if (!firstName || !lastName || !pseudo || !dob || !email || !password) {
                setValidationError(t('model.signup.error.fields_required'));
                return false;
            }
            // Email Regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setValidationError(t('model.signup.error.invalid_email'));
                return false;
            }
            // Password length
            if (password.length < 8) {
                setValidationError(t('model.signup.error.password_short'));
                return false;
            }
            // Age Check (18+)
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                setValidationError(t('model.signup.error.underage'));
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(s => s + 1);
        }
    };
    const handlePrev = () => setStep(s => Math.max(1, s - 1));

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                };
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id' | 'selfie') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCompressing(1); // Small hack to show loading
        const compressed = await compressImage(file);
        if (type === 'profile') setPhotoProfile(compressed);
        if (type === 'id') setPhotoId(compressed);
        if (type === 'selfie') setPhotoIdSelfie(compressed);
        setCompressing(null);
    };

    const handleCameraCapture = (dataUrl: string) => {
        if (cameraTarget === 'profile') setPhotoProfile(dataUrl);
        if (cameraTarget === 'id') setPhotoId(dataUrl);
        if (cameraTarget === 'selfie') setPhotoIdSelfie(dataUrl);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/auth/elite/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lang: language, country, phone: `${phonePrefix}${phone}`, firstName, lastName, pseudo, dob, email, password, photoProfile, photoId, photoIdSelfie })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem('kinky_model_signup_draft');
                setStep(5); // Confirmation Step
            } else {
                setApiError(t(data.error) || t('model.signup.api_error'));
            }
        } catch (err) {
            setApiError(t('model.signup.connection_error'));
        } finally {
            setLoading(false);
        }
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
                <Link href={`/${language}`} className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
                    KINKY<span className="text-pink-500">.</span> <span className="text-xs font-bold text-white/40 ml-2 tracking-widest uppercase align-middle">{t('model.signup.navbar_models')}</span>
                </Link>
                <Link href={`/${language}/login`} className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">
                    {t('model.signup.navbar_login')}
                </Link>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 py-12 md:py-24 relative z-20">
                
                {/* Progress Indicator */}
                {step < 5 && (
                    <div className="w-full max-w-md mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={handlePrev} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors ${step === 1 ? 'invisible' : 'text-neutral-500'}`}>
                                <ArrowLeft size={14} /> {t('model.signup.step_prev')}
                            </button>
                            <div className="text-[10px] font-black tracking-[0.3em] text-pink-500 uppercase">{t('model.signup.step_indicator', { step, total: 4 })}</div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                            {steps.map(s => (
                                <div key={s.id} className={`h-full flex-1 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-gradient-to-r from-pink-500 to-indigo-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-white/5'}`} />
                            ))}
                        </div>
                    </div>
                )}

                <div className={`w-full ${step === 4 ? 'max-w-5xl' : 'max-w-md'} bg-neutral-900 border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-700`}>

                        {/* Internal Glow */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500/20 via-indigo-500/20 to-pink-500/20" />

                        {apiError && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm text-center animate-in zoom-in duration-300">
                                {apiError}
                            </div>
                        )}

                        {validationError && (
                            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-orange-400 text-sm text-center animate-in zoom-in duration-300">
                                {validationError}
                            </div>
                        )}

                        {/* STEP 1: PAYS */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-2xl">
                                        <MapPin size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-3">{t('model.signup.step1_title')}</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed px-4">{t('model.signup.step1_desc')}</p>
                                </div>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                    <select
                                        className="w-full bg-black/60 border border-white/20 rounded-2xl py-4.5 pl-12 pr-4 text-white/90 appearance-none focus:outline-none focus:border-white/40 transition-all cursor-pointer"
                                        value={country}
                                        onChange={e => {
                                            const code = e.target.value;
                                            setCountry(code);
                                            const selected = countries.find(c => c.code === code);
                                            if (selected) {
                                                setPhonePrefix(selected.dialCode);
                                            }
                                        }}
                                    >
                                        <option value="" disabled>{t('model.signup.step1_placeholder')}</option>
                                        {countries.map(c => (
                                            <option key={c.code} value={c.code}>{c.nameFr} {c.flag}</option>
                                        ))}
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
                                    {t('model.signup.step1_btn')} <ArrowRight size={20} />
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
                                    <h2 className="text-2xl font-bold mb-3">{t('model.signup.step2_title')}</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed px-4">{t('model.signup.step2_desc')}</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-[120px] shrink-0 relative group">
                                        <select 
                                            value={phonePrefix}
                                            onChange={e => setPhonePrefix(e.target.value)}
                                            className="w-full bg-black/60 border border-white/20 rounded-2xl py-4.5 pl-2 pr-6 text-white/90 appearance-none focus:outline-none focus:border-white/40 text-center font-bold cursor-pointer"
                                        >
                                            {countries.map(c => (
                                                <option key={c.code} value={c.dialCode}>{c.dialCode} {c.flag}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                            <ArrowRight size={12} className="rotate-90" />
                                        </div>
                                    </div>
                                    <div className="flex-1 relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder={t('model.signup.step2_placeholder')}
                                            className="w-full bg-black/60 border border-white/20 rounded-2xl py-4.5 pl-12 pr-4 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em] font-bold pt-4">{t('model.signup.step2_footer')}</p>
                                <button
                                    onClick={handleNext}
                                    disabled={phone.length < 8}
                                    className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl shadow-pink-500/10 active:scale-95"
                                >
                                    {t('model.signup.step2_btn')} <ArrowRight size={20} />
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
                                    <h2 className="text-2xl font-bold mb-2">{t('model.signup.step3_title')}</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed">{t('model.signup.step3_desc')}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t('model.signup.step3_firstName')} className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-12 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40" />
                                        </div>
                                        <div className="relative group">
                                            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t('model.signup.step3_lastName')} className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 px-4 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40" />
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input type="text" value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder={t('login.pseudo_placeholder')} className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-12 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40" />
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold uppercase tracking-widest">{t('model.signup.step3_dob')}</div>
                                        <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-24 pr-4 text-white/90 focus:outline-none focus:border-white/40 transition-all [&::-webkit-calendar-picker-indicator]:filter-[invert(0.5)]" />
                                    </div>

                                    <div className="h-px bg-white/5 w-full my-4"></div>

                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('model.signup.step3_email')} className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-12 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40" />
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('model.signup.step3_password')} className="w-full bg-black/60 border border-white/20 rounded-2xl py-4 pl-12 text-white/90 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40" />
                                    </div>
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={!firstName || !lastName || !pseudo || !dob || !email || !password}
                                    className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl active:scale-95"
                                >
                                    {t('model.signup.step3_btn')} <ArrowRight size={20} />
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
                                    <h2 className="text-2xl font-bold mb-2">{t('model.signup.step4_title')}</h2>
                                    <p className="text-neutral-400 text-sm leading-relaxed px-4">{t('model.signup.step4_desc')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'profile', label: t('model.signup.step4_instruction1'), photo: photoProfile },
                                        { id: 'id', label: t('model.signup.step4_instruction2'), photo: photoId },
                                        { id: 'selfie', label: t('model.signup.step4_instruction3'), photo: photoIdSelfie }
                                    ].map((p, idx) => (
                                        <div key={idx} className={`p-3 rounded-2xl border transition-all duration-300 ${p.photo ? 'bg-green-500/10 border-green-500/40' : 'bg-black/40 border-white/5 group hover:border-white/20'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-bold text-[10px] uppercase tracking-widest text-white/50">{idx + 1}. {t('model.signup.step4_consigne')}</p>
                                                {p.photo && <CheckCircle2 className="text-green-500" size={16} />}
                                            </div>
                                            <p className="text-[10px] font-medium mb-3 text-white/90 leading-tight h-8 line-clamp-2">{p.label}</p>
                                            
                                            <div className="relative group/photo overflow-hidden rounded-xl bg-black/60 aspect-[4/3] flex items-center justify-center border border-white/5">
                                                {p.photo ? (
                                                    <img src={p.photo} alt="Verification" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera className="text-white/10" size={24} />
                                                )}
                                                
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    id={`upload-${p.id}`}
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, p.id as any)}
                                                />
                                                <div className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all ${p.photo ? 'bg-black/60 opacity-0 hover:opacity-100' : 'bg-transparent'}`}>
                                                    <div className="flex flex-col gap-2 scale-90 sm:scale-100">
                                                        <label
                                                            htmlFor={`upload-${p.id}`}
                                                            className="bg-white text-black font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 cursor-pointer hover:bg-neutral-200 transition-colors"
                                                        >
                                                            <Camera size={10} />
                                                            {compressing ? t('model.signup.step4_compressing') : p.photo ? t('model.signup.step4_change') : t('model.signup.step4_upload')}
                                                        </label>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setCameraTarget(p.id as any);
                                                                setIsCameraOpen(true);
                                                            }}
                                                            className="bg-pink-500 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 hover:bg-pink-600 transition-colors"
                                                        >
                                                            <Camera size={10} />
                                                            {t('model.signup.step4_take_photo') || "Take Photo"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!photoProfile || !photoId || !photoIdSelfie || loading}
                                        className="w-full max-w-md bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white font-bold py-5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl active:scale-95"
                                    >
                                        {loading ? t('model.signup.step4_submitting') : t('model.signup.step4_btn')}
                                        {!loading && <Check size={20} />}
                                    </button>
                                </div>
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
                                    <h1 className="text-3xl font-black">{t('model.signup.success_title')}</h1>
                                    <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto">
                                        {t('model.signup.success_desc_line1')} <span className="text-white font-bold text-base">{t('model.signup.success_desc_line2')}</span> {t('model.signup.success_desc_line3')}<br /><br />
                                        {t('model.signup.success_desc_line4')}
                                    </p>
                                </div>

                                <button
                                    onClick={() => window.location.href = `/${language}`}
                                    className="w-full py-5 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-[0.3em] transition-all block active:scale-95"
                                >
                                    {t('model.signup.success_btn')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-white/20 text-[10px] flex items-center gap-2 uppercase tracking-[0.2em] font-bold">
                        <ShieldCheck size={14} className="text-white/40" />
                        {t('model.signup.footer_secure')}
                    </div>
            </div>

            {isCameraOpen && (
                <CameraCapture 
                    onCapture={handleCameraCapture}
                    onClose={() => {
                        setIsCameraOpen(false);
                        setCameraTarget(null);
                    }}
                />
            )}
        </div>
    );
}
