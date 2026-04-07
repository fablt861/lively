"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Wallet, History, ArrowUpRight, DollarSign, Activity, Video } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ModelBillingModal } from "@/components/ModelBillingModal";
import { Settings } from "lucide-react";

interface Stats {
    balance: number;
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
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutMessage, setPayoutMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    const fetchStats = () => {
        if (!id) return;
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${id}/stats`)
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(console.error);
    };

    const fetchPayouts = () => {
        if (!id) return;
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/elite/${id}/payouts`, {
            headers: { 'Authorization': `Bearer model-token-${id}` }
        })
            .then((res) => res.json())
            .then((data) => {
                setPayoutHistory(data);
                setLoadingPayouts(false);
            })
            .catch(console.error);
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
            groups[dateStr].normalEarned += h.normalEarned || 0;
            groups[dateStr].privateEarned += h.privateEarned || 0;
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
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-8 md:p-16">
            {/* Header */}
            <header className="flex items-center justify-between mb-16">
                <div>
                    <h1 className="text-4xl font-light tracking-tight text-white mb-2">{t('dashboard.title')}</h1>
                    <p className="text-neutral-500">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex items-center gap-6">
                    <LanguageSelector />
                    <Link
                        href={`/${language}/live`}
                        className="px-8 py-3 bg-pink-500 hover:bg-pink-400 border border-pink-400/50 shadow-lg shadow-pink-500/20 text-white rounded-full transition-all duration-300 text-sm font-bold flex items-center gap-2"
                    >
                        <Video size={18} /> {t('dashboard.launch_live')}
                    </Link>
                </div>
            </header>
            
            {/* Telegram Community Banner */}
            <div className="mb-12 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-600/20 to-blue-600/10 border border-cyan-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{t('dashboard.telegram_title')}</h2>
                        <p className="text-cyan-100/60 max-w-xl">{t('dashboard.telegram_desc')}</p>
                    </div>
                </div>
                <a 
                    href="https://t.me/+__YgonRl2681ODA0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="whitespace-nowrap px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full font-bold transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:scale-105"
                >
                    {t('dashboard.telegram_cta')}
                </a>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {/* Total Balance Card */}
                <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-neutral-900 border border-indigo-500/20 p-8 shadow-2xl flex items-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

                    <div className="flex-1">
                        <div className="flex items-center gap-3 text-indigo-300 mb-4">
                            <Wallet size={20} />
                            <span className="font-medium tracking-wide uppercase text-sm">{t('dashboard.balance_title')}</span>
                        </div>
                        <div className="text-7xl font-extralight text-white mb-6 font-mono">
                            ${loading ? "..." : stats?.balance.toFixed(2)}
                        </div>
                        <div className="flex flex-wrap gap-4 items-center">
                            <button 
                                onClick={handlePayoutRequest}
                                disabled={payoutLoading}
                                className="group flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:translate-y-0 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:-translate-y-1"
                            >
                                {payoutLoading ? t('auth.loading') : t('dashboard.payout_cta')} <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                            <button 
                                onClick={() => setIsBillingOpen(true)}
                                className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 border border-white/10"
                            >
                                <Settings size={18} /> {t('dashboard.billing_cta')}
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
                <div className="rounded-3xl bg-neutral-900 border border-white/5 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-pink-400 mb-4">
                        <Activity size={20} />
                        <span className="font-medium tracking-wide uppercase text-sm">{t('dashboard.sessions_title')}</span>
                    </div>
                    <div className="text-5xl font-light text-white">
                        {loading ? "..." : stats?.history.length || 0}
                    </div>
                </div>
            </div>

            {/* Tabbed History Section */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-3 text-white/90">
                        <History size={28} className="text-indigo-400" />
                        <h2 className="text-3xl font-light tracking-tight">{t('dashboard.history_title')}</h2>
                    </div>

                    <div className="flex p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 w-fit">
                        <button
                            onClick={() => setActiveTab('earnings')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
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
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
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
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_date')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_calls')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_duration')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_normal')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_private')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-right">{t('dashboard.table_earned')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {dailyStats.map((day, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-8 text-neutral-300 font-semibold tracking-tight">
                                                    {day.date}
                                                </td>
                                                <td className="p-8 text-neutral-500 font-mono text-sm">
                                                    {t('dashboard.sessions_count', { count: day.calls })}
                                                </td>
                                                <td className="p-8 text-neutral-300 font-medium">
                                                    {Math.floor(day.durationSec / 60)}m {day.durationSec % 60}s
                                                </td>
                                                <td className="p-8 text-neutral-400 font-mono text-sm">
                                                    ${day.normalEarned.toFixed(2)}
                                                </td>
                                                <td className="p-8 text-indigo-400 font-mono text-sm font-bold">
                                                    ${day.privateEarned.toFixed(2)}
                                                </td>
                                                <td className="p-8 text-right font-mono text-green-400 font-bold text-lg">
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
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('dashboard.table_date')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('admin.payouts.table_amount')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{t('admin.payouts.table_method')}</th>
                                            <th className="p-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-right">{t('admin.table.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {payoutHistory.map((p, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-8 text-neutral-300 font-semibold tracking-tight">
                                                    {new Date(p.timestamp).toLocaleDateString()}
                                                </td>
                                                <td className="p-8 text-neutral-300 font-mono font-bold text-lg">
                                                    ${p.amount.toFixed(2)}
                                                </td>
                                                <td className="p-8 text-neutral-500 text-sm font-medium">
                                                    {p.billingInfo?.method || 'N/A'}
                                                </td>
                                                <td className="p-8 text-right">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${
                                                        p.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        p.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5'
                                                    }`}>
                                                        {t(`payout.status.${p.status}`)}
                                                    </span>
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
        </div>
    );
}

