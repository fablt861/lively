"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, Landmark, Wallet, Mail, Globe, User, MapPin } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface BillingInfo {
    name: string;
    address: string;
    country: string;
    method: 'bank' | 'paypal' | 'crypto';
    bankIban?: string;
    bankSwift?: string;
    paypalEmail?: string;
    cryptoAddress?: string;
}

interface ModelBillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    modelEmail: string;
}

export function ModelBillingModal({ isOpen, onClose, modelEmail }: ModelBillingModalProps) {
    const { t } = useTranslation();
    const [info, setInfo] = useState<BillingInfo>({
        name: "",
        address: "",
        country: "",
        method: 'bank'
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && modelEmail) {
            setLoading(true);
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/model/${modelEmail}/billing`, {
                headers: { 'Authorization': `Bearer model-token-${modelEmail}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Object.keys(data).length > 0) setInfo(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [isOpen, modelEmail]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/model/${modelEmail}/billing`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer model-token-${modelEmail}`
                },
                body: JSON.stringify(info)
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError("Failed to save billing information.");
            }
        } catch (err) {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-neutral-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-8 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-light text-white leading-tight">{t('billing.title')}</h2>
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Secure Financial Profile</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    {loading ? (
                        <div className="py-20 text-center text-neutral-500 animate-pulse">{t('dashboard.history_loading')}</div>
                    ) : (
                        <>
                            {/* Basic Info Group */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <User size={12} /> {t('billing.name')}
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        value={info.name}
                                        onChange={e => setInfo({...info, name: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <Globe size={12} /> {t('billing.country')}
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        value={info.country}
                                        onChange={e => setInfo({...info, country: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <MapPin size={12} /> {t('billing.address')}
                                    </label>
                                    <textarea 
                                        required
                                        rows={2}
                                        value={info.address}
                                        onChange={e => setInfo({...info, address: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Method Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                    {t('billing.method')}
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'bank', icon: Landmark, label: t('billing.method_bank') },
                                        { id: 'paypal', icon: Mail, label: t('billing.method_paypal') },
                                        { id: 'crypto', icon: Wallet, label: t('billing.method_crypto') }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setInfo({...info, method: m.id as any})}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${info.method === m.id ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'}`}
                                        >
                                            <m.icon size={24} />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
                                {info.method === 'bank' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_iban')}</label>
                                            <input 
                                                type="text"
                                                required
                                                value={info.bankIban || ""}
                                                onChange={e => setInfo({...info, bankIban: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_swift')}</label>
                                            <input 
                                                type="text"
                                                required
                                                value={info.bankSwift || ""}
                                                onChange={e => setInfo({...info, bankSwift: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                            />
                                        </div>
                                    </>
                                )}
                                {info.method === 'paypal' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.paypal_email')}</label>
                                        <input 
                                            type="email"
                                            required
                                            value={info.paypalEmail || ""}
                                            onChange={e => setInfo({...info, paypalEmail: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                )}
                                {info.method === 'crypto' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.crypto_address')}</label>
                                        <input 
                                            type="text"
                                            required
                                            value={info.cryptoAddress || ""}
                                            onChange={e => setInfo({...info, cryptoAddress: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </form>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                    {error && <p className="text-red-400 text-xs font-bold mb-4 text-center">{error}</p>}
                    {success && <p className="text-green-400 text-xs font-bold mb-4 text-center">Information saved successfully!</p>}
                    <button 
                        disabled={saving || loading}
                        onClick={handleSave}
                        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:translate-y-0 text-white py-4 rounded-2xl font-bold tracking-widest uppercase text-sm transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20"
                    >
                        {saving ? t('auth.loading') : t('billing.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
