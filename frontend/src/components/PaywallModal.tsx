import { useState, useEffect } from "react";
import Image from "next/image";
import { CreditCard, X, Coins, Check, ShieldCheck, Zap, Heart } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface PaywallModalProps {
    onClose: () => void;
    onPurchase: (credits: number, priceUsd: number) => void;
    packs?: any[];
}

const PROFILES = [
    { id: 1, img: "/assets/profiles/p1.png", name: "Elena" },
    { id: 2, img: "/assets/profiles/p2.png", name: "Zoya" },
    { id: 3, img: "/assets/profiles/p3.png", name: "Mei" },
    { id: 4, img: "/assets/profiles/p4.png", name: "Layla" },
    { id: 5, img: "/assets/profiles/p5.png", name: "Jade" },
    { id: 6, img: "/assets/profiles/p6.png", name: "Amira" },
];

export function PaywallModal({ onClose, onPurchase, packs: propPacks = [] }: PaywallModalProps) {
    const { t } = useTranslation();
    const [selectedPack, setSelectedPack] = useState(0);
    const [internalPacks, setInternalPacks] = useState<any[]>([]);
    const [creditsPerMinute, setCreditsPerMinute] = useState(10);
    const [isInitialSet, setIsInitialSet] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const packs = propPacks.length > 0 ? propPacks : internalPacks;

    useEffect(() => {
        // Fallback fetch if propPacks is empty
        if (propPacks.length === 0) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/settings`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.packs) {
                        setInternalPacks(data.packs);
                    }
                    if (data && data.creditsPerMinute) {
                        setCreditsPerMinute(data.creditsPerMinute);
                    }
                })
                .catch(console.error);
        }
    }, [propPacks]);

    useEffect(() => {
        if (packs.length > 0 && !isInitialSet) {
            setSelectedPack(packs[1]?.credits || packs[0]?.credits || 350);
            setIsInitialSet(true);
        }
    }, [packs, isInitialSet]);

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
                        <div className="flex flex-row items-center justify-between mb-2 md:mb-6">
                            <h3 className="text-sm md:text-lg font-bold text-white flex items-center gap-2 m-0">
                                <Heart size={16} className="text-pink-500 fill-pink-500" /> <span className="whitespace-nowrap">{t('paywall.members')}</span>
                            </h3>

                            {/* Profiles List Mobile (Overlap) */}
                            <div className="flex md:hidden -space-x-2 relative">
                                {PROFILES.slice(0, 4).map((p, i) => (
                                    <div key={p.id} className="relative w-7 h-7 rounded-full border-2 border-[#161616] overflow-hidden z-10">
                                        <Image src={p.img} alt={p.name} fill className="object-cover" />
                                    </div>
                                ))}
                                <div className="relative w-7 h-7 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-[10px] font-bold text-cyan-400 bg-[#161616] z-0">
                                    +14
                                </div>
                            </div>
                        </div>

                        {/* Profiles List Desktop */}
                        <div className="hidden md:grid md:grid-cols-2 gap-3 pb-0">
                            {PROFILES.map(p => (
                                <div key={p.id} className="relative group cursor-pointer flex-shrink-0 w-auto">
                                    <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 group-hover:border-pink-500/50 transition-all duration-300 relative">
                                        <Image src={p.img} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
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
                <div className="flex-1 p-4 md:p-10 flex flex-col relative overflow-y-auto">
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-2 right-2 md:top-4 md:right-4 p-2 text-white/20 hover:text-white transition-colors z-20">
                        <X size={24} />
                    </button>

                    <div className="mb-4 md:mb-10 mt-6 md:mt-0">
                        <h2 className="text-xl md:text-4xl font-black text-white mb-1 md:mb-2 tracking-tighter leading-tight pr-8 md:pr-10">
                            {t('paywall.title_line1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">{t('paywall.title_line2')}</span>
                        </h2>
                        <p className="text-white/50 text-[11px] md:text-sm max-w-md line-clamp-2 md:line-clamp-none leading-snug">
                            {t('paywall.desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
                        {[pack1, pack2, pack3].filter(Boolean).map((pack, idx) => {
                            const isSelected = selectedPack === pack.credits;
                            const isPopular = idx === 1;
                            const isElite = idx === 2;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedPack(pack.credits)}
                                    className={`relative group cursor-pointer rounded-2xl flex flex-col items-center justify-between md:rounded-3xl p-3 md:p-7 transition-all duration-500 border overflow-hidden ${isSelected
                                        ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] md:shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-[1.02] md:scale-105 z-10'
                                        : 'bg-white/[0.07] border-white/10 hover:border-white/20 hover:bg-white/[0.1] scale-100'
                                        }`}
                                >
                                    {isPopular && !isSelected && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/20 to-purple-600/20" />
                                    )}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 md:top-3 md:right-3 w-4 h-4 md:w-5 md:h-5 bg-indigo-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                            <Check size={10} className="text-white fill-white md:w-3 md:h-3" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center gap-[2px] w-full text-center mt-1 md:mt-0">
                                        <span className={`text-[8px] md:text-[10px] font-black uppercase md:tracking-[0.2em] tracking-wider mb-1 md:mb-2 truncate w-full ${isSelected ? '' : 'opacity-50'} ${idx === 0 ? 'text-white/40' : idx === 1 ? 'text-indigo-400' : 'text-pink-400'}`}>
                                            {idx === 0 ? t('paywall.pack_essential') : idx === 1 ? t('paywall.pack_popular') : t('paywall.pack_elite')}
                                        </span>
                                        <div className="flex items-center justify-center gap-1 md:gap-2 mb-1">
                                            <span className={`text-[19px] md:text-3xl font-black transition-colors leading-none ${isSelected ? 'text-white' : 'text-white'}`}>{pack.credits}</span>
                                            <Coins size={14} className={`${isSelected ? 'text-yellow-400' : 'text-yellow-400'} md:w-6 md:h-6 transition-colors`} />
                                        </div>
                                        <div className={`text-[9px] md:text-xs font-bold mb-1 transition-colors px-1.5 md:px-2 py-0.5 rounded-full mt-1 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-white/40'}`}>
                                            {Math.round(pack.credits / creditsPerMinute)} min
                                        </div>
                                    </div>
                                    
                                    <span className={`font-black text-[11px] md:text-sm transition-colors mt-3 ${isSelected ? 'text-white/90' : 'text-white/60'}`}>${pack.priceUsd.toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Unified CTA */}
                    <div className="mt-auto md:mt-6 space-y-3 max-w-sm w-full mx-auto md:mx-0 shrink-0">
                        <button
                            onClick={async () => {
                                if (isPurchasing) return;
                                setIsPurchasing(true);
                                try {
                                    const pack = packs.find(p => p.credits === selectedPack);
                                    await onPurchase(selectedPack, pack?.priceUsd || 0);
                                } finally {
                                    setIsPurchasing(false);
                                }
                            }}
                            disabled={isPurchasing}
                            className="w-full py-3 md:py-5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-sm md:text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] md:shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPurchasing ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                t('paywall.cta')
                            )}
                        </button>

                        <p className="text-[10px] md:text-[11px] text-center text-white/50 font-bold uppercase md:tracking-widest tracking-wider mt-2 pb-1">
                            {t('paywall.footer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
