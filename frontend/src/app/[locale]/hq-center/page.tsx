"use client";

// STAGING_DEPLOY_FORCE: 2026-04-15_v2
import { useState, useEffect } from "react";
import { Users, Video, DollarSign, Activity, Settings, Lock, CheckCircle, XCircle, Clock, Globe, Mail, Zap, UserCheck, ShieldCheck, ChevronLeft, ChevronRight, AlertCircle, ShieldAlert, Sparkles, FileText, History as HistoryIcon, Menu, X, Landmark, Wallet, Search } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { countries } from "@/utils/countries";

export default function AdminPage() {
    const { t } = useTranslation();

    const calculateAge = (dobString: string) => {
        if (!dobString) return null;
        try {
            const birthDate = new Date(dobString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            return null;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0].replace(/-/g, '/');
        } catch (e) {
            return dateString;
        }
    };

    const [token, setToken] = useState("");
    const [isLogged, setIsLogged] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTabState] = useState("stats");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        if (typeof window !== "undefined") {
            localStorage.setItem("kinky_admin_last_tab", tab);
        }
    };

    const [stats, setStats] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [pendingModels, setPendingModels] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [payoutSummary, setPayoutSummary] = useState<any>(null);
    const [payoutSubTab, setPayoutSubTab] = useState<'pending' | 'history'>('pending');
    const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
    const [monthlyArchives, setMonthlyArchives] = useState<any[]>([]);
    const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
    const [isApprovatingBatch, setIsApprovatingBatch] = useState<string | null>(null);
    const [isDownloadingZip, setIsDownloadingZip] = useState<string | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [financesStats, setFinancesStats] = useState<any>(null);
    const [marketingTab, setMarketingTab] = useState<'user' | 'model'>('user');
    const [marketingUsersStats, setMarketingUsersStats] = useState<any[]>([]);
    const [marketingModelsStats, setMarketingModelsStats] = useState<any[]>([]);
    const [teaserStats, setTeaserStats] = useState<any>(null);
    const [realtimeStats, setRealtimeStats] = useState<any>(null);
    const [userFilter, setUserFilter] = useState<'all' | 'buyers'>('all');
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [userPage, setUserPage] = useState(1);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [modelPage, setModelPage] = useState(1);
    const [modelTotalPages, setModelTotalPages] = useState(1);
    const [selectedImage, setSelectedImage] = useState<{ images: string[], index: number } | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState("");
    const [countrySearch, setCountrySearch] = useState("");
    const [showCountryResults, setShowCountryResults] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [modelSearch, setModelSearch] = useState("");
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewMethod, setReviewMethod] = useState<'bank' | 'paxum' | 'crypto' | null>(null);
    const [reviewSection, setReviewSection] = useState<'ready' | 'ongoing'>('ready');

    const postponePayout = async (id: string) => {
        if (!confirm(t('admin.payouts.confirm_postpone') || "Reporter ce paiement à la semaine prochaine ?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/${id}/postpone`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchPayoutRequests();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/login`, {
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
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(setStats);
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/users?page=${userPage}&limit=100&search=${encodeURIComponent(userSearch)}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (data && Array.isArray(data.users)) {
                setUsers(data.users);
                setUserTotalPages(data.totalPages || 1);
                setFetchError(null);
            } else if (Array.isArray(data)) {
                setUsers(data);
                setUserTotalPages(1);
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite?page=${modelPage}&limit=50&search=${encodeURIComponent(modelSearch)}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (data && Array.isArray(data.models)) {
                setModels(data.models);
                setModelTotalPages(data.totalPages || 1);
                setFetchError(null);
            } else if (Array.isArray(data)) {
                setModels(data);
                setModelTotalPages(1);
                setFetchError(null);
            } else {
                throw new Error("Invalid data format received.");
            }
        } catch (err: any) {
            console.error("Fetch Models Error:", err);
            setFetchError(t('admin.models.fetch_error'));
        }
    };

    const fetchPayoutSummary = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/summary`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setPayoutSummary(data);
        } catch (err) {
            console.error("Fetch Payout Summary Error:", err);
        }
    };

    const fetchPayoutRequests = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/pending`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setPayoutRequests(data);
            fetchPayoutSummary();
        } catch (err) {
            console.error("Fetch Payouts Error:", err);
        }
    };

    const fetchWeeklyHistory = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/history/weekly`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setWeeklyHistory(data);
        } catch (err) {
            console.error("Fetch Weekly History Error:", err);
        }
    };

    const fetchMonthlyArchives = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/history/months`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setMonthlyArchives(data);
        } catch (err) {
            console.error("Fetch Monthly Archives Error:", err);
        }
    };

    const approveBatchPayout = async (method: string, cutoff: string) => {
        if (!confirm(t('admin.payouts.confirm_batch_approve') || `Approve all pending ${method} payouts requested before Saturday?`)) return;
        
        setIsApprovatingBatch(method);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/batch-approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ method, cutoff })
            });
            const data = await res.json();
            if (res.ok) {
                alert(t('admin.payouts.batch_approve_success', { success: data.success }) || `Successfully processed ${data.success} payouts.`);
                fetchPayoutRequests();
                fetchPayoutSummary();
            } else {
                alert(data.error || "Batch approval failed");
            }
        } catch (err) {
            console.error(err);
            alert("Network error during batch approval");
        } finally {
            setIsApprovatingBatch(null);
        }
    };

    const downloadMonthlyInvoicesZip = async (month: string) => {
        setIsDownloadingZip(month);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/invoices/bulk?month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoices_${month}.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const err = await res.json();
                alert(err.error || "Bulk download failed");
            }
        } catch (err) {
            console.error(err);
            alert("Connection error during monthly ZIP download");
        } finally {
            setIsDownloadingZip(null);
        }
    };

    const downloadPayoutCSV = (method: string, historicalRequests?: any[]) => {
        const sourceData = historicalRequests || payoutRequests;
        const requests = sourceData.filter(p => (p.method || p.billingInfo?.method) === method);
        if (!requests.length) return alert(t('admin.payouts.no_requests') || "No requests for this method.");

        let csvContent = "";
        if (method === 'paxum') {
            csvContent = requests.map(p => {
                const email = p.billingInfo?.paxumEmail || p.modelEmail;
                return `${email},${p.amount.toFixed(2)},USD,Payout Weekly,${p.id}`;
            }).join("\n");
        } else if (method === 'crypto') {
            csvContent = requests.map(p => `${p.billingInfo?.cryptoAddress},${p.amount.toFixed(2)}`).join("\n");
        } else if (method === 'bank') {
            csvContent = requests.map(p => {
                const info = p.billingInfo || {};
                return `${info.name},${info.bankIban},${info.bankSwift},${p.amount.toFixed(2)},USD,Payout Kinky`;
            }).join("\n");
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `payouts_${method}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchPayoutHistory = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/history`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setPayoutHistory(data);
        } catch (err) {
            console.error("Fetch Payout History Error:", err);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/report/admin/list`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setReports(data);
        } catch (err) {
            console.error("Fetch Reports Error:", err);
        }
    };

    const fetchMarketingUsersStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/marketing?type=user`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setMarketingUsersStats(data);
        } catch (err) {
            console.error("Fetch Marketing Users Stats Error:", err);
        }
    };

    const fetchMarketingModelsStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/marketing?type=model`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setMarketingModelsStats(data);
        } catch (err) {
            console.error("Fetch Marketing Models Stats Error:", err);
        }
    };

    const fetchTeaserStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/teaser/stats`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setTeaserStats(data);
        } catch (err) {
            console.error("Fetch Teaser Stats Error:", err);
        }
    };

    const toggleTeaser = async (id: string, active: boolean) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/teaser/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id, active })
            });
            if (res.ok) fetchTeaserStats();
        } catch (err) {
            console.error("Toggle Teaser Error:", err);
        }
    };

    const fetchFinancesStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/finances`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setFinancesStats(data);
        } catch (err) {
            console.error("Fetch Finances Stats Error:", err);
        }
    };

    const updateMarketingExpense = async (month: string, currentAmount: number) => {
        const val = window.prompt(t('admin.finances.edit_marketing') || "Enter marketing expense for this month:", currentAmount.toString());
        if (val === null) return;
        const amount = parseFloat(val);
        if (isNaN(amount)) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/finances/marketing-expense`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ month, amount })
            });
            fetchFinancesStats();
        } catch (err) {
            console.error("Update Marketing Expense Error:", err);
        }
    };

    const fetchRealtime = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/realtime`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setRealtimeStats(data);
        } catch (err) {
            console.error("Fetch Realtime Error:", err);
        }
    };

    const fetchBlocklist = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/blocklist`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (Array.isArray(data)) setBlockedKeywords(data);
        } catch (err) {
            console.error("Fetch Blocklist Error:", err);
        }
    };

    const handleBlocklistAction = async (action: 'add' | 'remove', keyword: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/blocklist`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action, keyword })
            });
            const data = await res.json();
            if (Array.isArray(data)) setBlockedKeywords(data);
            if (action === 'add') setNewKeyword("");
        } catch (err) {
            console.error("Blocklist Action Error:", err);
        }
    };

    const checkConnectivity = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/ping`);
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
            
            // Tab Persistence
            const lastTab = localStorage.getItem("kinky_admin_last_tab");
            if (lastTab) setActiveTabState(lastTab);
        }
    }, []);

    useEffect(() => {
        if (isLogged && token) {
            // Debounce for search
            const delayDebounceFn = setTimeout(() => {
                if (activeTab === 'users') fetchUsers();
                if (activeTab === 'models') fetchModels();
            }, 500);

            if (activeTab === 'stats') fetchStats();
            if (activeTab === 'payouts') {
                fetchPayoutRequests();
                fetchPayoutHistory();
            } else if (activeTab === 'teaser') {
                fetchTeaserStats();
            }
            if (activeTab === 'reports') fetchReports();
            if (activeTab === 'marketing_users') fetchMarketingUsersStats();
            if (activeTab === 'marketing_models') fetchMarketingModelsStats();
            if (activeTab === 'finances') fetchFinancesStats();
            if (activeTab === 'realtime') fetchRealtime();
            if (activeTab === 'moderation') fetchBlocklist();

            if (activeTab === 'settings') {
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.json())
                    .then(setSettings);
            }

            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite/pending`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(setPendingModels);

            return () => clearTimeout(delayDebounceFn);
        }
    }, [isLogged, token, activeTab, userPage, modelPage, userSearch, modelSearch]);

    const saveSettings = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/settings`, {
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
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col lg:flex-row h-[100dvh] overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-neutral-900 border-b border-white/5 z-40 relative flex-shrink-0">
                <div className="text-xl font-black tracking-tighter text-white">
                    KI<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">+</span>NKY <span className="text-xs font-light tracking-widest text-neutral-500 ml-1">ADMIN</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:relative top-0 left-0 h-[100dvh] lg:h-full w-64 bg-neutral-900 border-r border-white/5 flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 text-2xl font-black tracking-tighter text-white border-b border-white/5 hidden lg:block">
                    KI<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">+</span>NKY <span className="text-xs font-light tracking-widest text-neutral-500 ml-1">ADMIN</span>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'stats' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Activity size={20} /> {t('admin.nav.dashboard')}
                    </button>
                    <button onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Users size={20} /> {t('admin.nav.users')}
                    </button>
                    <button onClick={() => { setActiveTab('models'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'models' ? 'bg-pink-500/20 text-pink-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Video size={20} /> {t('admin.nav.models')}
                    </button>
                    <button onClick={() => { setActiveTab('validations'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'validations' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Clock size={20} /> {t('admin.nav.pending')} {pendingModels.length > 0 && <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingModels.length}</span>}
                    </button>
                    <button onClick={() => { setActiveTab('payouts'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'payouts' ? 'bg-green-500/20 text-green-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <DollarSign size={20} /> {t('admin.nav.payouts')} {payoutRequests.length > 0 && <span className="ml-auto bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{payoutRequests.length}</span>}
                    </button>
                    <button onClick={() => { setActiveTab('finances'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'finances' ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <DollarSign size={20} /> {t('admin.nav.finances')}
                    </button>
                    <button onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-orange-500/20 text-orange-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <ShieldAlert size={20} /> {t('admin.nav.reports')} {reports.filter(r => r.status === 'active').length > 0 && <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{reports.filter(r => r.status === 'active').length}</span>}
                    </button>
                    <button onClick={() => { setActiveTab('realtime'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'realtime' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Zap size={20} className={activeTab === 'realtime' ? 'animate-pulse text-indigo-400' : ''} /> {t('admin.nav.realtime')}
                    </button>
                    <button onClick={() => { setActiveTab('moderation'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'moderation' ? 'bg-red-500/20 text-red-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <ShieldAlert size={20} /> {t('admin.nav.moderation')}
                    </button>
                    <button onClick={() => { setActiveTab('marketing'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'marketing' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Globe size={20} /> {t('admin.nav.marketing')}
                    </button>
                    <button onClick={() => { setActiveTab('teaser'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'teaser' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                        <Video size={20} /> {t('admin.nav.teaser')}
                    </button>
                    <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                        <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                            <Settings size={20} /> {t('admin.nav.settings')}
                        </button>
                        <button onClick={() => { setActiveTab('maintenance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'maintenance' ? 'bg-red-500/20 text-red-300' : 'hover:bg-white/5 text-neutral-400'}`}>
                            <Activity size={20} /> {t('admin.nav.maintenance') || 'Maintenance'}
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
            <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
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
                            <div className="overflow-x-auto w-full"><table className="w-full text-left whitespace-nowrap md:whitespace-normal">
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
                            </table></div>
                        </div>
                    </div>
                )}

                {activeTab === 'realtime' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group border-indigo-500/20">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/20 transition-colors" />
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-green-500/20 rounded-2xl text-green-400">
                                        <Zap size={24} className="animate-pulse" />
                                    </div>
                                    <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">{t('admin.realtime.active_calls')}</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-5xl font-black text-white">{realtimeStats?.online?.activeCalls || 0}</h4>
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
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
                                            <p className="text-sm font-medium">{t('admin.realtime.no_models')}</p>
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
                                                    <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">{t('admin.realtime.waiting_badge')}</span>
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
                                            <p className="text-sm font-medium">{t('admin.realtime.no_users')}</p>
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
                                <div className="col-span-2 space-y-4">
                                    <label className="block text-sm text-neutral-400 mb-2">{t('admin.settings.payout_tiers_title')}</label>
                                    {(settings.payoutTiers || []).map((tier: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">{t('admin.settings.min_minutes')}</label>
                                                <input 
                                                    type="number" 
                                                    value={tier.minMinutes} 
                                                    onChange={e => {
                                                        const newTiers = [...settings.payoutTiers];
                                                        newTiers[idx].minMinutes = parseFloat(e.target.value);
                                                        setSettings({ ...settings, payoutTiers: newTiers });
                                                    }}
                                                    className="w-full bg-transparent border-b border-white/10 focus:border-indigo-500 p-1 text-white outline-none"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">{t('admin.settings.earnings_rate')}</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={tier.rate} 
                                                    onChange={e => {
                                                        const newTiers = [...settings.payoutTiers];
                                                        newTiers[idx].rate = parseFloat(e.target.value);
                                                        setSettings({ ...settings, payoutTiers: newTiers });
                                                    }}
                                                    className="w-full bg-transparent border-b border-white/10 focus:border-indigo-500 p-1 text-white outline-none"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const newTiers = settings.payoutTiers.filter((_: any, i: number) => i !== idx);
                                                    setSettings({ ...settings, payoutTiers: newTiers });
                                                }}
                                                className="mt-4 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const newTiers = [...(settings.payoutTiers || []), { label: `Tier ${(settings.payoutTiers?.length || 0) + 1}`, minMinutes: 0, rate: 0.10 }];
                                            setSettings({ ...settings, payoutTiers: newTiers });
                                        }}
                                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 px-2 py-1"
                                    >
                                        {t('admin.settings.add_tier')}
                                    </button>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-neutral-400 mb-2">{t('admin.settings.anti_fraud_delay')}</label>
                                    <input type="number" value={settings.antiFraudDelaySec} onChange={e => setSettings({ ...settings, antiFraudDelaySec: parseInt(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                    <p className="text-xs text-neutral-500 mt-2">{t('admin.settings.anti_fraud_desc')}</p>
                                </div>

                                <div className="border-t border-white/5 pt-6 col-span-2">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">{t('admin.settings.free_credits_title') || 'Free Credits & Rates'}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs text-neutral-500 font-bold uppercase tracking-wider">{t('admin.settings.registration_credits') || 'Registration Welcome Credits'}</label>
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={settings.registrationWelcomeCredits || 5.0} 
                                                onChange={e => setSettings({ ...settings, registrationWelcomeCredits: parseFloat(e.target.value) })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs text-neutral-500 font-bold uppercase tracking-wider">{t('admin.settings.guest_credits') || 'Guest Free Credits'}</label>
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={settings.guestFreeCredits || 5.0} 
                                                onChange={e => setSettings({ ...settings, guestFreeCredits: parseFloat(e.target.value) })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs text-neutral-500 font-bold uppercase tracking-wider">{t('admin.settings.credits_per_minute') || 'Credits per Minute'}</label>
                                            <input 
                                                type="number" 
                                                value={settings.creditsPerMinute || 10} 
                                                onChange={e => setSettings({ ...settings, creditsPerMinute: parseInt(e.target.value) })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono" 
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-neutral-500 mt-4 italic">
                                        {t('admin.settings.free_time_hint', { 
                                            guestTime: Math.floor(((settings.guestFreeCredits || 5) / (settings.creditsPerMinute || 10)) * 60),
                                            regTime: Math.floor(((settings.registrationWelcomeCredits || 5) / (settings.creditsPerMinute || 10)) * 60)
                                        }) || `Guest gets ${Math.floor(((settings.guestFreeCredits || 5) / (settings.creditsPerMinute || 10)) * 60)}s free. New users get ${Math.floor(((settings.registrationWelcomeCredits || 5) / (settings.creditsPerMinute || 10)) * 60)}s free.`}
                                    </p>
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
                                        }} className="w-full bg-transparent border-b border-white/20 focus:border-indigo-500 p-1 text-white outline-none transition-colors text-right font-mono" />
                                        <div className="text-[10px] text-indigo-400 mt-2 text-right font-medium tracking-wide">
                                            {Math.floor((pack.credits || 0) / 10)} min
                                        </div>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs text-neutral-500 mb-1">{t('admin.pack.price')}</label>
                                        <div className="relative">
                                            <span className="absolute left-0 top-1.5 text-white/50 text-sm">$</span>
                                            <input type="number" step="0.01" value={pack.priceUsd} onChange={e => {
                                                const newPacks = [...settings.packs];
                                                newPacks[i].priceUsd = parseFloat(e.target.value);
                                                setSettings({ ...settings, packs: newPacks });
                                            }} className="w-full bg-transparent border-b border-white/20 focus:border-indigo-500 p-1 pl-4 text-white outline-none transition-colors text-right font-mono" />
                                        </div>
                                        <div className="text-[10px] text-green-400 mt-2 text-right font-medium tracking-wide">
                                            ${((pack.priceUsd || 0) / Math.max(1, ((pack.credits || 0) / 10))).toFixed(2)}/min
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
                            <h3 className="text-xl font-medium text-pink-400 border-b border-white/5 pb-4 uppercase tracking-tighter">{t('admin.settings.private_session_title', { minutes: settings.blockDurationMin || 30 })}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">{t('admin.settings.session_duration')}</label>
                                    <input type="number" 
                                        value={settings.blockDurationMin || 30} 
                                        onChange={e => setSettings({ ...settings, blockDurationMin: parseInt(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 transition-colors font-mono" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">{t('admin.settings.user_cost')}</label>
                                    <input type="number" 
                                        value={settings.blockCreditsCost || 600} 
                                        onChange={e => setSettings({ ...settings, blockCreditsCost: parseInt(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 transition-colors font-mono" 
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-[10px] text-indigo-400 font-black uppercase">{t('admin.settings.auto_debit')}</p>
                                        <p className="text-[10px] text-neutral-400 font-mono tracking-tighter">
                                            {((settings.blockCreditsCost || 600) / (settings.blockDurationMin || 30)).toFixed(2)} CREDITS / MIN
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">{t('admin.settings.model_payout')}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3.5 text-white/30">$</span>
                                        <input type="number" 
                                            step="0.01"
                                            value={settings.blockModelGain || 25} 
                                            onChange={e => setSettings({ ...settings, blockModelGain: parseFloat(e.target.value) })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-8 text-white focus:outline-none focus:border-pink-500 transition-colors font-mono" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">{t('admin.settings.special_pack_price')}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3.5 text-white/30">$</span>
                                        <input type="number" 
                                            step="0.01"
                                            value={settings.blockSpecialPackPrice || 59} 
                                            onChange={e => setSettings({ ...settings, blockSpecialPackPrice: parseFloat(e.target.value) })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-8 text-white focus:outline-none focus:border-pink-500 transition-colors font-mono" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-500 mt-2 font-medium italic">{t('admin.settings.auto_pack_desc')}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">{t('admin.settings.payout_fee')}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3.5 text-white/30">$</span>
                                        <input type="number" 
                                            step="0.01"
                                            value={settings.payoutFeeUsd || 5.0} 
                                            onChange={e => setSettings({ ...settings, payoutFeeUsd: parseFloat(e.target.value) })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-8 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-500 mt-2 font-medium italic">Frais appliqués à chaque demande de retrait</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors ${settings.ageVerificationPopup ? 'bg-indigo-500/20' : 'bg-neutral-500/10'}`} />
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-medium text-white flex items-center gap-2">
                                        <ShieldCheck className={settings.ageVerificationPopup ? 'text-indigo-400' : 'text-neutral-500'} size={20} />
                                        {t('admin.settings.age_popup_title')}
                                    </h3>
                                    <p className="text-xs text-neutral-500">{t('admin.settings.age_popup_desc')}</p>
                                </div>
                                <button 
                                    onClick={() => setSettings({ ...settings, ageVerificationPopup: !settings.ageVerificationPopup })}
                                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${settings.ageVerificationPopup ? 'bg-indigo-500' : 'bg-neutral-700'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 transform ${settings.ageVerificationPopup ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors ${settings.maintenanceMode ? 'bg-red-500/20' : 'bg-green-500/10'}`} />
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-medium text-white flex items-center gap-2">
                                        <AlertCircle className={settings.maintenanceMode ? 'text-red-500' : 'text-green-500'} size={20} />
                                        {t('admin.settings.maintenance_mode')}
                                    </h3>
                                    <p className="text-xs text-neutral-500">{t('admin.settings.maintenance_desc')}</p>
                                </div>
                                <button 
                                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${settings.maintenanceMode ? 'bg-red-500' : 'bg-neutral-700'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {settings.maintenanceMode && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                                    <ShieldAlert size={14} />
                                    {t('admin.settings.block_notice')}
                                </div>
                            )}
                        </div>

                        {/* Restricted Countries Section */}
                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xl font-medium text-amber-500 border-b border-white/5 pb-4 flex items-center gap-2">
                                    <Globe className="text-amber-500" size={20} />
                                    {t('admin.settings.restricted_countries_title') || "Restrictions Géographiques (Non-Freemium)"}
                                </h3>
                                <p className="text-xs text-neutral-500">
                                    {t('admin.settings.restricted_countries_desc') || "Les utilisateurs de ces pays ne bénéficieront pas des 30s gratuites et devront s'inscrire/payer immédiatement."}
                                </p>
                            </div>

                            <div className="relative">
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        placeholder={t('admin.settings.country_search_placeholder') || "Rechercher un pays (ex: Inde, Pakistan...)"} 
                                        className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                        value={countrySearch}
                                        onChange={(e) => {
                                            setCountrySearch(e.target.value);
                                            setShowCountryResults(true);
                                        }}
                                        onFocus={() => setShowCountryResults(true)}
                                    />
                                </div>

                                {showCountryResults && countrySearch && (
                                    <div className="absolute z-50 w-full mt-2 bg-neutral-800 border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-xl">
                                        {countries
                                            .filter(c => 
                                                c.nameFr.toLowerCase().includes(countrySearch.toLowerCase()) || 
                                                c.nameEn.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                                c.code.toLowerCase().includes(countrySearch.toLowerCase())
                                            )
                                            .slice(0, 10)
                                            .map(c => (
                                                <button
                                                    key={c.code}
                                                    onClick={() => {
                                                        const currentCodes = settings.restrictedCountries || [];
                                                        if (!currentCodes.includes(c.code)) {
                                                            setSettings({ ...settings, restrictedCountries: [...currentCodes, c.code] });
                                                        }
                                                        setCountrySearch("");
                                                        setShowCountryResults(false);
                                                    }}
                                                    className="w-full text-left p-4 hover:bg-white/5 flex items-center justify-between border-b border-white/5 group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{c.flag}</span>
                                                        <div>
                                                            <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{c.nameFr}</div>
                                                            <div className="text-[10px] text-neutral-500 uppercase font-black">{c.code}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Zap size={16} />
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Restricted Tags */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {(settings.restrictedCountries || []).map((code: string) => {
                                    const country = countries.find(c => c.code === code);
                                    return (
                                        <div key={code} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full group hover:border-amber-500/40 transition-all">
                                            <span className="text-sm">{country?.flag}</span>
                                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                                {country?.nameFr || code}
                                                <span className="text-[10px] opacity-40 font-black">{code}</span>
                                            </span>
                                            <button 
                                                onClick={() => {
                                                    const updated = settings.restrictedCountries.filter((c: string) => c !== code);
                                                    setSettings({ ...settings, restrictedCountries: updated });
                                                }}
                                                className="text-amber-500/30 hover:text-amber-500 transition-colors"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {(settings.restrictedCountries || []).length === 0 && (
                                    <div className="text-center py-4 text-neutral-600 italic text-xs w-full">
                                        {t('admin.settings.no_restricted_countries') || "Aucun pays restreint pour le moment."}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Teaser Section */}
                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors ${settings.teaserEnabled ? 'bg-indigo-500/20' : 'bg-green-500/10'}`} />
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-medium text-white flex items-center gap-2">
                                        <Video className={settings.teaserEnabled ? 'text-indigo-500' : 'text-neutral-500'} size={20} />
                                        {t('admin.settings.teaser_title') || "Vidéo Teaser (Registered Users)"}
                                    </h3>
                                    <p className="text-xs text-neutral-500">{t('admin.settings.teaser_desc') || "Déclenche une vidéo de 8s quand il reste 10s de crédit (bonus de bienvenue uniquement)."}</p>
                                </div>
                                <button 
                                    onClick={() => setSettings({ ...settings, teaserEnabled: !settings.teaserEnabled })}
                                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${settings.teaserEnabled ? 'bg-indigo-500' : 'bg-neutral-700'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 transform ${settings.teaserEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {settings.teaserEnabled && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                        <Sparkles size={14} className="text-indigo-500" />
                                        {t('admin.settings.teaser_active_notice') || "TEASER FEATURE IS LIVE FOR NEW REGISTERED USERS"}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Launch Mode */}
                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors ${settings.launchMode ? 'bg-indigo-500/20' : 'bg-green-500/10'}`} />
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-medium text-white flex items-center gap-2">
                                        <Zap className={settings.launchMode ? 'text-indigo-500' : 'text-green-500'} size={20} />
                                        {t('launch.stay_tuned')} {t('admin.settings.coming_soon')}
                                    </h3>
                                    <p className="text-xs text-neutral-500">{t('admin.settings.landpage_desc_short')}</p>
                                </div>
                                <button 
                                    onClick={() => setSettings({ ...settings, launchMode: !settings.launchMode })}
                                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${settings.launchMode ? 'bg-indigo-500' : 'bg-neutral-700'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 transform ${settings.launchMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {settings.launchMode && (
                                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                                    <Sparkles size={14} className="text-indigo-500" />
                                    {t('admin.settings.landpage_notice') || "STUNNING LANDING PAGE ENABLED"}
                                </div>
                            )}
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
                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/maintenance/reset`, {
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

                {activeTab === 'maintenance' && (
                    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-light">{t('admin.maintenance.title') || 'Maintenance Système'}</h2>
                            <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/20">{t('admin.maintenance.subtitle') || 'Outils Critiques'}</span>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            
                            <div className="relative z-10 flex items-start gap-6">
                                <div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-500/10">
                                    <Zap size={32} />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{t('admin.maintenance.sync_all_title') || 'Synchronisation Totale (SQL → Redis)'}</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        {t('admin.maintenance.sync_all_desc') || 'Transfère toutes les données critiques de la base SQL (Pseudos, Crédits, Balances) vers votre nouvelle instance Redis. Indispensable après un changement de serveur Redis.'}
                                    </p>
                                    
                                    <div className="pt-4">
                                        <button 
                                            disabled={backendStatus === 'offline'}
                                            onClick={async () => {
                                                if (!window.confirm(t('admin.maintenance.sync_confirm_all') || 'Lancer la synchronisation TOTALE ? Cela va remplir votre nouveau Redis avec les pseudos, crédits et soldes de tous les comptes.')) return;
                                                
                                                try {
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/maintenance/sync-pseudos`, {
                                                        method: "POST",
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert(`${t('admin.maintenance.sync_success') || 'Synchronisation réussie !'} : ${data.updated} comptes synchronisés.`);
                                                    } else {
                                                        alert(t('admin.maintenance.sync_error') || 'Erreur lors de la synchronisation.');
                                                    }
                                                } catch (err) {
                                                    alert('Erreur réseau lors de la synchronisation.');
                                                }
                                            }}
                                            className="group relative px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center gap-3"
                                        >
                                            <Activity size={16} className="group-hover:animate-spin" />
                                            {t('admin.maintenance.sync_btn_all')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            
                            <div className="relative z-10 flex items-start gap-6">
                                <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-400 shadow-lg shadow-amber-500/10">
                                    <HistoryIcon size={32} />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{t('admin.maintenance.reconstruct_stats_title') || "Reconstruire l'Historique des Stats"}</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        {t('admin.maintenance.reconstruct_stats_desc') || "Recrée les compteurs journaliers (inscriptions, modèles, payouts) et marketing dans Redis à partir de SQL. Indispensable pour retrouver vos graphiques après une migration Redis."}
                                    </p>
                                    
                                    <div className="pt-4">
                                        <button 
                                            disabled={backendStatus === 'offline'}
                                            onClick={async () => {
                                                if (!window.confirm(t('admin.maintenance.reconstruct_confirm') || "Lancer la reconstruction de l'historique ? Cela peut prendre quelques secondes.")) return;
                                                
                                                try {
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/maintenance/reconstruct-stats`, {
                                                        method: "POST",
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert(`${t('admin.maintenance.reconstruct_success') || 'Reconstruction terminée !'}`);
                                                    } else {
                                                        alert(t('admin.maintenance.reconstruct_error') || 'Erreur lors de la reconstruction.');
                                                    }
                                                } catch (err) {
                                                    alert('Erreur réseau lors de la reconstruction.');
                                                }
                                            }}
                                            className="group relative px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20 flex items-center gap-3"
                                        >
                                            <Activity size={16} className="group-hover:animate-spin" />
                                            {t('admin.maintenance.reconstruct_btn')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-3xl">
                            <div className="flex items-center gap-3 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">
                                <AlertCircle size={14} /> Attention
                            </div>
                            <p className="text-neutral-500 text-xs italic">
                                Utilisez ces outils uniquement lorsque c'est nécessaire.
                            </p>
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
                                                    {model.pseudo && <span className="text-sm font-light text-neutral-500 ml-2">(@{model.pseudo})</span>}
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
                                                    <p className="text-sm font-bold text-white">
                                                        {formatDate(model.dob)} 
                                                        <span className="text-pink-500 ml-2">({calculateAge(model.dob)} {t('common.years_old') || 'ans'})</span>
                                                    </p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{t('admin.model.email')}</p>
                                                    <p className="text-[10px] font-bold text-pink-400 truncate max-w-[120px]">{model.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'profile', label: t('admin.validations.profile'), url: model.photoProfile },
                                                { id: 'id', label: t('admin.validations.id_document'), url: model.photoId },
                                                { id: 'selfie', label: t('admin.validations.selfie_id'), url: model.photoIdSelfie }
                                            ].map((img, idx, arr) => (
                                                <div key={img.id} className="bg-black/50 rounded-2xl p-3 border border-white/5">
                                                    <p className="text-[10px] text-neutral-500 text-center mb-2 uppercase tracking-tighter">{img.label}</p>
                                                    <img 
                                                        src={img.url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=faces"} 
                                                        alt={img.label} 
                                                        className="w-full aspect-square object-cover rounded-xl border border-white/10 cursor-zoom-in hover:brightness-110 transition-all" 
                                                        onClick={() => setSelectedImage({ 
                                                            images: arr.map(a => a.url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop&crop=faces"), 
                                                            index: idx 
                                                        })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                         <div className="flex gap-4 mt-2">
                                            <button
                                                onClick={async () => {
                                                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite/${model.id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                    setPendingModels(prev => prev.filter(m => m.id !== model.id));
                                                }}
                                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={18} /> {t('admin.validations.reject')}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite/${model.id}/validate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                    setPendingModels(prev => prev.filter(m => m.id !== model.id));
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

                {activeTab === 'teaser' && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-light">Gestion des Teasers</h2>
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                                    A/B Testing Actif
                                </span>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto w-full"><table className="w-full text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-6 text-neutral-500 font-bold text-[10px] uppercase tracking-widest">Aperçu</th>
                                        <th className="p-6 text-neutral-500 font-bold text-[10px] uppercase tracking-widest">Fichier / Nom</th>
                                        <th className="p-6 text-neutral-500 font-bold text-[10px] uppercase tracking-widest">Vues</th>
                                        <th className="p-6 text-neutral-500 font-bold text-[10px] uppercase tracking-widest text-center">Ventes</th>
                                        <th className="p-6 text-neutral-500 font-bold text-[10px] uppercase tracking-widest text-right">Conv. %</th>
                                        <th className="p-6 text-neutral-500 font-bold text-[10px] uppercase tracking-widest text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {teaserStats?.videos?.map((v: any) => (
                                        <tr key={v.id} className="group hover:bg-white/[0.01] transition-colors">
                                            <td className="p-6">
                                                <div 
                                                    className="relative w-20 h-12 rounded-lg bg-black border border-white/10 overflow-hidden group-hover:border-indigo-500/50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedVideo(v.path)}
                                                >
                                                    <video 
                                                        src={v.path} 
                                                        className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" 
                                                        onMouseEnter={(e) => e.currentTarget.play()}
                                                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                                        muted
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-bold text-white tracking-tight">{v.name}</div>
                                                <div className="text-[10px] text-neutral-500 font-mono italic">{v.path}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-mono text-white">{v.stats?.views || 0}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="text-sm font-bold text-green-400">{v.stats?.conversions || 0}</div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="text-xs font-black text-indigo-400">
                                                    {v.stats?.views > 0 ? ((v.stats.conversions / v.stats.views) * 100).toFixed(1) : 0}%
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => toggleTeaser(v.id, !v.active)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${v.active ? 'bg-green-500' : 'bg-neutral-800'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 transform ${v.active ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    {/* No Teaser Row (Control Group) */}
                                    {teaserStats?.control && (
                                        <tr className="bg-indigo-500/5 border-t-2 border-indigo-500/20">
                                            <td className="p-6">
                                                <div className="w-20 h-12 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center text-neutral-600">
                                                    <XCircle size={16} />
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black text-indigo-300 tracking-widest uppercase">GROUPE DE CONTRÔLE</div>
                                                <div className="text-[10px] text-indigo-400/50 italic">(Aucun Teaser affiché)</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-mono text-white">{teaserStats.control.views}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="text-sm font-bold text-green-400">{teaserStats.control.conversions}</div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="text-xs font-black text-indigo-400">
                                                    {teaserStats.control.views > 0 ? ((teaserStats.control.conversions / teaserStats.control.views) * 100).toFixed(1) : 0}%
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => toggleTeaser('none', !teaserStats.control.active)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ml-auto ${teaserStats.control.active ? 'bg-indigo-500' : 'bg-neutral-800'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 transform ${teaserStats.control.active ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table></div>
                        </div>
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

                            <div className="flex-1 max-w-sm relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value);
                                        setUserPage(1); // Reset to page 1 on search
                                    }}
                                    placeholder={t('admin.users.search_placeholder') || "Search by email or pseudo..."}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
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
                                <button onClick={fetchUsers} className="ml-auto underline font-bold">{t('common.retry')}</button>
                            </div>
                        )}

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto w-full"><table className="w-full text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.user_pseudo')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.registration')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.last_login')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.total_spent')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.credits')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.common.type')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.status')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.tracking')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase text-right">{t('admin.table.action')}</th>
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
                                            <td className="p-5 font-mono text-white font-bold">{u.credits ? u.credits.toFixed(0) : 0}</td>
                                            <td className="p-5">
                                                {u.isBuyer ?
                                                    <span className="bg-green-500/10 text-green-400 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-green-500/20">{t('admin.status.buyer')}</span>
                                                    : <span className="bg-neutral-500/10 text-neutral-500 text-[10px] font-black uppercase px-2 py-1 rounded-md text-white">{t('admin.status.free')}</span>
                                                }
                                            </td>
                                            <td className="p-5">
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${u.status === 'disabled' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                    {u.status === 'disabled' ? t('admin.status.disabled') : t('admin.status.active')}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-[10px] font-mono text-neutral-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={`${u.marketing?.src || 'direct'} / ${u.marketing?.camp || '-'} / ${u.marketing?.ad || '-'}`}>
                                                    {u.marketing?.src || 'direct'} / {u.marketing?.camp || '-'} / {u.marketing?.ad || '-'}
                                                </div>
                                             </td>
                                             <td className="p-5 text-right space-x-2">
                                                <button
                                                    onClick={async () => {
                                                        const amount = prompt(t('admin.users.edit_credits_prompt', { pseudo: u.pseudo }), u.credits || 0);
                                                        if (amount !== null && !isNaN(parseFloat(amount))) {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/users/${u.id}/credits`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                                body: JSON.stringify({ credits: parseFloat(amount) })
                                                            });
                                                            if (res.ok) {
                                                                fetchUsers();
                                                            } else {
                                                                alert(t('admin.users.edit_credits_error'));
                                                            }
                                                        }
                                                    }}
                                                    className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    {t('admin.users.edit_credits_cta')}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(t('common.confirm_action'))) {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/users/${u.id}/toggle-status`, {
                                                                method: "POST",
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            if (res.ok) {
                                                                fetchUsers();
                                                            }
                                                        }
                                                    }}
                                                    className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-colors ${u.status === 'disabled' ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20'}`}
                                                >
                                                    {u.status === 'disabled' ? t('admin.status.active') : t('admin.status.disabled')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>

                        {/* Pagination for Users */}
                        <div className="flex items-center justify-between bg-neutral-900 border border-white/5 border-t-0 p-4 rounded-b-3xl">
                            <div className="text-sm text-neutral-500">
                                {t('admin.pagination.page', { current: userPage, total: userTotalPages })}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                                    disabled={userPage === 1}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                                    disabled={userPage === userTotalPages}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'models' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-light">{t('admin.models.title')}</h2>
                            <div className="flex-1 max-w-sm relative ml-8">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-500">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={modelSearch}
                                    onChange={(e) => {
                                        setModelSearch(e.target.value);
                                        setModelPage(1); // Reset to page 1 on search
                                    }}
                                    placeholder={t('admin.models.search_placeholder') || "Email, pseudo, name..."}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto w-full"><table className="w-full text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.model_name')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.contact')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.total_earnings')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.paid_out')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.unpaid_balance')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.status')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase">{t('admin.table.tracking')}</th>
                                        <th className="p-5 text-neutral-400 font-medium text-xs uppercase text-right">{t('admin.table.action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {models.map((m, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-5 font-medium">
                                                <div 
                                                    className="text-pink-400 font-bold cursor-pointer hover:underline flex items-center gap-2"
                                                    onClick={() => {
                                                        const galleryImages = [
                                                            { url: m.photoProfile, label: t('admin.validations.current_profile') },
                                                            { url: m.photoProfileReg, label: t('admin.validations.reg_profile') },
                                                            { url: m.photoId, label: t('admin.validations.reg_id') },
                                                            { url: m.photoIdSelfie, label: t('admin.validations.reg_selfie') }
                                                        ].filter(img => img.url);
                                                        setSelectedImage({ images: galleryImages as any, index: 0 });
                                                    }}
                                                >
                                                    {m.pseudo || 'N/A'}
                                                    <Sparkles size={12} className="text-pink-500/50" />
                                                </div>
                                                <div className="text-[10px] text-neutral-500">{m.firstName} {m.lastName}</div>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-sm text-white font-mono italic">{m.email}</div>
                                                <div className="text-xs text-neutral-500">{m.phone}</div>
                                            </td>
                                            <td className="p-5 font-mono text-white">${m.totalGains.toFixed(2)}</td>
                                            <td className="p-5 font-mono text-neutral-400">-${m.totalPayouts.toFixed(2)}</td>
                                            <td className="p-5 font-mono text-green-400 font-bold">${m.balance.toFixed(2)}</td>
                                            <td className="p-5">
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${m.status === 'disabled' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                    {m.status === 'disabled' ? t('admin.status.disabled') : t('admin.status.active')}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-[10px] font-mono text-neutral-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={`${m.marketing?.src || 'direct'} / ${m.marketing?.camp || '-'} / ${m.marketing?.ad || '-'}`}>
                                                    {m.marketing?.src || 'direct'} / {m.marketing?.camp || '-'} / {m.marketing?.ad || '-'}
                                                </div>
                                             </td>
                                             <td className="p-5 text-right space-x-2">
                                                <button
                                                    onClick={async () => {
                                                        const amount = prompt(t('admin.models.payout_prompt', { name: m.pseudo, balance: m.balance.toFixed(2) }));
                                                        if (amount && parseFloat(amount) > 0) {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite/${m.id}/payout`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                                body: JSON.stringify({ amount: parseFloat(amount) })
                                                            });
                                                            if (res.ok) fetchModels();
                                                            else alert(t('admin.models.payout_error'));
                                                        }
                                                    }}
                                                    className="bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    {t('admin.models.payout_cta')}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const amount = prompt(t('admin.models.reset_balance_prompt', { name: m.pseudo }));
                                                        if (amount !== null) {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite/${m.id}/reset-balance`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                                body: JSON.stringify({ amount: parseFloat(amount) })
                                                            });
                                                            if (res.ok) {
                                                                alert(t('admin.models.reset_balance_success'));
                                                                fetchModels();
                                                            } else {
                                                                alert(t('admin.models.reset_balance_error'));
                                                            }
                                                        }
                                                    }}
                                                    className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    {t('admin.models.reset_balance_cta')}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(t('common.confirm_action'))) {
                                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite/${m.id}/toggle-status`, {
                                                                method: "POST",
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            if (res.ok) {
                                                                fetchModels();
                                                            }
                                                        }
                                                    }}
                                                    className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-colors ml-2 ${m.status === 'disabled' ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20'}`}
                                                >
                                                    {m.status === 'disabled' ? t('admin.status.active') : t('admin.status.disabled')}
                                                </button>
                                                {m.totpEnabled && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(t('common.confirm_action'))) {
                                                                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/elite/${m.id}/disable-2fa`, {
                                                                    method: "POST",
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                if (res.ok) {
                                                                    alert(t('common.success') || 'Succès');
                                                                    fetchModels();
                                                                }
                                                            }
                                                        }}
                                                        className="text-[10px] font-bold px-3 py-2 rounded-lg transition-colors ml-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20"
                                                    >
                                                        DISABLE 2FA
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>

                        {/* Pagination for Models */}
                        <div className="flex items-center justify-between bg-neutral-900 border border-white/5 border-t-0 p-4 rounded-b-3xl">
                            <div className="text-sm text-neutral-500">
                                {t('admin.pagination.page', { current: modelPage, total: modelTotalPages })}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setModelPage(p => Math.max(1, p - 1))}
                                    disabled={modelPage === 1}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setModelPage(p => Math.min(modelTotalPages, p + 1))}
                                    disabled={modelPage === modelTotalPages}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-3xl font-light mb-2">{t('admin.payouts.title')}</h2>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                                        <Clock size={14} className="text-amber-500" />
                                        <span className="text-[10px] font-black uppercase text-amber-200 tracking-wider">Cut-off: Samedi 23:59:59 Paris</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                                        <CheckCircle size={14} className="text-indigo-400" />
                                        <span className="text-[10px] font-black uppercase text-indigo-200 tracking-wider">Review & Paiement: Lundi / Mardi</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sub-tabs for Payouts */}
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                <button 
                                    onClick={() => setPayoutSubTab('pending')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${payoutSubTab === 'pending' ? 'bg-white/10 text-white shadow-xl' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    {t('admin.payouts.tab_pending') || "À payer"}
                                </button>
                                <button 
                                    onClick={() => {
                                        setPayoutSubTab('history');
                                        fetchWeeklyHistory();
                                        fetchMonthlyArchives();
                                    }}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${payoutSubTab === 'history' ? 'bg-white/10 text-white shadow-xl' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    {t('admin.payouts.tab_history') || "Historique"}
                                </button>
                            </div>
                        </div>

                        {payoutSubTab === 'pending' ? (
                            <>
                                {payoutSummary && (
                                    <div className="space-y-12">
                                        {/* Ready Section (Last Week) */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-light text-white/50 flex items-center gap-3">
                                                    <CheckCircle className="text-green-400" size={20} />
                                                    {t('admin.payouts.weekly_history_title') || "Dernière Semaine (À Payer)"}
                                                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                                                        {t('admin.payouts.week_ending', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Jusqu'au ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                    <div className="ml-auto flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl">
                                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('common.total') || "Total Global"}</span>
                                                        <span className="text-xl font-mono font-bold text-green-400 animate-in fade-in zoom-in duration-500">
                                                            ${Object.values(payoutSummary.ready || {}).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    { id: 'bank', icon: Landmark, label: t('billing.method_bank'), color: 'text-blue-400' },
                                                    { id: 'crypto', icon: Wallet, label: t('billing.method_crypto'), color: 'text-indigo-400' },
                                                    { id: 'paxum', icon: Mail, label: 'Paxum', color: 'text-pink-400' }
                                                ].map(m => {
                                                    const data = payoutSummary.ready?.[m.id] || { count: 0, total: 0 };
                                                    return (
                                                        <div key={m.id} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${m.color}`}>
                                                                    <m.icon size={20} />
                                                                </div>
                                                                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                                    {data.count || 0} {t('admin.payouts.requests') || "Requests"}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-xs text-neutral-500 font-medium">{m.label}</div>
                                                                <div className="text-2xl font-bold text-white font-mono">
                                                                    ${(data.total || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex flex-col gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        setReviewMethod(m.id as any);
                                                                        setReviewSection('ready');
                                                                        setReviewModalOpen(true);
                                                                    }}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-3 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Search size={14} />
                                                                    DÉTAILS & REVIEW
                                                                </button>
                                                                <button 
                                                                    onClick={() => downloadPayoutCSV(m.id)}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 opacity-50"
                                                                >
                                                                    <FileText size={14} />
                                                                    {t('admin.payouts.download_csv') || "Download CSV"}
                                                                </button>
                                                                
                                                                {(data.count || 0) > 0 && (
                                                                    <button 
                                                                        disabled={isApprovatingBatch === m.id}
                                                                        onClick={() => approveBatchPayout(m.id, payoutSummary.cutoff)}
                                                                        className="w-full bg-green-500 hover:bg-green-400 text-white text-[10px] font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] animate-in slide-in-from-top-2 duration-500"
                                                                    >
                                                                        {isApprovatingBatch === m.id ? (
                                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle size={14} />
                                                                        )}
                                                                        {t('admin.payouts.batch_approve') || `VALIDATE ALL AS PAID`}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Ongoing Section (Current Week) */}
                                        <div className="space-y-6 pt-6 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-light text-white/50 flex items-center gap-3">
                                                    <HistoryIcon className="text-neutral-500" size={20} />
                                                    {t('admin.payouts.ongoing_week_title') || "Semaine en cours (Ongoing)"}
                                                    <span className="text-xs bg-white/5 text-neutral-500 px-2 py-1 rounded-lg border border-white/10">
                                                        {t('admin.payouts.since_date', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Depuis le ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                    <div className="ml-auto flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl opacity-60">
                                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('common.total') || "Total Global"}</span>
                                                        <span className="text-xl font-mono font-bold text-white leading-none">
                                                            ${Object.values(payoutSummary.ongoing || {}).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    { id: 'bank', icon: Landmark, label: t('billing.method_bank'), color: 'text-blue-400' },
                                                    { id: 'crypto', icon: Wallet, label: t('billing.method_crypto'), color: 'text-indigo-400' },
                                                    { id: 'paxum', icon: Mail, label: 'Paxum', color: 'text-pink-400' }
                                                ].map(m => {
                                                    const data = payoutSummary.ongoing?.[m.id] || { count: 0, total: 0 };
                                                    return (
                                                        <div key={m.id} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${m.color}`}>
                                                                    <m.icon size={20} />
                                                                </div>
                                                                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                                    {data.count || 0} {t('admin.payouts.requests') || "Requests"}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-xs text-neutral-500 font-medium">{m.label}</div>
                                                                <div className="text-2xl font-bold text-white font-mono opacity-50">
                                                                    ${(data.total || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex flex-col gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        setReviewMethod(m.id as any);
                                                                        setReviewSection('ongoing');
                                                                        setReviewModalOpen(true);
                                                                    }}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-3 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Search size={14} />
                                                                    DÉTAILS & REVIEW
                                                                </button>
                                                                <button 
                                                                    onClick={() => downloadPayoutCSV(m.id)}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 opacity-50"
                                                                >
                                                                    <FileText size={14} />
                                                                    {t('admin.payouts.download_csv') || "Download CSV"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                        </>
                        ) : (
                            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                                {/* Weekly History List */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-light text-white/50 flex items-center gap-3">
                                        <HistoryIcon size={20} />
                                        {t('admin.payouts.weekly_history_title') || "Historique des semaines passées"}
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {weeklyHistory.length === 0 ? (
                                            <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8 text-center text-neutral-600 text-sm italic">
                                                {t('admin.payouts.no_history') || "Aucun historique disponible."}
                                            </div>
                                        ) : (
                                            weeklyHistory.map((week, idx) => (
                                                <div key={idx} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-bold text-white">
                                                            {t('admin.payouts.week_ending', { date: new Date(week.date).toLocaleDateString() }) || `Semaine se terminant le ${new Date(week.date).toLocaleDateString()}`}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">
                                                            {week.bank.count + week.paxum.count + week.crypto.count} {t('admin.payouts.total_paid') || "Modèles payés"}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4">
                                                        {['bank', 'crypto', 'paxum'].map(m => (
                                                            <div key={m} className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                                                <div className="text-[8px] text-neutral-500 uppercase font-black mb-1">{m}</div>
                                                                <div className="text-sm font-mono font-bold text-white">
                                                                    ${(week[m]?.total || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={async () => {
                                                                alert("L'export CSV historique utilise le même format que l'export en cours.");
                                                            }}
                                                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-neutral-400 hover:text-white transition-all"
                                                            title="Download CSV"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Monthly ZIP Archive List */}
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <h3 className="text-xl font-light text-white/50 flex items-center gap-3">
                                        <Lock size={20} />
                                        {t('admin.payouts.monthly_archives_title') || "Archives Mensuelles (Factures ZIP)"}
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {monthlyArchives.map((archive, idx) => (
                                            <div key={idx} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl group hover:border-indigo-500/50 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="text-[10px] font-black text-neutral-500 uppercase">
                                                        {archive.count} {t('admin.payouts.invoices') || "Factures"}
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-white mb-6 uppercase tracking-wider">
                                                    {archive.month}
                                                </div>
                                                <button 
                                                    disabled={isDownloadingZip === archive.month}
                                                    onClick={() => downloadMonthlyInvoicesZip(archive.month)}
                                                    className="w-full bg-white/5 hover:bg-indigo-500 text-white text-[10px] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-500/20 disabled:opacity-50"
                                                >
                                                    {isDownloadingZip === archive.month ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Zap size={14} />
                                                    )}
                                                    {t('admin.payouts.download_zip') || "TÉLÉCHARGER ZIP"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                        <h2 className="text-3xl font-light">{t('admin.reports.title')}</h2>

                        {reports.filter(r => r.status === 'active').length === 0 ? (
                            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-12 text-center text-neutral-500">
                                {t('admin.reports.empty')}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8">
                                {reports.filter(r => r.status === 'active').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((report: any) => (
                                    <div key={report.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500 border border-orange-500/20">
                                                        <AlertCircle size={18} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white capitalize">{t(`report.reason.${report.reason}`)}</h3>
                                                        <p className="text-neutral-500 text-xs font-mono">{new Date(report.timestamp).toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black mb-1">{t('admin.reports.table_reporter')}</p>
                                                        <p className="font-bold text-white tracking-tight">{report.reporterName}</p>
                                                        <p className="text-[10px] text-neutral-500 font-mono italic">{report.reporterEmail}</p>
                                                        <span className="text-[8px] px-1.5 py-0.5 bg-neutral-800 rounded font-black text-neutral-400 mt-2 inline-block uppercase">{report.reporterRole}</span>
                                                    </div>
                                                    <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                                        <p className="text-[10px] text-orange-500 uppercase tracking-widest font-black mb-1">{t('admin.reports.table_reported')}</p>
                                                        <p className="font-bold text-white tracking-tight">{report.reportedName}</p>
                                                        <p className="text-[10px] text-neutral-400 font-mono italic">{report.reportedEmail}</p>
                                                        <span className="text-[8px] px-1.5 py-0.5 bg-orange-500/20 rounded font-black text-orange-500 mt-2 inline-block uppercase">{report.reportedRole}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                                                {report.screenshots?.map((img: string, idx: number) => (
                                                    <div key={idx} className="relative group cursor-zoom-in" onClick={() => setSelectedImage({ images: report.screenshots, index: idx })}>
                                                        <img src={img} className="w-24 h-32 md:w-32 md:h-40 object-cover rounded-xl border border-white/10 hover:brightness-110 transition-all shadow-lg" alt="Report capture" />
                                                        <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-white/5">
                                            <button
                                                onClick={async () => {
                                                    if (confirm(t('admin.reports.confirm_dismiss') || "Ignore this report and close it?")) {
                                                        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/report/admin/${report.id}/dismiss`, { 
                                                            method: "POST", 
                                                            headers: { Authorization: `Bearer ${token}` } 
                                                        });
                                                        fetchReports();
                                                    }
                                                }}
                                                className="flex-1 bg-white/5 hover:bg-white/10 text-neutral-400 font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
                                            >
                                                {t('admin.reports.dismiss_cta')}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(t('admin.reports.confirm_ban', { email: report.reportedEmail }))) {
                                                        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/report/admin/${report.id}/ban`, { 
                                                            method: "POST", 
                                                            headers: { Authorization: `Bearer ${token}` } 
                                                        });
                                                        fetchReports();
                                                    }
                                                }}
                                                className="flex-1 bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                                            >
                                                {t('admin.reports.ban_cta')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'marketing' && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-3xl font-light">{t('admin.nav.marketing')}</h2>
                                <p className="text-neutral-500 text-sm tracking-wide">{marketingTab === 'user' ? t('admin.marketing.intro') : t('admin.marketing.models.intro')}</p>
                            </div>

                            {/* Internal Sub-Tabs */}
                            <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/10 shadow-xl">
                                <button 
                                    onClick={() => setMarketingTab('user')}
                                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${marketingTab === 'user' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Globe size={16} /> {t('admin.marketing.type_user')}
                                </button>
                                <button 
                                    onClick={() => setMarketingTab('model')}
                                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${marketingTab === 'model' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Zap size={16} /> {t('admin.marketing.type_model')}
                                </button>
                            </div>
                        </div>

                        {marketingTab === 'user' ? (
                            <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                                <div className="overflow-x-auto w-full"><table className="w-full text-left whitespace-nowrap md:whitespace-normal">
                                    <thead className="bg-white/[0.02] border-b border-white/5">
                                        <tr>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.source')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.visits')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.signups')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.clients')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.revenue')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.cr_signup')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.cr_client')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em] text-right">{t('admin.marketing.table.arpu')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {marketingUsersStats.length === 0 && (
                                            <tr><td colSpan={8} className="p-12 text-center text-neutral-500 font-medium tracking-wide uppercase text-xs italic">{t('admin.marketing.no_data')}</td></tr>
                                        )}
                                        {[...marketingUsersStats].sort((a,b) => b.revenue - a.revenue || b.visits - a.visits).map((row, i) => {
                                            const crSignup = row.visits > 0 ? (row.signups / row.visits) * 100 : 0;
                                            const crClient = row.signups > 0 ? (row.clients / row.signups) * 100 : 0;
                                            const arpu = row.clients > 0 ? row.revenue / row.clients : 0;

                                            return (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            {row.id === 'direct' ? (
                                                                <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400 border border-white/10 group-hover:bg-neutral-700 transition-colors">
                                                                    <Globe size={16} />
                                                                </div>
                                                            ) : (
                                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                                                    <Zap size={16} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-white tracking-tight">
                                                                    {row.id === 'direct' ? t('admin.marketing.direct') : row.id.replace(/\|/g, ' ')}
                                                                </div>
                                                                <div className="text-[9px] text-neutral-500 font-mono mt-0.5 opacity-50 uppercase tracking-widest">{row.id === 'direct' ? t('admin.marketing.organic_traffic') : t('admin.marketing.tracked_campaign')}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 font-mono text-neutral-300 text-sm font-bold">{row.visits.toLocaleString()}</td>
                                                    <td className="p-6 font-mono text-neutral-300 text-sm font-bold">{row.signups.toLocaleString()}</td>
                                                    <td className="p-6 font-mono text-neutral-400 text-sm font-bold">{row.clients.toLocaleString()}</td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-green-400 text-lg font-black">${row.revenue.toFixed(2)}</span>
                                                            <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                                                                <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (row.revenue / 1000) * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-tighter ${crSignup > 15 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-neutral-500 border-white/10'}`}>
                                                            {crSignup.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-tighter ${crClient > 5 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-neutral-500 border-white/10'}`}>
                                                            {crClient.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right font-mono text-white text-sm font-bold">${arpu.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table></div>
                            </div>
                        ) : (
                            <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                                <div className="overflow-x-auto w-full"><table className="w-full text-left whitespace-nowrap md:whitespace-normal">
                                    <thead className="bg-white/[0.02] border-b border-white/5">
                                        <tr>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.source')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.visits')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.signups')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.marketing.table.validated')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em] text-right">{t('admin.marketing.table.cr_signup')}</th>
                                            <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em] text-right">{t('admin.marketing.table.cr_client')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {marketingModelsStats.length === 0 && (
                                            <tr><td colSpan={6} className="p-12 text-center text-neutral-500 font-medium tracking-wide uppercase text-xs italic">{t('admin.marketing.models.no_data')}</td></tr>
                                        )}
                                        {[...marketingModelsStats].sort((a,b) => b.validated - a.validated || b.visits - a.visits).map((row, i) => {
                                            const crSignup = row.visits > 0 ? (row.signups / row.visits) * 100 : 0;
                                            const crValidation = row.signups > 0 ? (row.validated / row.signups) * 100 : 0;

                                            return (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            {row.id === 'direct' ? (
                                                                <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400 border border-white/10 group-hover:bg-neutral-700 transition-colors">
                                                                    <Globe size={16} />
                                                                </div>
                                                            ) : (
                                                                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 border border-pink-500/20 group-hover:bg-pink-500/20 transition-colors">
                                                                    <Zap size={16} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-white tracking-tight">
                                                                    {row.id === 'direct' ? t('admin.marketing.direct') : row.id.replace(/\|/g, ' ')}
                                                                </div>
                                                                <div className="text-[9px] text-neutral-500 font-mono mt-0.5 opacity-50 uppercase tracking-widest">{row.id === 'direct' ? t('admin.marketing.models.organic_attraction') : t('admin.marketing.models.tracked_recruitment')}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 font-mono text-neutral-300 text-sm font-bold">{row.visits.toLocaleString()}</td>
                                                    <td className="p-6 font-mono text-neutral-300 text-sm font-bold">{row.signups.toLocaleString()}</td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-pink-400 text-lg font-black">{row.validated.toLocaleString()}</span>
                                                            <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                                                                <div className="bg-pink-500 h-full" style={{ width: `${Math.min(100, (row.validated / 10) * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-tighter ${crSignup > 5 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-neutral-500 border-white/10'}`}>
                                                            {crSignup.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-tighter ${crValidation > 20 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-neutral-500 border-white/10'}`}>
                                                            {crValidation.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table></div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'finances' && financesStats && (
                    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-light">{t('admin.finances.title')}</h2>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                                <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t('admin.finances.table.rev_ttc')}</div>
                                <div className="text-2xl font-black text-white">${financesStats.totals.revenue_ttc.toFixed(2)}</div>
                            </div>
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                                <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t('admin.finances.table.rev_ht')}</div>
                                <div className="text-2xl font-black text-neutral-300">${financesStats.totals.revenue_ht.toFixed(2)}</div>
                            </div>
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                                <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t('admin.finances.table.model_gains')}</div>
                                <div className="text-2xl font-black text-pink-400">${financesStats.totals.model_gains.toFixed(2)}</div>
                            </div>
                            <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                                <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t('admin.finances.summary.marketing')}</div>
                                <div className="text-2xl font-black text-orange-400">${financesStats.totals.marketing_expense.toFixed(2)}</div>
                            </div>
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
                                <div className="text-indigo-400/60 text-[10px] uppercase font-bold tracking-widest mb-1">{t('admin.finances.table.profit')}</div>
                                <div className="text-2xl font-black text-indigo-300">${financesStats.totals.net_profit.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                            <div className="overflow-x-auto w-full"><table className="w-full text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.finances.table.month')}</th>
                                        <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.finances.table.rev_ttc')}</th>
                                        <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.finances.table.rev_ht')}</th>
                                        <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.finances.table.model_gains')}</th>
                                        <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.finances.table.marketing')}</th>
                                        <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{t('admin.finances.table.fees')}</th>
                                        <th className="p-6 text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em] text-right">{t('admin.finances.table.profit')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {financesStats.months.length === 0 && (
                                        <tr><td colSpan={6} className="p-12 text-center text-neutral-500 font-medium tracking-wide uppercase text-xs italic">{t('admin.finances.no_data')}</td></tr>
                                    )}
                                    {financesStats.months.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-6 font-bold text-white tracking-tight capitalize">{row.month}</td>
                                            <td className="p-6 font-mono text-neutral-300 text-sm font-bold">${row.revenue_ttc.toFixed(2)}</td>
                                            <td className="p-6 font-mono text-neutral-400 text-sm">{row.revenue_ht.toFixed(2)}</td>
                                            <td className="p-6 font-mono text-pink-400 text-sm font-bold">${row.model_gains.toFixed(2)}</td>
                                            <td className="p-6">
                                                <button 
                                                    onClick={() => updateMarketingExpense(row.month, row.marketing_expense)}
                                                    className="flex flex-col items-start hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group/edit"
                                                >
                                                    <span className="font-mono text-orange-400 text-sm font-bold border-b border-transparent group-hover/edit:border-orange-400/50">${row.marketing_expense.toFixed(2)}</span>
                                                    <span className="text-[8px] text-neutral-600 uppercase font-black tracking-tighter opacity-0 group-hover/edit:opacity-100 transition-opacity">{t('common.edit')}</span>
                                                </button>
                                            </td>
                                            <td className="p-6 font-mono text-neutral-500 text-xs">${row.processor_fees.toFixed(2)}</td>
                                            <td className="p-6 text-right">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-black text-sm ${row.net_profit > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                                                    ${row.net_profit.toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                )}
                {activeTab === 'moderation' && (
                    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500 pb-20">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-light">{t('admin.moderation.title')}</h2>
                            <p className="text-neutral-500 text-sm tracking-wide">
                                {t('admin.moderation.desc')}
                            </p>
                        </div>

                        {/* Add Keyword */}
                        <div className="bg-neutral-900 border border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
                            <h3 className="text-xl font-medium text-red-400 border-b border-white/5 pb-4">{t('admin.moderation.add_keyword')}</h3>
                            <div className="flex gap-4">
                                <input 
                                    type="text" 
                                    placeholder={t('admin.moderation.add_placeholder') || "Ex: paypal, skype, direct..."} 
                                    className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBlocklistAction('add', newKeyword)}
                                />
                                <button 
                                    onClick={() => handleBlocklistAction('add', newKeyword)}
                                    className="bg-red-500 hover:bg-red-400 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
                                >
                                    {t('admin.moderation.block_cta')}
                                </button>
                            </div>
                        </div>

                        {/* Current Blocklist */}
                        <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">{t('admin.moderation.blocked_keywords', { count: blockedKeywords.length })}</h3>
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-tighter animate-pulse flex items-center gap-2">
                                    <ShieldAlert size={12} /> {t('admin.moderation.filter_active')}
                                </div>
                            </div>
                            <div className="p-8">
                                {blockedKeywords.length === 0 ? (
                                    <div className="text-center py-12 text-neutral-600 italic">{t('admin.moderation.no_keywords')}</div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {blockedKeywords.sort().map((word) => (
                                            <div key={word} className="group flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:border-red-500/50 transition-all">
                                                <span className="text-sm font-medium text-neutral-300">{word}</span>
                                                <button 
                                                    onClick={() => handleBlocklistAction('remove', word)}
                                                    className="text-neutral-600 hover:text-red-500 transition-colors"
                                                    title={t('common.delete') || "Supprimer"}
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Auto-filters info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl">
                                <div className="text-indigo-400 mb-2"><Mail size={18} /></div>
                                <div className="text-sm font-bold text-white mb-1">{t('admin.moderation.emails_title')}</div>
                                <p className="text-xs text-neutral-500">{t('admin.moderation.emails_desc')}</p>
                            </div>
                            <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl">
                                <div className="text-pink-400 mb-2"><CheckCircle size={18} /></div>
                                <div className="text-sm font-bold text-white mb-1">{t('admin.moderation.phones_title')}</div>
                                <p className="text-xs text-neutral-500">{t('admin.moderation.phones_desc')}</p>
                            </div>
                            <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl">
                                <div className="text-amber-400 mb-2"><Globe size={18} /></div>
                                <div className="text-sm font-bold text-white mb-1">{t('admin.moderation.urls_title')}</div>
                                <p className="text-xs text-neutral-500">{t('admin.moderation.urls_desc')}</p>
                            </div>
                        </div>
                    </div>
                )}
                </main>
            
            {/* Video Lightbox */}
            {selectedVideo && (
                <div 
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-10 animate-in fade-in duration-300 pointer-events-auto"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div className="relative max-w-4xl w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
                        <div className="w-full bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)] border border-white/10">
                            <video 
                                src={selectedVideo} 
                                controls 
                                autoPlay 
                                className="w-full max-h-[70vh] object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Top controls - Consistent with Photo Lightbox */}
                        <button 
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-0 right-0 -mt-14 md:-mr-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white border border-white/10 shadow-xl"
                        >
                            <XCircle size={32} />
                        </button>

                        <div className="mt-6 flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full animate-in slide-in-from-bottom-4 duration-500">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,1)]" />
                            <span className="text-indigo-300 font-black text-xs uppercase tracking-widest">Lecture Teaser</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Photo Lightbox */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-300 pointer-events-auto"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300 group/lb">
                        {/* Navigation Arrows */}
                        <button 
                            className="absolute left-0 md:-left-20 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all hover:scale-110 active:scale-95 z-50 group"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage({
                                    ...selectedImage,
                                    index: (selectedImage.index - 1 + selectedImage.images.length) % selectedImage.images.length
                                });
                            }}
                        >
                            <ChevronLeft size={32} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <button 
                            className="absolute right-0 md:-right-20 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all hover:scale-110 active:scale-95 z-50 group"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage({
                                    ...selectedImage,
                                    index: (selectedImage.index + 1) % selectedImage.images.length
                                });
                            }}
                        >
                            <ChevronRight size={32} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <img 
                            src={typeof selectedImage.images[selectedImage.index] === 'string' ? (selectedImage.images[selectedImage.index] as any) : (selectedImage.images[selectedImage.index] as any).url} 
                            alt="Enlarged view" 
                            className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-3xl border border-white/10"
                            onClick={(e) => e.stopPropagation()} 
                        />

                        {typeof selectedImage.images[selectedImage.index] !== 'string' && (selectedImage.images[selectedImage.index] as any).label && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 bg-pink-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl animate-in slide-in-from-top-4 duration-300">
                                {(selectedImage.images[selectedImage.index] as any).label}
                                </div>
                        )}
                        
                        {/* Info / Close */}
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-0 right-0 -mt-14 md:-mt-8 md:-mr-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white border border-white/10"
                        >
                            <XCircle size={32} />
                        </button>

                        {/* Pagination indicator */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12 flex gap-2">
                            {selectedImage.images.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === selectedImage.index ? 'bg-pink-500 w-8 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/20'}`} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Review Modal */}
            {reviewModalOpen && reviewMethod && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-neutral-900 border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl text-indigo-400">
                                    {reviewMethod === 'bank' ? <Landmark size={24} /> : reviewMethod === 'crypto' ? <Wallet size={24} /> : <Mail size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold uppercase tracking-tighter">
                                        Payout Review: {reviewMethod.toUpperCase()}
                                    </h4>
                                    <p className="text-xs text-neutral-500 font-medium">
                                        {reviewSection === 'ready' ? "Dernière Semaine (Ready to Pay)" : "Semaine en cours (Ongoing)"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setReviewModalOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {payoutRequests.filter(p => {
                                const isMethod = p.method === reviewMethod;
                                const date = new Date(p.createdAt);
                                const cutoff = new Date(payoutSummary.cutoff);
                                const isReady = date <= cutoff;
                                return isMethod && (reviewSection === 'ready' ? isReady : !isReady);
                            }).length === 0 ? (
                                <div className="py-20 text-center text-neutral-500 italic">Aucune transaction trouvée pour ce filtre.</div>
                            ) : (
                                payoutRequests.filter(p => {
                                    const isMethod = p.method === reviewMethod;
                                    const date = new Date(p.createdAt);
                                    const cutoff = new Date(payoutSummary.cutoff);
                                    const isReady = date <= cutoff;
                                    return isMethod && (reviewSection === 'ready' ? isReady : !isReady);
                                }).map((p, i) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-all">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-white text-lg">{p.billingInfo.name}</span>
                                                <span className="text-[10px] bg-white/5 text-neutral-500 px-2 py-0.5 rounded-full border border-white/5">{p.modelEmail}</span>
                                            </div>
                                            <div className="text-xs text-neutral-400 space-y-1 font-medium bg-black/20 p-3 rounded-xl border border-white/5">
                                                {p.method === 'bank' && (
                                                    <div className="grid grid-cols-2 gap-x-4">
                                                        <div><span className="text-neutral-600 block text-[9px] uppercase font-black">IBAN</span> <span className="font-mono text-white tracking-tighter">{p.billingInfo.bankIban}</span></div>
                                                        <div><span className="text-neutral-600 block text-[9px] uppercase font-black">SWIFT/BIC</span> <span className="font-mono text-white tracking-tighter">{p.billingInfo.bankSwift || p.billingInfo.bankBic}</span></div>
                                                    </div>
                                                )}
                                                {p.method === 'crypto' && (
                                                    <div><span className="text-neutral-600 block text-[9px] uppercase font-black">Polygon Wallet (USDC)</span> <span className="font-mono text-white break-all">{p.billingInfo.cryptoAddress}</span></div>
                                                )}
                                                {p.method === 'paxum' && (
                                                    <div><span className="text-neutral-600 block text-[9px] uppercase font-black">Paxum Email</span> <span className="font-mono text-white">{p.billingInfo.paxumEmail || p.billingInfo.email}</span></div>
                                                )}
                                                <div className="pt-2 mt-2 border-t border-white/5 text-[9px] opacity-40 uppercase tracking-widest italic">
                                                    {p.billingInfo.address}, {p.billingInfo.country}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center md:items-end gap-3 min-w-[120px]">
                                            <div className="text-2xl font-black text-green-400 font-mono italic underline decoration-green-900/50 decoration-4">
                                                ${p.amount.toFixed(2)}
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => postponePayout(p.id)}
                                                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/20 transition-all flex items-center justify-center gap-2 text-[10px] font-bold"
                                                    title="Reporter à la semaine prochaine"
                                                >
                                                    <Clock size={14} /> REPORTER
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        if (confirm(t('admin.payouts.confirm_reject') || "Reject this payout and refund the balance?")) {
                                                            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/${p.id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                            fetchPayoutRequests();
                                                        }
                                                    }}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2 text-[10px] font-bold"
                                                    title="Rejeter et rembourser"
                                                >
                                                    <XCircle size={14} /> REJETER
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">
                                Transaction review system powered by Lively Admin
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
