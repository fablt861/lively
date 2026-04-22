"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, Landmark, Wallet, Mail, Globe, User, MapPin, ChevronDown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { countries } from "@/utils/countries";

interface BillingInfo {
    name: string;
    address: string;
    country: string;
    method: 'bank' | 'paxum' | 'crypto';
    bankCountry?: string;
    bankIban?: string;
    bankSwift?: string;
    bankRouting?: string;
    bankAccount?: string;
    bankSortCode?: string;
    paxumEmail?: string;
    cryptoAddress?: string;
    cryptoNetwork?: 'trc20' | 'erc20' | 'polygon';
}

interface ModelBillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    modelId: string;
}

export function ModelBillingModal({ isOpen, onClose, modelId }: ModelBillingModalProps) {
    const { t, language } = useTranslation();
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
        if (isOpen && modelId) {
            setLoading(true);
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${modelId}/billing`, {
                headers: { 'Authorization': `Bearer model-token-${modelId}` }
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
    }, [isOpen, modelId]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${modelId}/billing`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer model-token-${modelId}`
                },
                body: JSON.stringify(info)
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(t('billing.save_error'));
            }
        } catch (err) {
            setError(t('billing.network_error'));
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
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">{t('billing.secure_desc')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    {loading ? (
                        <div className="py-20 text-center text-neutral-500 animate-pulse">{t('dashboard.history_loading')}</div>
                    ) : (
                        <div className="space-y-8">
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
                                    <div className="relative group">
                                        <select 
                                            required
                                            value={info.country}
                                            onChange={e => setInfo({...info, country: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>{t('billing.select_country')}</option>
                                            {countries.map(c => (
                                                <option key={c.code} value={c.code}>{language === 'fr' ? c.nameFr : c.nameEn} {c.flag}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
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
                                        { id: 'paxum', icon: Mail, label: t('billing.method_paxum') },
                                        { id: 'crypto', icon: Wallet, label: t('billing.method_crypto') }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setInfo({...info, method: m.id as any})}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${info.method === m.id ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'}`}
                                        >
                                            <m.icon size={24} />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter text-center">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {info.method === 'bank' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                                <Globe size={12} /> {t('billing.bank_country')}
                                            </label>
                                            <div className="relative group">
                                                <select 
                                                    required
                                                    value={info.bankCountry || ""}
                                                    onChange={e => setInfo({...info, bankCountry: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>{t('billing.select_bank_country')}</option>
                                                    {countries.map(c => (
                                                        <option key={c.code} value={c.code}>{language === 'fr' ? c.nameFr : c.nameEn} {c.flag}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Fields based on Bank Country */}
                                        {info.bankCountry && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {/* SEPA (Europe) */}
                                                {['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'LU', 'IE', 'PT', 'GR', 'AT', 'FI', 'EE', 'LV', 'LT', 'SK', 'SI', 'MT', 'CY', 'CH', 'LI', 'NO', 'IS', 'HR', 'MC', 'SM', 'AD', 'VA'].includes(info.bankCountry) ? (
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_iban')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankIban || ""}
                                                                onChange={e => setInfo({...info, bankIban: e.target.value})}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
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
                                                ) : info.bankCountry === 'US' ? (
                                                    /* USA */
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_routing')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankRouting || ""}
                                                                onChange={e => setInfo({...info, bankRouting: e.target.value})}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_account')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankAccount || ""}
                                                                onChange={e => setInfo({...info, bankAccount: e.target.value})}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                                            />
                                                        </div>
                                                    </>
                                                ) : info.bankCountry === 'GB' ? (
                                                    /* UK */
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_sort_code')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankSortCode || ""}
                                                                onChange={e => setInfo({...info, bankSortCode: e.target.value})}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_account')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankAccount || ""}
                                                                onChange={e => setInfo({...info, bankAccount: e.target.value})}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Global / Others */
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_swift')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankSwift || ""}
                                                                onChange={e => setInfo({...info, bankSwift: e.target.value})}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_account')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankAccount || ""}
                                                                onChange={e => setInfo({...info, bankAccount: e.target.value})}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                                {info.method === 'paxum' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.paxum_email')}</label>
                                        <input 
                                            type="email"
                                            required
                                            value={info.paxumEmail || ""}
                                            onChange={e => setInfo({...info, paxumEmail: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                            placeholder="votre@email-paxum.com"
                                        />
                                    </div>
                                )}
                                {info.method === 'crypto' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.crypto_network')}</label>
                                            <div className="relative">
                                                <select 
                                                    required
                                                    value={info.cryptoNetwork || ""}
                                                    onChange={e => setInfo({...info, cryptoNetwork: e.target.value as any})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>{t('billing.select_network')}</option>
                                                    <option value="trc20">{t('billing.network_tron')}</option>
                                                    <option value="erc20">{t('billing.network_eth')}</option>
                                                    <option value="polygon">{t('billing.network_polygon')}</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.crypto_address')}</label>
                                            <input 
                                                type="text"
                                                required
                                                value={info.cryptoAddress || ""}
                                                onChange={e => setInfo({...info, cryptoAddress: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                                                placeholder="0x... ou T..."
                                            />
                                        </div>
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                            <p className="text-[10px] text-amber-500 font-bold leading-relaxed">
                                                {t('billing.crypto_warning')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                    {error && <p className="text-red-400 text-xs font-bold mb-4 text-center">{error}</p>}
                    {success && <p className="text-green-400 text-xs font-bold mb-4 text-center">{t('billing.save_success')}</p>}
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
