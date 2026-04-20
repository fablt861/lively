"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { User, Wallet, Heart, Settings, Trash2, CreditCard, ChevronRight, Star, Zap } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { PaywallModal } from "@/components/PaywallModal";
import { io, Socket } from "socket.io-client";
import { Phone, PhoneOff, X, LogOut } from "lucide-react";
import { DirectCallRestrictionModal } from "@/components/DirectCallRestrictionModal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live";

interface FavoriteModel {
    id: string;
    pseudo: string;
    photo_profile: string;
    isOnline?: boolean;
    isBusy?: boolean;
    isPrivate?: boolean;
}

interface UserInfo {
    id: string;
    email: string;
    pseudo: string;
    credits: number;
}

export default function CustomerDashboard() {
    const { t, language } = useTranslation();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [favorites, setFavorites] = useState<FavoriteModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [callingModel, setCallingModel] = useState<FavoriteModel | null>(null);
    const [callStatus, setCallStatus] = useState<'calling' | 'rejected' | 'accepted' | 'no_answer' | null>(null);
    const [showRestrictionModal, setShowRestrictionModal] = useState(false);
    const [restrictionModel, setRestrictionModel] = useState<FavoriteModel | null>(null);
    const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);
        
        newSocket.on('direct_call_accepted', ({ roomId }) => {
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
            setCallStatus('accepted');
            setTimeout(() => {
                window.location.href = `/${language}/live?room=${roomId}&init=true`;
            }, 1500);
        });

        newSocket.on('direct_call_rejected', () => {
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
            setCallStatus('rejected');
            setTimeout(() => {
                setCallingModel(null);
                setCallStatus(null);
            }, 3000);
        });

        newSocket.on('direct_call_error', ({ reason }) => {
            if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
            if (reason === 'insufficient_credits') {
                setShowPaywall(true);
            }
            setCallingModel(null);
            setCallStatus(null);
        });

        return () => {
            newSocket.disconnect();
        }
    }, [language]);

    useEffect(() => {
        const email = localStorage.getItem('kinky_user_email');
        const id = localStorage.getItem('kinky_user_id');
        setUserEmail(email);
        setUserId(id);
    }, []);

    const fetchUserInfo = () => {
        if (!userId && !userEmail) return;
        const queryParam = userId ? `id=${userId}` : `email=${userEmail}`;
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/auth/me?${queryParam}`)
            .then(res => res.json())
            .then(data => {
                setUserInfo(data);
                if (data.id) {
                    setUserId(data.id);
                    localStorage.setItem('kinky_user_id', data.id);
                }
                if (data.credits !== undefined) {
                    localStorage.setItem('kinky_credits', data.credits.toString());
                }
            })
            .catch(console.error);
    };

    const fetchFavorites = () => {
        if (!userId) return;
        fetch(`${BACKEND_URL}/api/favorites/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Sort: Online models first
                    const sorted = [...data].sort((a, b) => {
                        if (a.isOnline === b.isOnline) return 0;
                        return a.isOnline ? -1 : 1;
                    });
                    setFavorites(sorted);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (userId) {
            fetchUserInfo();
            fetchFavorites();

            const interval = setInterval(() => {
                // Only fetch if the page is visible to save bandwidth/battery
                if (document.visibilityState === 'visible') {
                    fetchFavorites();
                }
            }, 15000);

            // Handle visibility change immediately
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    fetchFavorites();
                }
            };
            document.addEventListener("visibilitychange", handleVisibilityChange);

            return () => {
                clearInterval(interval);
                document.removeEventListener("visibilitychange", handleVisibilityChange);
            };
        }
    }, [userId]);

    const handleRemoveFavorite = async (modelId: string) => {
        if (!userId) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/favorites/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, modelId })
            });
            if (res.ok) {
                setFavorites(prev => prev.filter(f => f.id !== modelId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePurchase = async (credits: number, priceUsd: number) => {
        if (!userId && !userEmail) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/auth/add-credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: userId, 
                    email: userEmail, 
                    amount: credits, 
                    priceUsd 
                })
            });
            if (res.ok) {
                setShowPaywall(false);
                fetchUserInfo();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDirectCall = (model: FavoriteModel) => {
        if (!userInfo || userInfo.credits < 150) {
            setRestrictionModel(model);
            setShowRestrictionModal(true);
            return;
        }
        if (!socket) return;

        setCallingModel(model);
        setCallStatus('calling');

        socket.emit('direct_call_request', {
            targetId: model.id,
            userId: userInfo.id,
            userPseudo: userInfo.pseudo
        });

        // Set 20s timeout
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = setTimeout(() => {
            setCallStatus('no_answer');
            socket.emit('direct_call_cancel', { targetId: model.id });
            setTimeout(() => {
                setCallingModel(null);
                setCallStatus(null);
            }, 4000);
        }, 20000);
    };

    const handleCancelCall = () => {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        if (socket && callingModel) {
            socket.emit('direct_call_cancel', { targetId: callingModel.id });
        }
        setCallingModel(null);
        setCallStatus(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('kinky_token');
        localStorage.removeItem('kinky_user_id');
        localStorage.removeItem('kinky_user_pseudo');
        localStorage.removeItem('kinky_user_email');
        localStorage.removeItem('kinky_user_role');
        localStorage.removeItem('kinky_account_status');
        localStorage.removeItem('kinky_credits');
        localStorage.removeItem('kinky_role'); // Legacy cleanup
        localStorage.removeItem('kinky_email'); // Legacy cleanup
        window.location.href = `/${language}/`;
    };

    const handleProfileUpdate = (newId: string | undefined, newEmail: string, newPseudo: string) => {
        if (newId) localStorage.setItem('kinky_user_id', newId);
        localStorage.setItem('kinky_user_email', newEmail);
        localStorage.setItem('kinky_user_pseudo', newPseudo);
        if (newEmail !== userEmail) {
            setUserEmail(newEmail);
            window.location.reload();
        } else {
            setUserInfo(prev => prev ? { ...prev, email: newEmail, pseudo: newPseudo } : prev);
        }
    };

    if (!userEmail) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/40">{t('dashboard.history_loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-indigo-500/30">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden gpu-accelerated">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:px-12 lg:py-20">
                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-neutral-900 border-2 border-white/10 overflow-hidden ring-4 ring-indigo-500/10 ring-offset-4 ring-offset-neutral-950 shadow-2xl flex items-center justify-center">
                            <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-black">
                                {(userInfo?.pseudo || "U").substring(0, 1).toUpperCase()}
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <h2 className="text-3xl md:text-5xl font-extralight text-white/50 leading-none">{t('nav.welcome')} <span className="font-black text-white">{userInfo?.pseudo || "..."}</span></h2>
                            <p className="text-xs md:text-sm text-neutral-500 font-medium tracking-wide uppercase mt-2">{t('profile.manage_desc')}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                        <LanguageSelector />
                        <button
                            onClick={handleLogout}
                            className="px-6 py-4 bg-white/5 hover:bg-red-500/10 border border-white/10 text-white/60 hover:text-red-500 rounded-full transition-all duration-300 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 w-full sm:w-auto text-center active:scale-[0.98]"
                        >
                            <LogOut size={18} /> {t('nav.logout')}
                        </button>
                        <button
                            onClick={() => window.location.href = `/${language}/live`}
                            className="px-8 py-4 bg-gradient-to-tr from-pink-500 to-violet-500 hover:scale-105 active:scale-95 text-white rounded-full transition-all duration-300 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 w-full sm:w-auto text-center shadow-lg shadow-pink-500/20"
                        >
                            {t('dashboard.start_chatting') || "Start Chatting"} <ChevronRight size={18} />
                        </button>
                    </div>
                </header>

                {/* Grid Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Wallet Card */}
                    <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 via-purple-900/10 to-neutral-900 border border-indigo-500/20 p-8 md:p-10 shadow-2xl flex items-center group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-80" />
                        
                        <div className="flex-1 relative z-10">
                            <div className="flex items-center gap-3 text-indigo-300 mb-4">
                                <Wallet size={20} />
                                <span className="font-bold tracking-[0.2em] uppercase text-xs">{t('nav.menu.balance_label')}</span>
                            </div>
                            <div className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter">
                                {userInfo?.credits?.toFixed(0) || "0"}<span className="text-xl md:text-2xl text-white/40 ml-4 font-light uppercase tracking-[0.3em]">{t('common.credits')}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button 
                                    onClick={() => setShowPaywall(true)}
                                    className="group flex items-center justify-center gap-4 bg-white text-black px-10 py-5 rounded-full font-black text-base transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 w-full sm:w-auto"
                                >
                                    <CreditCard size={20} /> {t('nav.menu.buy')}
                                </button>
                                <button
                                    onClick={() => setIsProfileOpen(true)}
                                    className="group flex items-center justify-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-full font-black text-base transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
                                >
                                    <Settings size={20} className="text-indigo-400" /> {t('dashboard.profile_settings_title')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Favorites Mini Stat */}
                    <div className="rounded-[2.5rem] bg-neutral-900/50 border border-white/5 backdrop-blur-md p-8 md:p-10 flex flex-col justify-center items-center text-center group">
                        <div className="w-16 h-16 rounded-3xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-6 group-hover:scale-110 transition-transform">
                            <Heart size={32} />
                        </div>
                        <div className="text-4xl md:text-5xl font-black text-white mb-2">
                            {favorites.length}
                        </div>
                        <span className="font-bold tracking-[0.2em] uppercase text-[10px] text-white/40">{t('dashboard.favorites_title') || "FAVORITES"}</span>
                    </div>
                </div>

                {/* Favorites Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-500">
                            <Heart size={24} fill="currentColor" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black tracking-tight">{t('dashboard.favorites_title') || "Ma Liste de Favorites"}</h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-[3/4] rounded-[2rem] bg-white/5 animate-pulse border border-white/10" />
                            ))}
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-16 text-center">
                            <Heart size={48} className="mx-auto text-white/10 mb-6" />
                            <p className="text-xl text-white/40 font-medium mb-4">{t('dashboard.favorites_empty') || "Vous n'avez pas encore de modèles favorites."}</p>
                            <button 
                                onClick={() => window.location.href = `/${language}/live`}
                                className="text-indigo-400 font-bold uppercase tracking-widest text-xs hover:text-indigo-300 transition-colors"
                            >
                                {t('hero.cta')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {favorites.map((model) => (
                                <div key={model.id} className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl transition-all duration-500 hover:border-indigo-500/50 hover:-translate-y-2">
                                    <div className="relative w-full h-full">
                                        <Image 
                                            src={model.photo_profile || "/images/avatars/model_1.png"} 
                                            alt={model.pseudo}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            className="object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                                            priority={favorites.indexOf(model) < 4}
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                    
                                    <div className="absolute top-4 right-4 z-20">
                                        <button 
                                            onClick={() => handleRemoveFavorite(model.id)}
                                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-red-500 hover:bg-white transition-all transform hover:rotate-12"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-2 h-2 rounded-full ${model.isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500/50'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${model.isOnline ? 'text-white/60' : 'text-white/30'}`}>
                                                {model.isOnline ? t('gauge.live') : t('common.offline')}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors">{model.pseudo}</h3>
                                        {model.isOnline && (
                                            model.isPrivate ? (
                                                <div className="mt-4 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                                    {t('dashboard.model_busy') || "EN SESSION PRIVÉE"} <Zap size={10} fill="currentColor" />
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleDirectCall(model)}
                                                    className="mt-5 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.97] group/btn"
                                                >
                                                    <Phone size={14} className="fill-current" />
                                                    {t('dashboard.join')}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ProfileSettingsModal 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                userId={userId!}
                role="user"
                onProfileUpdate={handleProfileUpdate}
            />

            {showRestrictionModal && (
                <DirectCallRestrictionModal 
                    isOpen={showRestrictionModal}
                    onClose={() => setShowRestrictionModal(false)}
                    onBuyCredits={() => {
                        setShowRestrictionModal(false);
                        setShowPaywall(true);
                    }}
                    modelName={restrictionModel?.pseudo || ""}
                    requiredCredits={150}
                />
            )}
            {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} onPurchase={handlePurchase} />}

            {/* Calling Overlay */}
            {callingModel && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[100px] opacity-20 animate-pulse" />
                        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl mb-12 transform hover:scale-105 transition-transform duration-700">
                            <Image 
                                src={callingModel.photo_profile || "/images/avatars/model_1.png"} 
                                alt={callingModel.pseudo}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        
                        {/* Pulse Ring */}
                        {callStatus === 'calling' && (
                            <>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-white/5 rounded-full animate-ping" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full animate-ping [animation-delay:0.5s]" />
                            </>
                        )}
                    </div>

                    <div className="text-center space-y-4 max-w-md px-6">
                        <h3 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2 uppercase">
                            {callStatus === 'calling' ? t('direct_call.status.calling') : 
                             callStatus === 'rejected' ? t('direct_call.status.busy') : 
                             callStatus === 'no_answer' ? t('direct_call.status.no_answer') :
                             t('direct_call.status.accepted')}
                        </h3>
                        <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-sm md:text-base">
                            {callingModel.pseudo}
                        </p>
                        <p className="text-white/40 text-xs md:text-sm font-medium leading-relaxed mt-4">
                            {callStatus === 'calling' ? t('direct_call.desc.calling') :
                             callStatus === 'rejected' ? t('direct_call.desc.busy') :
                             callStatus === 'no_answer' ? t('direct_call.desc.no_answer') :
                             t('direct_call.desc.accepted')}
                        </p>
                    </div>

                    <div className="mt-16">
                        {callStatus === 'calling' ? (
                            <button 
                                onClick={handleCancelCall}
                                className="group flex items-center gap-4 bg-red-500/10 border border-red-500/20 text-red-500 px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all duration-300 transform active:scale-95"
                            >
                                <PhoneOff size={20} /> {t('direct_call.action.cancel')}
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setCallingModel(null); setCallStatus(null); }}
                                className="flex items-center gap-4 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                            >
                                <X size={20} /> {t('common.close')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
