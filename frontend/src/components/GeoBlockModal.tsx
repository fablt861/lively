"use client";

import { useState, useEffect } from "react";
import { X, ShieldOff, Search, Plus, CheckCircle2, Globe } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { COUNTRIES } from "@/constants/countries";

interface GeoBlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
}

export function GeoBlockModal({ isOpen, onClose, userEmail }: GeoBlockModalProps) {
    const { t } = useTranslation();
    const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live";

    useEffect(() => {
        if (isOpen && userEmail) {
            setLoading(true);
            fetch(`${BACKEND_URL}/api/elite/${userEmail}/geoblock`, {
                headers: { 'Authorization': `Bearer model-token-${userEmail}` }
            })
            .then(res => res.json())
            .then(data => {
                setBlockedCountries(data.blockedCountries || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [isOpen, userEmail, BACKEND_URL]);

    const handleToggleCountry = (code: string) => {
        if (blockedCountries.includes(code)) {
            setBlockedCountries(blockedCountries.filter(c => c !== code));
        } else {
            if (blockedCountries.length >= 3) {
                setError(t('dashboard.geoblock_limit_reached'));
                setTimeout(() => setError(null), 3000);
                return;
            }
            setBlockedCountries([...blockedCountries, code]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/elite/${userEmail}/geoblock`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer model-token-${userEmail}`
                },
                body: JSON.stringify({ blockedCountries })
            });

            if (!res.ok) throw new Error("Failed to save geoblocks");

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            console.error(err);
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const filteredCountries = COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-neutral-900 border border-indigo-500/20 rounded-[2.5rem] shadow-[0_0_50px_rgba(79,70,229,0.1)] overflow-hidden">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <ShieldOff className="text-indigo-500" />
                            {t('dashboard.geoblock_title')}
                        </h2>
                        <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mt-1">
                            {t('dashboard.geoblock_subtitle')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="text-white/40" />
                    </button>
                </div>

                <div className="px-8 pb-8">
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                        {t('dashboard.geoblock_desc')}
                    </p>

                    {/* Selected Countries Badges */}
                    <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                        {blockedCountries.length > 0 ? (
                            blockedCountries.map(code => {
                                const country = COUNTRIES.find(c => c.code === code);
                                return (
                                    <span key={code} className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                                        {country?.name}
                                        <button onClick={() => handleToggleCountry(code)} className="hover:text-white">
                                            <X size={14} />
                                        </button>
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-white/20 text-xs italic">{t('dashboard.geoblock_no_countries')}</span>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                            type="text"
                            placeholder={t('dashboard.geoblock_select_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all font-medium text-sm"
                        />
                    </div>

                    {/* Country List */}
                    <div className="max-h-[250px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-1">
                            {filteredCountries.map(c => {
                                const isBlocked = blockedCountries.includes(c.code);
                                return (
                                    <button
                                        key={c.code}
                                        onClick={() => handleToggleCountry(c.code)}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                            isBlocked ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-white/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{isBlocked ? '🚫' : '🏳️'}</span>
                                            <span className="text-sm font-bold uppercase tracking-wide">{c.name}</span>
                                        </div>
                                        {isBlocked ? <X size={18} /> : <Plus size={18} className="text-white/20" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all ${
                            success ? 'bg-green-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]'
                        } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                    >
                        {success ? (
                            <>
                                <CheckCircle2 size={20} />
                                {t('dashboard.geoblock_success')}
                            </>
                        ) : (
                            <>
                                {t('dashboard.geoblock_save')}
                            </>
                        )}
                    </button>

                    {error && (
                        <p className="text-red-400 text-xs font-bold text-center mt-4 animate-bounce">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
