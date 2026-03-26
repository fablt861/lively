"use client";

import { useState, useEffect } from "react";
import { Users, Video, DollarSign, Activity, Settings, Lock, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminPage() {
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
    const [userFilter, setUserFilter] = useState<'all' | 'buyers'>('all');

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
                alert("Invalid login");
            }
        } catch (err) {
            alert("Error connecting to backend");
        }
    };

    const fetchStats = () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(setStats);
    };

    const fetchUsers = () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(setUsers);
    };

    const fetchModels = () => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(setModels);
    };

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
                alert("Settings successfully updated!");
            }
        } catch (err) {
            alert("Failed to save settings");
        }
    };

    if (!isLogged) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans text-white">
                <form onSubmit={handleLogin} className="bg-neutral-900 border border-white/5 p-8 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl">
                    <div className="flex justify-center mb-4"><Lock size={48} className="text-indigo-500" /></div>
                    <h1 className="text-2xl font-light text-center tracking-wide">Admin Access</h1>
                    <input type="text" placeholder="Username (admin)" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors" value={username} onChange={e => setUsername(e.target.value)} />
                    <input type="password" placeholder="Password (admin123)" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl p-3 font-medium transition-colors shadow-lg shadow-indigo-500/20">Login</button>
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
                        <Activity size={20} /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Users size={20} /> Users
                    </button>
                    <button onClick={() => setActiveTab('models')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'models' ? 'bg-pink-500/20 text-pink-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Video size={20} /> Models
                    </button>
                    <button onClick={() => setActiveTab('validations')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'validations' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Clock size={20} /> Pending {pendingModels.length > 0 && <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingModels.length}</span>}
                    </button>
                    <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                            <Settings size={20} /> Settings
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem("kinky_admin_token");
                                setToken("");
                                setIsLogged(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-500 hover:bg-red-500/10"
                        >
                            <Lock size={20} /> Logout
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-y-auto">
                {activeTab === 'stats' && stats && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <h2 className="text-3xl font-light">Global Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-indigo-400 mb-2"><Users size={18} /> Users Registered</div>
                                <div className="text-4xl font-light">{stats.global.totalUsers}</div>
                            </div>
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-pink-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-pink-400 mb-2"><Video size={18} /> Models Registered</div>
                                <div className="text-4xl font-light">{stats.global.totalModels}</div>
                            </div>
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:border-green-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-green-400 mb-2"><DollarSign size={18} /> Total Clients</div>
                                <div className="text-4xl font-light text-green-400">{stats.global.totalClients}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-12 mb-6">
                            <h2 className="text-2xl font-light">Daily Performance (Last 30 Days)</h2>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">Date</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">New Visitors</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">Paid Clients</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">Revenue (CA)</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase">Model Payouts</th>
                                        <th className="p-5 text-neutral-400 font-medium tracking-wider text-sm uppercase text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.daily.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No activity recorded yet in the last 30 days.</td></tr>
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

                {activeTab === 'settings' && settings && (
                    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500 pb-20">
                        <h2 className="text-3xl font-light mb-8">Platform Parameters</h2>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
                            <h3 className="text-xl font-medium text-indigo-400 border-b border-white/5 pb-4">Billing Rates</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">Price Per Minute (User $)</label>
                                    <input type="number" step="0.01" value={settings.pricePerMinute} onChange={e => setSettings({ ...settings, pricePerMinute: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm text-neutral-400 mb-2">Model Payout / Min ($)</label>
                                    <input type="number" step="0.01" value={settings.modelPayoutPerMinute} onChange={e => setSettings({ ...settings, modelPayoutPerMinute: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-neutral-400 mb-2">Anti-Fraud Delay (Seconds)</label>
                                    <input type="number" value={settings.antiFraudDelaySec} onChange={e => setSettings({ ...settings, antiFraudDelaySec: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                    <p className="text-xs text-neutral-500 mt-2">Models will not earn anything during these first seconds of a call.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
                            <h3 className="text-xl font-medium text-indigo-400 border-b border-white/5 pb-4">Paywall Packages</h3>
                            <p className="text-sm text-neutral-400 mb-4">Edit the 3 packages displayed to users when they run out of credits.</p>
                            {settings.packs.map((pack: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex-1">
                                        <label className="block text-xs text-neutral-500 mb-1">Name</label>
                                        <input type="text" value={pack.name} onChange={e => {
                                            const newPacks = [...settings.packs];
                                            newPacks[i].name = e.target.value;
                                            setSettings({ ...settings, packs: newPacks });
                                        }} className="w-full bg-transparent border-b border-white/20 focus:border-indigo-500 p-1 text-white outline-none transition-colors" />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs text-neutral-500 mb-1">Credits</label>
                                        <input type="number" value={pack.credits} onChange={e => {
                                            const newPacks = [...settings.packs];
                                            newPacks[i].credits = parseInt(e.target.value);
                                            setSettings({ ...settings, packs: newPacks });
                                        }} className="w-full bg-transparent border-b border-white/20 focus:border-indigo-500 p-1 text-white outline-none transition-colors text-right" />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs text-neutral-500 mb-1">Price ($)</label>
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
                            Save All Settings
                        </button>
                    </div>
                )}

                {activeTab === 'validations' && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-light">Validations Créatrices en Attente</h2>
                        </div>

                        {pendingModels.length === 0 ? (
                            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-12 text-center text-neutral-500">
                                Aucune demande en attente.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {pendingModels.map((model: any) => (
                                    <div key={model.email} className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">{model.name}</h3>
                                                <p className="text-pink-400 font-mono text-sm">{model.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-neutral-400 text-sm">Pays : <span className="text-white font-bold">{model.country}</span></div>
                                                <div className="text-neutral-400 text-sm">Tél : <span className="text-white font-bold">{model.phone}</span></div>
                                                <div className="text-neutral-400 text-sm">Né(e) le : <span className="text-white font-bold">{model.dob}</span></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/50 rounded-2xl p-4 border border-white/5">
                                                <p className="text-xs text-neutral-500 text-center mb-3">Photo 3 Doigts</p>
                                                <img src={model.photo3Fingers || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces"} alt="3 Fingers" className="w-full aspect-square object-cover rounded-xl" />
                                            </div>
                                            <div className="bg-black/50 rounded-2xl p-4 border border-white/5">
                                                <p className="text-xs text-neutral-500 text-center mb-3">Photo 5 Doigts</p>
                                                <img src={model.photo5Fingers || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces"} alt="5 Fingers" className="w-full aspect-square object-cover rounded-xl" />
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
                                                <XCircle size={18} /> Refuser
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models/${encodeURIComponent(model.email)}/validate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                    setPendingModels(prev => prev.filter(m => m.email !== model.email));
                                                }}
                                                className="flex-1 bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20 rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={18} /> Valider le compte
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
                            <h2 className="text-3xl font-light">User Management</h2>
                            <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1">
                                <button onClick={() => setUserFilter('all')} className={`px-4 py-2 rounded-lg text-sm transition-all ${userFilter === 'all' ? 'bg-indigo-500 text-white' : 'text-neutral-500 hover:text-white'}`}>All Users ({users.length})</button>
                                <button onClick={() => setUserFilter('buyers')} className={`px-4 py-2 rounded-lg text-sm transition-all ${userFilter === 'buyers' ? 'bg-indigo-500 text-white' : 'text-neutral-500 hover:text-white'}`}>Buyers ({users.filter(u => u.isBuyer).length})</button>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">User / Pseudo</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Registration</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Last Login</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Total Spent</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase text-right">Status</th>
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
                                                    <span className="bg-green-500/10 text-green-400 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-green-500/20">Buyer</span>
                                                    : <span className="bg-neutral-500/10 text-neutral-500 text-[10px] font-black uppercase px-2 py-1 rounded-md">Free</span>
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
                        <h2 className="text-3xl font-light">Model Fleet</h2>

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Model Name</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Contact</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Total Earnings</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Paid Out</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">Unpaid Balance</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase text-right">Action</th>
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
                                                        const amount = prompt(`Montant à payer pour ${m.pseudo} (Max: $${m.balance.toFixed(2)})`);
                                                        if (amount && parseFloat(amount) > 0) {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/models/${encodeURIComponent(m.email)}/payout`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                                body: JSON.stringify({ amount: parseFloat(amount) })
                                                            });
                                                            if (res.ok) fetchModels();
                                                            else alert("Error processing payout");
                                                        }
                                                    }}
                                                    className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    Payout
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
