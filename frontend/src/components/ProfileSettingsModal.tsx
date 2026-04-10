"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Camera, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface ProfileInfo {
    pseudo: string;
    email: string;
    phone: string;
    photoProfile: string;
}

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    modelEmail: string;
    onProfileUpdate: (newEmail: string, newPseudo: string) => void;
}

export function ProfileSettingsModal({ isOpen, onClose, modelEmail, onProfileUpdate }: ProfileSettingsModalProps) {
    const { t } = useTranslation();
    const [info, setInfo] = useState<ProfileInfo>({
        pseudo: "",
        email: "",
        phone: "",
        photoProfile: ""
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && modelEmail) {
            setLoading(true);
            setError(null);
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${modelEmail}/profile`, {
                headers: { 'Authorization': `Bearer model-token-${modelEmail}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch profile");
                    return res.json();
                })
                .then(data => {
                    setInfo({
                        pseudo: data.pseudo || "",
                        email: data.email || "",
                        phone: data.phone || "",
                        photoProfile: data.photoProfile || ""
                    });
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(t('dashboard.profile_load_error') || "Failed to load profile settings.");
                    setLoading(false);
                });
        }
    }, [isOpen, modelEmail, t]);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCompressing(true);
        try {
            const compressed = await compressImage(file);
            setInfo(prev => ({ ...prev, photoProfile: compressed }));
        } catch (err) {
            console.error("Compression failed", err);
        } finally {
            setCompressing(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${modelEmail}/profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer model-token-${modelEmail}`
                },
                body: JSON.stringify(info)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                if (info.email !== modelEmail || info.pseudo) {
                    onProfileUpdate(info.email, info.pseudo);
                }
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                }, 2000);
            } else {
                setError(t(data.error) || data.error || "Failed to save profile information.");
            }
        } catch (err) {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                
                {/* Top Gradient Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-indigo-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>

                {/* Header */}
                <div className="p-8 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                            <User size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-light text-white leading-tight">{t('dashboard.profile_settings_title') || "Profile Settings"}</h2>
                            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Manage your public information</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest">{t('dashboard.history_loading')}</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Profile Image Section */}
                            <div className="flex flex-col items-center gap-6 mb-8">
                                <div className="relative group cursor-pointer" onClick={() => document.getElementById('profile-photo-upload')?.click()}>
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-800 border-2 border-white/10 overflow-hidden ring-4 ring-pink-500/10 ring-offset-4 ring-offset-neutral-900 group-hover:ring-pink-500/30 transition-all duration-500 shadow-2xl">
                                        <div className={`absolute inset-0 z-10 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${compressing ? 'opacity-100' : ''}`}>
                                            {compressing ? (
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Camera size={24} className="text-white" />
                                            )}
                                        </div>
                                        <img 
                                            src={info.photoProfile || "/images/avatars/model_1.png"} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/40 border-2 border-neutral-900 group-hover:scale-110 transition-transform">
                                        <Camera size={18} />
                                    </div>
                                    <input 
                                        type="file"
                                        id="profile-photo-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-medium text-sm mb-1">{t('model.signup.step4_change') || "Change Photo"}</p>
                                    <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-black">{t('model.signup.step4_upload') || "Upload"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Pseudo */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <User size={12} /> {t('auth.pseudo')}
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        value={info.pseudo}
                                        onChange={e => setInfo({...info, pseudo: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-pink-500 transition-all"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <Phone size={12} /> {t('auth.phone')}
                                    </label>
                                    <input 
                                        type="tel"
                                        required
                                        value={info.phone}
                                        onChange={e => setInfo({...info, phone: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-pink-500 transition-all"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <Mail size={12} /> Email
                                    </label>
                                    <input 
                                        type="email"
                                        required
                                        value={info.email}
                                        onChange={e => setInfo({...info, email: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-pink-500 transition-all"
                                    />
                                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest ml-2 italic">
                                        {t('dashboard.email_change_warning') || "Note: Changing your email will update your login credentials."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                    {error && <p className="text-red-400 text-xs font-bold mb-4 text-center px-4 py-2 bg-red-400/10 border border-red-400/20 rounded-xl animate-shake">{error}</p>}
                    {success && (
                        <div className="flex flex-col items-center gap-2 mb-4 animate-in zoom-in duration-300">
                            <CheckCircle2 size={24} className="text-green-400" />
                            <p className="text-green-400 text-xs font-bold">{t('dashboard.profile_saved_success') || "Profile updated successfully!"}</p>
                        </div>
                    )}
                    <button 
                        disabled={saving || loading || success}
                        onClick={handleSave}
                        className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 disabled:opacity-50 disabled:translate-y-0 text-white py-4 rounded-2xl font-bold tracking-widest uppercase text-sm transition-all active:scale-[0.98] shadow-xl shadow-pink-500/20"
                    >
                        {saving ? t('auth.loading') : (t('dashboard.save_changes') || "Save Changes")}
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-[9px] font-bold uppercase tracking-widest">
                        <ShieldCheck size={12} className="text-green-500" />
                        End-to-end encrypted profile management
                    </div>
                </div>
            </div>
        </div>
    );
}
