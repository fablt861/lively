"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Wallet, History, ArrowUpRight, DollarSign, Activity, Video, Download } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ModelBillingModal } from "@/components/ModelBillingModal";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { Settings, User, FileText } from "lucide-react";

interface Stats {
    balance: number;
    pseudo?: string;
    photoProfile?: string;
    history: Array<{
        roomId: string;
        durationSec: number;
        modelEarned: number;
        normalEarned?: number;
        privateEarned?: number;
        isPrivate?: boolean;
        timestamp: number;
    }>;
}

interface PayoutRecord {
    id: string;
    modelEmail: string;
    amount: number;
    transferFee?: number;
    netAmount?: number;
    invoiceNumber?: string;
    status: 'pending' | 'paid' | 'rejected';
    timestamp: number;
    processedAt?: number;
    billingInfo: any;
}

export default function DashboardPage() {
    const { t, language } = useTranslation();
    const [id, setId] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPayouts, setLoadingPayouts] = useState(true);
    const [activeTab, setActiveTab] = useState<'earnings' | 'payouts'>('earnings');
    const [isBillingOpen, setIsBillingOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutMessage, setPayoutMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    const fetchStats = () => {
        if (!id) return;
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${id}/stats`)
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchPayouts = () => {
        if (!id) return;
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${id}/payouts`, {
            headers: { 'Authorization': `Bearer model-token-${id}` }
        })
            .then((res) => res.json())
            .then((data) => {
                setPayoutHistory(data);
            })
            .catch(console.error)
            .finally(() => setLoadingPayouts(false));
    };

    useEffect(() => {
        setId(localStorage.getItem('kinky_user_email'));
    }, []);

    useEffect(() => {
        fetchStats();
        fetchPayouts();
    }, [id]);

    const handlePayoutRequest = async () => {
        if (!stats || stats.balance < 100) {
            setPayoutMessage({ text: t('dashboard.payout_error_min'), type: 'error' });
            return;
        }

        setPayoutLoading(true);
        setPayoutMessage(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${id}/payout-request`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer model-token-${id}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            if (res.ok) {
                setPayoutMessage({ text: t('dashboard.payout_request_success'), type: 'success' });
                fetchStats(); // Refresh balance (should be 0)
                fetchPayouts(); // Refresh history (show pending)
            } else {
                if (data.error === 'payout.error.missing_billing_info') {
                    setPayoutMessage({ text: t('dashboard.payout_error_billing'), type: 'error' });
                } else {
                    setPayoutMessage({ text: data.error || "Error", type: 'error' });
                }
            }
        } catch (err) {
            setPayoutMessage({ text: "Network error", type: 'error' });
        } finally {
            setPayoutLoading(false);
        }
    };

    const handleProfileUpdate = (newEmail: string, newPseudo: string) => {
        // Update localStorage
        localStorage.setItem('kinky_user_email', newEmail);
        
        // Update user object if it exists in localStorage
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const userData = JSON.parse(userJson);
            userData.email = newEmail;
            userData.name = newPseudo;
            localStorage.setItem('user', JSON.stringify(userData));
        }
        
        if (newEmail !== id) {
            setId(newEmail);
            window.location.reload();
        } else {
            fetchStats();
        }
    };

    const dailyStats = useMemo(() => {
        if (!stats?.history) return [];

        const groups: Record<string, { date: string; durationSec: number; modelEarned: number; normalEarned: number; privateEarned: number; calls: number }> = {};

        stats.history.forEach(h => {
            const dateStr = new Date(h.timestamp).toLocaleDateString();
            if (!groups[dateStr]) {
                groups[dateStr] = { date: dateStr, durationSec: 0, modelEarned: 0, normalEarned: 0, privateEarned: 0, calls: 0 };
            }
            groups[dateStr].durationSec += h.durationSec;
            groups[dateStr].modelEarned += h.modelEarned;

            // Legacy Fallback: if granular fields are missing, assume it's all Normal
            const hNormal = h.normalEarned !== undefined ? h.normalEarned : (h.isPrivate ? 0 : h.modelEarned);
            const hPrivate = h.privateEarned !== undefined ? h.privateEarned : (h.isPrivate ? h.modelEarned : 0);

            groups[dateStr].normalEarned += hNormal;
            groups[dateStr].privateEarned += hPrivate;
            groups[dateStr].calls += 1;
        });

        return Object.values(groups);
    }, [stats]);

    if (!id) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                {t('dashboard.no_id')}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 sm:p-8 md:p-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
                    <div className="relative group">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-neutral-900 border-2 border-white/10 overflow-hidden ring-4 ring-pink-500/10 ring-offset-4 ring-offset-neutral-950 group-hover:ring-pink-500/30 transition-all duration-500 shadow-2xl">
                            <img 
                                src={stats?.photoProfile || "/images/avatars/model_1.png"} 
                                alt="Profile" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <button 
                            onClick={() => setIsProfileOpen(true)}
                            className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/40 border-2 border-neutral-950 hover:scale-110 transition-transform active:scale-95 z-20"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">ELITE</span>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extralight text-white/50 leading-none">{t('nav.welcome')} <span className="font-black text-white">{stats?.pseudo || "..."}</span></h2>
                        <div className="pt-2">
                            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">{t('dashboard.title')}</h1>
                            <p className="text-xs md:text-sm text-neutral-500 font-medium">{t('dashboard.subtitle')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="self-center sm:self-auto">
                        <LanguageSelector />
                    </div>
                    <Link
                        href={`/${language}/live`}
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 shadow-[0_10px_20px_-5px_rgba(236,72,153,0.4)] text-white rounded-full transition-all duration-300 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 w-full sm:w-auto text-center active:scale-[0.98]"
                    >
                        <Video size={20} className="animate-pulse" /> {t('dashboard.launch_live')}
                    </Link>
                </div>
            </header>
            
            {/* Telegram Community Banner */}
            <div className="mb-12 relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border border-cyan-500/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-md text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    {/* Avatar Group */}
                    <div className="flex -space-x-3 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <img
                                key={i}
                                className="inline-block h-10 w-10 md:h-12 md:w-12 rounded-full ring-2 ring-neutral-900 object-cover"
                                src={`/images/avatars/model_${i}.png`}
                                alt={`Model ${i}`}
                            />
                        ))}
                        <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-dashed border-cyan-500/50 bg-cyan-500/10 text-[10px] font-bold text-cyan-400 ring-2 ring-neutral-900">
                            +14
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                            <Activity className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{t('dashboard.telegram_title')}</h2>
                            <p className="text-sm md:text-base text-cyan-100/60 max-w-xl">{t('dashboard.telegram_desc')}</p>
                        </div>
                    </div>
                </div>
                <a 
                    href="https://t.me/+__YgonRl2681ODA0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full md:w-auto text-center whitespace-nowrap px-6 md:px-8 py-3 md:py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full font-bold transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:scale-105"
                >
                    {t('dashboard.telegram_cta')}
                </a>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {/* Total Balance Card */}
                <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-neutral-900 border border-indigo-500/20 p-6 md:p-8 shadow-2xl flex items-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-50 md:opacity-100" />

                    <div className="flex-1">
                        <div className="flex items-center gap-3 text-indigo-300 mb-4">
                            <Wallet size={20} />
                            <span className="font-medium tracking-wide uppercase text-xs md:text-sm">{t('dashboard.balance_title')}</span>
                        </div>
                        <div className="text-5xl md:text-7xl font-extralight text-white mb-6 font-mono">
                            ${loading ? "..." : stats?.balance.toFixed(2)}
                        </div>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
                            <button 
                                onClick={handlePayoutRequest}
                                disabled={payoutLoading}
                                className="group flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:translate-y-0 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-medium transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:-translate-y-1"
                            >
                                {payoutLoading ? t('auth.loading') : t('dashboard.payout_cta')} <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                            <button 
                                onClick={() => setIsBillingOpen(true)}
                                className="group flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-medium transition-all duration-300 border border-white/10"
                            >
                                <Settings size={18} /> {t('dashboard.billing_cta')}
                            </button>

                            <button 
                                onClick={() => setIsProfileOpen(true)}
                                className="group flex items-center justify-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-6 md:px-8 py-3 md:py-4 rounded-full font-medium transition-all duration-300 border border-pink-500/20"
                            >
                                <User size={18} /> {t('dashboard.profile_cta')}
                            </button>
                        </div>
                        {payoutMessage && (
                            <p className={`mt-4 text-xs font-bold ${payoutMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                {payoutMessage.text}
                            </p>
                        )}
                    </div>
                </div>

                {/* Mini Stat Card */}
                <div className="rounded-3xl bg-neutral-900 border border-white/5 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-pink-400 mb-4">
                        <Activity size={20} />
                        <span className="font-medium tracking-wide uppercase text-xs md:text-sm">{t('dashboard.sessions_title')}</span>
                    </div>
                    <div className="text-4xl md:text-5xl font-light text-white">
                        {loading ? "..." : stats?.history.length || 0}
                    </div>
                </div>
            </div>

            {/* Tabbed History Section */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-3 text-white/90">
                        <History className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" />
                        <h2 className="text-2xl md:text-3xl font-light tracking-tight">{t('dashboard.history_title')}</h2>
                    </div>

                    <div className="flex w-full md:w-fit p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('earnings')}
                            className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                activeTab === 'earnings' 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-neutral-500 hover:text-white'
                            }`}
                        >
                            <Activity size={16} />
                            {t('dashboard.table_earned')}
                        </button>
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                activeTab === 'payouts' 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-neutral-500 hover:text-white'
                            }`}
                        >
                            <Wallet size={16} />
                            {t('dashboard.payout_history_title')}
                        </button>
                    </div>
                </div>

                <div className="bg-neutral-900/50 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                    {activeTab === 'earnings' ? (
                        loading ? (
                            <div className="p-20 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                                <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest">{t('dashboard.history_loading')}</span>
                            </div>
                        ) : dailyStats.length === 0 ? (
                            <div className="p-20 text-center">
                                <History size={48} className="mx-auto text-neutral-800 mb-4" />
                                <p className="text-neutral-500 font-medium">{t('dashboard.history_empty')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_date')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_calls')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_duration')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_normal')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_private')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-right">{t('dashboard.table_earned')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {dailyStats.map((day, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 md:p-8 text-neutral-300 font-semibold tracking-tight">
                                                    {day.date}
                                                </td>
                                                <td className="p-4 md:p-8 text-neutral-500 font-mono text-sm">
                                                    {t('dashboard.sessions_count', { count: day.calls })}
                                                </td>
                                                <td className="p-4 md:p-8 text-neutral-300 font-medium">
                                                    {Math.floor(day.durationSec / 60)}m {day.durationSec % 60}s
                                                </td>
                                                <td className="p-4 md:p-8 text-neutral-400 font-mono text-sm">
                                                    ${day.normalEarned.toFixed(2)}
                                                </td>
                                                <td className="p-4 md:p-8 text-indigo-400 font-mono text-sm font-bold">
                                                    ${day.privateEarned.toFixed(2)}
                                                </td>
                                                <td className="p-4 md:p-8 text-right font-mono text-green-400 font-bold text-lg">
                                                    +${day.modelEarned.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        loadingPayouts ? (
                            <div className="p-20 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                                <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest">{t('dashboard.history_loading')}</span>
                            </div>
                        ) : payoutHistory.length === 0 ? (
                            <div className="p-20 text-center">
                                <Wallet size={48} className="mx-auto text-neutral-800 mb-4" />
                                <p className="text-neutral-500 font-medium">{t('dashboard.history_empty')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_date')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Invoice</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('admin.payouts.table_amount')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Fees</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('admin.payouts.table_method')}</th>
                                            <th className="p-4 md:p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-right">{t('admin.table.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {payoutHistory.map((p, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 md:p-8 text-neutral-300 font-semibold tracking-tight">
                                                    {new Date(p.timestamp).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 md:p-8 text-xs font-mono text-neutral-400">
                                                    {p.invoiceNumber || p.id}
                                                </td>
                                                <td className="p-4 md:p-8 text-neutral-300 font-mono font-bold text-lg">
                                                    ${p.amount.toFixed(2)}
                                                </td>
                                                <td className="p-4 md:p-8 text-red-500/50 font-mono text-sm">
                                                    -${(p.transferFee || 0).toFixed(2)}
                                                </td>
                                                <td className="p-4 md:p-8 text-neutral-500 text-sm font-medium">
                                                    {p.billingInfo?.method || 'N/A'}
                                                </td>
                                                <td className="p-4 md:p-8 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {p.status === 'paid' && (
                                                            <button 
                                                                onClick={() => window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.kinky.live'}/api/elite/${id}/payouts/${p.id}/invoice?token=model-token-${id}`, '_blank')}
                                                                className="p-2 text-neutral-500 hover:text-indigo-400 transition-colors bg-white/5 rounded-lg border border-white/5 hover:border-indigo-500/30"
                                                                title="Download Invoice"
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                        )}
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${
                                                            p.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                            p.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5'
                                                        }`}>
                                                            {t(`payout.status.${p.status}`)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            <ModelBillingModal 
                isOpen={isBillingOpen} 
                onClose={() => setIsBillingOpen(false)} 
                modelEmail={id} 
            />

            <ProfileSettingsModal 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                modelEmail={id}
                onProfileUpdate={handleProfileUpdate}
            />
        </div>
    );
}

