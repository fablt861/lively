import { useState, useEffect } from "react";
import { CreditCard, X, Coins, Check, ShieldCheck, Zap, Heart } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface PaywallModalProps {
    onClose: () => void;
    onPurchase: (credits: number, priceUsd: number) => void;
    packs?: any[];
}

const PROFILES = [
    { id: 1, img: "/assets/profiles/p1.png", name: "Elena" },
    { id: 2, img: "/assets/profiles/p2.png", name: "Sophie" },
    { id: 3, img: "/assets/profiles/p3.png", name: "Clara" },
    { id: 4, img: "/assets/profiles/p4.png", name: "Mélissa" },
    { id: 5, img: "/assets/profiles/p5.png", name: "Jade" },
    { id: 6, img: "/assets/profiles/p6.png", name: "Léa" },
];

export function PaywallModal({ onClose, onPurchase, packs = [] }: PaywallModalProps) {
    const { t } = useTranslation();
    const [selectedPack, setSelectedPack] = useState(300);

    useEffect(() => {
        if (packs.length > 0 && selectedPack === 300) {
            setSelectedPack(packs[1]?.credits || packs[0]?.credits || 300);
        }
    }, [packs]);

    if (!packs || packs.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" onClick={onClose} />
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-12 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const pack1 = packs[0];
    const pack2 = packs[1];
    const pack3 = packs[2];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
            {/* Dark Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={onClose} />

            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden max-w-4xl w-full shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in duration-300 max-h-[95dvh] flex flex-col md:flex-row">

                {/* Left Side: Community & Social Proof */}
                <div className="flex flex-col md:w-1/3 bg-neutral-900/50 border-r border-white/5 p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="z-10 h-full flex flex-col">
                        <h3 className="text-sm md:text-lg font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                            <Heart size={16} className="text-pink-500 fill-pink-500" /> {t('paywall.members')}
                        </h3>

                        {/* Profiles List (Horizontal on mobile, Grid on desktop) */}
                        <div className="flex flex-row md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
                            {PROFILES.map(p => (
                                <div key={p.id} className="relative group cursor-pointer flex-shrink-0 w-16 md:w-auto">
                                    <div className="aspect-square rounded-xl md:rounded-2xl overflow-hidden border border-white/10 group-hover:border-pink-500/50 transition-all duration-300">
                                        <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </div>
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-neutral-900" />
                                </div>
                            ))}
                        </div>

                        {/* Perks (Hidden on small mobile) */}
                        <div className="mt-auto hidden md:block space-y-4 pt-6 border-t border-white/5">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider mb-0.5">{t('paywall.discretion_title')}</p>
                                    <p className="text-[9px] text-white/40">{t('paywall.discretion_desc')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider mb-0.5">{t('paywall.speed_title')}</p>
                                    <p className="text-[9px] text-white/40">{t('paywall.speed_desc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: The Offer */}
                <div className="flex-1 p-6 md:p-10 flex flex-col relative overflow-y-auto">
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors z-20">
                        <X size={24} />
                    </button>

                    <div className="mb-6 md:mb-10">
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-2 tracking-tighter leading-tight pr-10">
                            {t('paywall.title_line1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">{t('paywall.title_line2')}</span>
                        </h2>
                        <p className="text-white/40 text-xs md:text-sm max-w-md">
                            {t('paywall.desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
                        {[pack1, pack2, pack3].filter(Boolean).map((pack, idx) => {
                            const isSelected = selectedPack === pack.credits;
                            const isPremium = idx === 1;
                            const isPrivilege = idx === 2;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedPack(pack.credits)}
                                    className={`relative group cursor-pointer rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all duration-300 border overflow-hidden ${isSelected
                                        ? 'bg-neutral-800/80 border-indigo-500/50 shadow-2xl scale-[1.02] md:scale-105 z-10'
                                        : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    {isPremium && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
                                    )}
                                    <div className="flex flex-col items-center gap-1 text-center">
                                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-2 ${isPremium ? 'text-indigo-400' : isPrivilege ? 'text-pink-400' : 'text-white/40'}`}>
                                            {idx === 0 ? t('paywall.pack_essential') : idx === 1 ? t('paywall.pack_popular') : t('paywall.pack_elite')}
                                        </span>
                                        <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                                            <span className="text-2xl md:text-3xl font-black text-white">{pack.credits}</span>
                                            <Coins size={20} className="text-yellow-400 md:w-6 md:h-6" />
                                        </div>
                                        <span className="text-white/40 font-bold text-xs md:text-sm">${pack.priceUsd.toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Unified CTA */}
                    <div className="mt-auto space-y-4 max-w-sm w-full mx-auto md:mx-0">
                        <button
                            onClick={() => {
                                const pack = packs.find(p => p.credits === selectedPack);
                                onPurchase(selectedPack, pack?.priceUsd || 0);
                            }}
                            className="w-full py-4 md:py-5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-center group"
                        >
                            {t('paywall.cta')}
                        </button>

                        <p className="text-[8px] md:text-[9px] text-center text-white/20 font-bold uppercase tracking-widest mt-4">
                            {t('paywall.footer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
