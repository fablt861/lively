"use client";

import { useState, useEffect } from "react";
import { Users, Video, DollarSign, Activity, Settings, Lock, CheckCircle, XCircle, Clock, Globe, Mail, Zap, UserCheck, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function AdminPage() {
    const { t } = useTranslation();
    const [token, setToken] = useState("");
    const [isLogged, setIsLogged] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("stats");

    const [stats, setStats] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [pendingModels, setPendingModels] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [realtimeStats, setRealtimeStats] = useState<any>(null);
    const [userFilter, setUserFilter] = useState<'all' | 'buyers'>('all');
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [fetchError, setFetchError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("kinky_admin_token", data.token);
                setToken(data.token);
                setIsLogged(true);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(t(data.error) || t('admin.login.error_invalid'));
            }
        } catch (err) {
            alert(t('admin.login.error_connect'));
        }
    };

    const fetchStats = () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(setStats);
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
                setFetchError(null);
            } else {
                throw new Error("Invalid data format received.");
            }
        } catch (err: any) {
            console.error("Fetch Users Error:", err);
            setFetchError(t('admin.users.fetch_error'));
        }
    };

    const fetchModels = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setModels(data);
                setFetchError(null);
            } else {
                throw new Error("Invalid data format received.");
            }
        } catch (err: any) {
            console.error("Fetch Models Error:", err);
            setFetchError(t('admin.models.fetch_error'));
        }
    };

    const fetchPayoutRequests = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/payouts/pending`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setPayoutRequests(data);
        } catch (err) {
            console.error("Fetch Payouts Error:", err);
        }
    };

    const fetchRealtime = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/realtime`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setRealtimeStats(data);
        } catch (err) {
            console.error("Fetch Realtime Error:", err);
        }
    };

    const checkConnectivity = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/ping`);
            if (res.ok) setBackendStatus('online');
            else setBackendStatus('offline');
        } catch {
            setBackendStatus('offline');
        }
    };

    useEffect(() => {
        const interval = setInterval(checkConnectivity, 10000);
        checkConnectivity();
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isLogged && token && activeTab === 'realtime') {
            const interval = setInterval(fetchRealtime, 3000);
            fetchRealtime();
            return () => clearInterval(interval);
        }
    }, [isLogged, token, activeTab]);

    useEffect(() => {
        const savedToken = localStorage.getItem("kinky_admin_token");
        if (savedToken) {
            setToken(savedToken);
            setIsLogged(true);
        }
    }, []);

    useEffect(() => {
        if (isLogged && token) {
            if (activeTab === 'stats') fetchStats();
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'models') fetchModels();
            if (activeTab === 'payouts') fetchPayoutRequests();
            if (activeTab === 'realtime') fetchRealtime();

            if (activeTab === 'settings') {
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.json())
                    .then(setSettings);
            }

            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models/pending`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(setPendingModels);
        }
    }, [isLogged, token, activeTab]);

    const saveSettings = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                alert(t('admin.settings.save_success'));
            }
        } catch (err) {
            alert(t('admin.settings.save_error'));
        }
    };

    if (!isLogged) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans text-white">
                <form onSubmit={handleLogin} className="bg-neutral-900 border border-white/5 p-8 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl">
                    <div className="flex justify-center mb-4 text-indigo-500 flex-col items-center gap-4">
                        <Lock size={48} />
                        <LanguageSelector />
                    </div>
                    <h1 className="text-2xl font-light text-center tracking-wide">{t('admin.login.title')}</h1>
                    <input type="text" placeholder={t('admin.login.user_placeholder')} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors" value={username} onChange={e => setUsername(e.target.value)} />
                    <input type="password" placeholder={t('admin.login.pass_placeholder')} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl p-3 font-medium transition-colors shadow-lg shadow-indigo-500/20">{t('admin.login.cta')}</button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-neutral-900 border-r border-white/5 flex flex-col z-10">
                <div className="p-6 text-2xl font-black tracking-tighter text-white border-b border-white/5">
                    KI<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">+</span>NKY <span className="text-xs font-light tracking-widest text-neutral-500 ml-1">ADMIN</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'stats' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Activity size={20} /> {t('admin.nav.dashboard')}
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Users size={20} /> {t('admin.nav.users')}
                    </button>
                    <button onClick={() => setActiveTab('models')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'models' ? 'bg-pink-500/20 text-pink-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Video size={20} /> {t('admin.nav.models')}
                    </button>
                    <button onClick={() => setActiveTab('validations')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'validations' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Clock size={20} /> {t('admin.nav.pending')} {pendingModels.length > 0 && <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingModels.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('payouts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'payouts' ? 'bg-green-500/20 text-green-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <DollarSign size={20} /> {t('admin.nav.payouts')} {payoutRequests.length > 0 && <span className="ml-auto bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{payoutRequests.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('realtime')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'realtime' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Zap size={20} className={activeTab === 'realtime' ? 'animate-pulse text-indigo-400' : ''} /> {t('admin.nav.realtime')}
                    </button>
                    <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                            <Settings size={20} /> {t('admin.nav.settings')}
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem("kinky_admin_token");
                                setToken("");
                                setIsLogged(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-500 hover:bg-red-500/10"
                        >
                            <Lock size={20} /> {t('admin.nav.logout')}
                        </button>
                        <div className="px-4 py-3 mt-auto">
                            <LanguageSelector />
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-y-auto">
                {activeTab === 'stats' && stats && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <h2 className="text-3xl font-light">{t('admin.stats.title')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-indigo-400 mb-2"><Users size={18} /> {t('admin.stats.users_registered')}</div>
                                <div className="text-4xl font-light">{stats.global.totalUsers}</div>
                            </div>
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-pink-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-pink-400 mb-2"><Video size={18} /> {t('admin.stats.models_registered')}</div>
                                <div className="text-4xl font-light">{stats.global.totalModels}</div>
                            </div>
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-green-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-green-400 mb-2"><DollarSign size={18} /> {t('admin.stats.total_clients')}</div>
                                <div className="text-4xl font-light text-green-400">{stats.global.totalClients}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-12 mb-6">
                            <h2 className="text-2xl font-light">{t('admin.stats.daily_performance')}</h2>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">{t('admin.table.date')}</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">{t('admin.table.visitors')}</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">{t('admin.table.clients')}</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">{t('admin.table.revenue')}</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">{t('admin.table.payouts')}</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase text-right">{t('admin.table.profit')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.daily.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-neutral-500">{t('admin.table.no_activity')}</td></tr>
                                    )}
                                    {stats.daily.map((d: any, i: number) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-5 text-neutral-200">{d.date}</td>
                                            <td className="p-5 text-neutral-400">{d.newUsers}</td>
                                            <td className="p-5 text-neutral-400">{d.newClients}</td>
                                            <td className="p-5 font-mono text-indigo-300">${d.revenue.toFixed(2)}</td>
                                            <td className="p-5 font-mono text-pink-300">-${d.modelPayout.toFixed(2)}</td>
                                            <td className="p-5 text-right font-mono text-green-400 font-bold">${d.profit.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'realtime' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors" />
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                                        <Video size={24} />
                                    </div>
                                    <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">{t('admin.realtime.online_models')}</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-5xl font-black text-white">{realtimeStats?.online?.totalModels || 0}</h4>
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                </div>
                            </div>

                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-pink-500/20 transition-colors" />
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-pink-500/20 rounded-2xl text-pink-400">
                                        <Users size={24} />
                                    </div>
                                    <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">{t('admin.realtime.online_users')}</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-5xl font-black text-white">{realtimeStats?.online?.totalUsers || 0}</h4>
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                </div>
                            </div>

                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors" />
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400">
                                        <Clock size={24} />
                                    </div>
                                    <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">{t('admin.realtime.waiting_models')}</p>
                                </div>
                                <h4 className="text-5xl font-black text-white">{realtimeStats?.queue?.modelsCount || 0}</h4>
                            </div>

                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-colors" />
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400">
                                        <Activity size={24} />
                                    </div>
                                    <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">{t('admin.realtime.waiting_users')}</p>
                                </div>
                                <h4 className="text-5xl font-black text-white">{realtimeStats?.queue?.usersCount || 0}</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                            {/* Models Queue */}
                            <div className="bg-neutral-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                                            <Video size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">{t('admin.realtime.waiting_models')}</h3>
                                    </div>
                                    <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                                        {realtimeStats?.queue?.modelsCount || 0} LIVE
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {realtimeStats?.queue?.details?.models.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-white/5 rounded-3xl">
                                            <Activity className="w-8 h-8 opacity-20 mb-3" />
                                            <p className="text-sm font-medium">Aucun modèle en attente</p>
                                        </div>
                                    ) : (
                                        realtimeStats?.queue?.details?.models.map((m: any, i: number) => (
                                            <div key={m.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold">{m.name}</p>
                                                        <p className="text-neutral-500 text-[10px] font-mono">{m.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                                    <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">EN ATTENTE</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Users Queue */}
                            <div className="bg-neutral-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-pink-500/20 rounded-2xl text-pink-400">
                                            <Users size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">{t('admin.realtime.waiting_users')}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                            {realtimeStats?.queue?.details?.users.filter((u: any) => u.type === 'registered').length} {t('admin.realtime.registered')}
                                        </span>
                                        <span className="px-3 py-1 bg-neutral-500/10 text-neutral-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">
                                            {realtimeStats?.queue?.details?.users.filter((u: any) => u.type === 'guest').length} {t('admin.realtime.guest')}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {realtimeStats?.queue?.details?.users.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-white/5 rounded-3xl">
                                            <Activity className="w-8 h-8 opacity-20 mb-3" />
                                            <p className="text-sm font-medium">Aucun utilisateur en attente</p>
                                        </div>
                                    ) : (
                                        realtimeStats?.queue?.details?.users.map((u: any, i: number) => (
                                            <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-400 font-bold group-hover:scale-110 transition-transform">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold">{u.name}</p>
                                                        <p className="text-neutral-500 text-[10px] font-mono">{u.ip}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {u.type === 'registered' ? (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-lg border border-green-500/20">
                                                            <ShieldCheck size={12} className="text-green-400" />
                                                            <span className="text-[9px] font-black text-green-400 uppercase">{t('admin.realtime.registered')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                                                            <UserCheck size={12} className="text-neutral-500" />
                                                            <span className="text-[9px] font-black text-neutral-400 uppercase">{t('admin.realtime.guest')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && settings && (
                    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500 pb-20">
                        <h2 className="text-3xl font-light mb-8">{t('admin.settings.title')}</h2>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
                            <h3 className="text-xl font-medium text-indigo-400 border-b border-white/5 pb-4">{t('admin.settings.rates_title')}</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">{t('admin.settings.price_per_min')}</label>
                                    <input type="number" step="0.01" value={settings.pricePerMinute} onChange={e => setSettings({ ...settings, pricePerMinute: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">{t('admin.settings.model_payout_per_min')}</label>
                                    <input type="number" step="0.01" value={settings.modelPayoutPerMinute} onChange={e => setSettings({ ...settings, modelPayoutPerMinute: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-neutral-400 mb-2">{t('admin.settings.anti_fraud_delay')}</label>
                                    <input type="number" value={settings.antiFraudDelaySec} onChange={e => setSettings({ ...settings, antiFraudDelaySec: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                    <p className="text-xs text-neutral-500 mt-2">{t('admin.settings.anti_fraud_desc')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
                            <h3 className="text-xl font-medium text-indigo-400 border-b border-white/5 pb-4">{t('admin.settings.packs_title')}</h3>
                            <p className="text-sm text-neutral-400 mb-4">{t('admin.settings.packs_desc')}</p>
                            {settings.packs.map((pack: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex-1">
                                        <label className="block text-xs text-neutral-500 mb-1">{t('admin.pack.name')}</label>
                                        <input type="text" value={pack.name} onChange={e => {
                                            const newPacks = [...settings.packs];
                                            newPacks[i].name = e.target.value;
                                            setSettings({ ...settings, packs: newPacks });
                                        }} className="w-full bg-transparent border-b border-white/20 focus:border-indigo-500 p-1 text-white outline-none transition-colors" />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs text-neutral-500 mb-1">{t('admin.pack.credits')}</label>
                                        <input type="number" value={pack.credits} onChange={e => {
                                            const newPacks = [...settings.packs];
                                            newPacks[i].credits = parseInt(e.target.value);
                                            setSettings({ ...settings, packs: newPacks });
                                        }} className="w-full bg-transparent border-b border-white/20 focus:border-indigo-500 p-1 text-white outline-none transition-colors text-right" />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs text-neutral-500 mb-1">{t('admin.pack.price')}</label>
                                        <input type="number" step="0.01" value={pack.priceUsd} onChange={e => {
                                            const newPacks = [...settings.packs];
                                            newPacks[i].priceUsd = parseFloat(e.target.value);
                                            setSettings({ ...settings, packs: newPacks });
                                        }} className="w-full bg-transparent border-b border-white/20 focus:border-indigo-500 p-1 text-white outline-none transition-colors text-right" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={saveSettings} className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-5 rounded-2xl font-semibold transition-all w-full shadow-lg shadow-indigo-500/25 active:scale-[0.98]">
                            {t('admin.settings.save_cta')}
                        </button>

                        <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">{t('admin.danger.title')}</h3>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                {t('admin.danger.desc')}
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm(t('admin.danger.confirm1')) &&
                                        confirm(t('admin.danger.confirm2'))) {
                                        try {
                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/maintenance/reset`, {
                                                method: "POST",
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            if (res.ok) {
                                                alert(t('admin.danger.reset_success'));
                                                window.location.reload();
                                            } else {
                                                alert(t('admin.danger.reset_error'));
                                            }
                                        } catch (err) {
                                            alert(t('admin.danger.network_error'));
                                        }
                                    }
                                }}
                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-xl text-xs font-bold transition-all"
                            >
                                {t('admin.danger.cta')}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'validations' && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-light">{t('admin.validations.title')}</h2>
                        </div>

                        {pendingModels.length === 0 ? (
                            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-12 text-center text-neutral-500">
                                {t('admin.validations.empty')}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {pendingModels.map((model: any) => (
                                    <div key={model.email} className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black text-white leading-tight">
                                                    {model.firstName} <span className="text-pink-500">{model.lastName}</span>
                                                </h3>
                                                <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                                    <Mail size={14} className="text-pink-500/50" />
                                                    <span className="font-mono">{model.email}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 bg-white/5 p-4 rounded-2xl border border-white/5 w-full md:w-auto">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{t('admin.model.country')}</p>
                                                    <p className="text-sm font-bold text-white uppercase">{model.country}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{t('admin.model.phone')}</p>
                                                    <p className="text-sm font-bold text-white">{model.phone}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{t('admin.model.dob')}</p>
                                                    <p className="text-sm font-bold text-white">{model.dob}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Email</p>
                                                    <p className="text-[10px] font-bold text-pink-400 truncate max-w-[120px]">{model.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-black/50 rounded-2xl p-3 border border-white/5">
                                                <p className="text-[10px] text-neutral-500 text-center mb-2 uppercase tracking-tighter">Profile</p>
                                                <img src={model.photoProfile || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces"} alt="Profile" className="w-full aspect-square object-cover rounded-xl border border-white/10" />
                                            </div>
                                            <div className="bg-black/50 rounded-2xl p-3 border border-white/5">
                                                <p className="text-[10px] text-neutral-500 text-center mb-2 uppercase tracking-tighter">ID Document</p>
                                                <img src={model.photoId || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces"} alt="ID" className="w-full aspect-square object-cover rounded-xl border border-white/10" />
                                            </div>
                                            <div className="bg-black/50 rounded-2xl p-3 border border-white/5">
                                                <p className="text-[10px] text-neutral-500 text-center mb-2 uppercase tracking-tighter">Selfie + ID</p>
                                                <img src={model.photoIdSelfie || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces"} alt="Selfie ID" className="w-full aspect-square object-cover rounded-xl border border-white/10" />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-2">
                                            <button
                                                onClick={async () => {
                                                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models/${encodeURIComponent(model.email)}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                    setPendingModels(prev => prev.filter(m => m.email !== model.email));
                                                }}
                                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={18} /> {t('admin.validations.reject')}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models/${encodeURIComponent(model.email)}/validate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                    setPendingModels(prev => prev.filter(m => m.email !== model.email));
                                                }}
                                                className="flex-1 bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={18} /> {t('admin.validations.validate')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-light">{t('admin.users.title')}</h2>
                                {backendStatus === 'offline' && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-md border border-red-500/20 animate-pulse">{t('admin.status.offline')}</span>}
                                {backendStatus === 'online' && <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md border border-green-500/20">{t('admin.status.online')}</span>}
                            </div>
                            <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1">
                                <button onClick={() => setUserFilter('all')} className={`px-4 py-2 rounded-lg text-sm transition-all ${userFilter === 'all' ? 'bg-indigo-500 text-white' : 'text-neutral-500 hover:text-white'}`}>{t('admin.users.filter_all')} ({users.length})</button>
                                <button onClick={() => setUserFilter('buyers')} className={`px-4 py-2 rounded-lg text-sm transition-all ${userFilter === 'buyers' ? 'bg-indigo-500 text-white' : 'text-neutral-500 hover:text-white'}`}>{t('admin.users.filter_buyers')} ({users.filter(u => u.isBuyer).length})</button>
                            </div>
                        </div>

                        {fetchError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
                                <XCircle size={20} />
                                {fetchError}
                                <button onClick={fetchUsers} className="ml-auto underline font-bold">Réessayer</button>
                            </div>
                        )}

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.user_pseudo')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.registration')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.last_login')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.total_spent')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase text-right">{t('admin.table.status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.filter(u => userFilter === 'all' || u.isBuyer).map((u, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-5">
                                                <div className="font-medium text-white">{u.pseudo}</div>
                                                <div className="text-xs text-neutral-500 font-mono italic">{u.email}</div>
                                            </td>
                                            <td className="p-5 text-neutral-400 text-sm">{new Date(u.registeredAt).toLocaleDateString()}</td>
                                            <td className="p-5 text-neutral-400 text-sm">{new Date(u.lastLogin).toLocaleString()}</td>
                                            <td className="p-5 font-mono text-indigo-400 font-bold">${u.totalSpent.toFixed(2)}</td>
                                            <td className="p-5 text-right">
                                                {u.isBuyer ?
                                                    <span className="bg-green-500/10 text-green-400 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-green-500/20">{t('admin.status.buyer')}</span>
                                                    : <span className="bg-neutral-500/10 text-neutral-500 text-[10px] font-black uppercase px-2 py-1 rounded-md text-white">{t('admin.status.free')}</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'models' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <h2 className="text-3xl font-light">{t('admin.models.title')}</h2>

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.model_name')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.contact')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.total_earnings')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.paid_out')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.unpaid_balance')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase text-right">{t('admin.table.action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {models.map((m, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-5 font-medium text-pink-400">{m.pseudo}</td>
                                            <td className="p-5">
                                                <div className="text-sm text-white font-mono italic">{m.email}</div>
                                                <div className="text-xs text-neutral-500">{m.phone}</div>
                                            </td>
                                            <td className="p-5 font-mono text-white">${m.totalGains.toFixed(2)}</td>
                                            <td className="p-5 font-mono text-neutral-400">-${m.totalPayouts.toFixed(2)}</td>
                                            <td className="p-5 font-mono text-green-400 font-bold">${m.balance.toFixed(2)}</td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={async () => {
                                                        const amount = prompt(t('admin.models.payout_prompt', { name: m.pseudo, balance: m.balance.toFixed(2) }));
                                                        if (amount && parseFloat(amount) > 0) {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models/${encodeURIComponent(m.email)}/payout`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                                body: JSON.stringify({ amount: parseFloat(amount) })
                                                            });
                                                            if (res.ok) fetchModels();
                                                            else alert(t('admin.models.payout_error'));
                                                        }
                                                    }}
                                                    className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    {t('admin.models.payout_cta')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <h2 className="text-3xl font-light">{t('admin.payouts.title')}</h2>

                        {payoutRequests.length === 0 ? (
                            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-12 text-center text-neutral-500">
                                {t('admin.payouts.empty')}
                            </div>
                        ) : (
                            <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.02] border-b border-white/5">
                                        <tr>
                                            <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.payouts.table_model')}</th>
                                            <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.payouts.table_amount')}</th>
                                            <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.payouts.table_method')}</th>
                                            <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.payouts.table_details')}</th>
                                            <th className="p-5 text-neutral-400 font-medium text-xs uppercase text-right">{t('admin.table.action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {payoutRequests.map((p, i) => (
                                            <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="p-5">
                                                    <div className="font-bold text-white">{p.billingInfo.name}</div>
                                                    <div className="text-xs text-neutral-500 font-mono">{p.modelEmail}</div>
                                                </td>
                                                <td className="p-5 font-mono text-green-400 font-bold text-lg">${p.amount.toFixed(2)}</td>
                                                <td className="p-5">
                                                    <span className="bg-white/5 text-neutral-300 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-white/10 italic">
                                                        {t(`billing.method_${p.billingInfo.method}`)}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="text-xs text-neutral-400 space-y-1">
                                                        {p.billingInfo.method === 'bank' && (
                                                            <>
                                                                <div>IBAN: <span className="text-white font-mono">{p.billingInfo.bankIban}</span></div>
                                                                <div>SWIFT: <span className="text-white font-mono">{p.billingInfo.bankSwift}</span></div>
                                                            </>
                                                        )}
                                                        {p.billingInfo.method === 'paypal' && (
                                                            <div>Email: <span className="text-white font-mono">{p.billingInfo.paypalEmail}</span></div>
                                                        )}
                                                        {p.billingInfo.method === 'crypto' && (
                                                            <div>Wallet: <span className="text-white font-mono truncate max-w-[200px] block">{p.billingInfo.cryptoAddress}</span></div>
                                                        )}
                                                        <div className="pt-1 mt-1 border-t border-white/5 text-[10px] italic">
                                                            {p.billingInfo.address}, {p.billingInfo.country}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right space-x-2">
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm("Reject this payout and refund the balance?")) {
                                                                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/payouts/${p.id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                                fetchPayoutRequests();
                                                            }
                                                        }}
                                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold px-3 py-2 rounded-lg border border-red-500/20 transition-all"
                                                    >
                                                        {t('admin.payouts.reject')}
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm("Confirm that this payout has been processed and paid?")) {
                                                                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/payouts/${p.id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                                fetchPayoutRequests();
                                                            }
                                                        }}
                                                        className="bg-green-500 hover:bg-green-400 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-lg shadow-green-500/20"
                                                    >
                                                        {t('admin.payouts.approve')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
