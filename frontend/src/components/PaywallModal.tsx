import { useState, useEffect } from "react";
import { CreditCard, X, Coins, Check, ShieldCheck, Zap, Heart } from "lucide-react";

interface PaywallModalProps {
    onClose: () => void;
    onPurchase: (credits: number) => void;
}

const PROFILES = [
    { id: 1, img: "/assets/profiles/p1.png", name: "Elena" },
    { id: 2, img: "/assets/profiles/p2.png", name: "Sophie" },
    { id: 3, img: "/assets/profiles/p3.png", name: "Clara" },
    { id: 4, img: "/assets/profiles/p4.png", name: "Mélissa" },
    { id: 5, img: "/assets/profiles/p5.png", name: "Jade" },
    { id: 6, img: "/assets/profiles/p6.png", name: "Léa" },
];

export function PaywallModal({ onClose, onPurchase }: PaywallModalProps) {
    const [selectedPack, setSelectedPack] = useState(300);
    const [packs, setPacks] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/settings`)
            .then(res => res.json())
            .then(data => {
                if (data && data.packs) {
                    setPacks(data.packs);
                    setSelectedPack(data.packs[1]?.credits || 300);
                }
            })
            .catch(console.error);
    }, []);

    const pack1 = packs[0] || { name: 'Essentiel', credits: 100, priceUsd: 9.99 };
    const pack2 = packs[1] || { name: 'Premium', credits: 300, priceUsd: 24.99 };
    const pack3 = packs[2] || { name: 'Privilège', credits: 1300, priceUsd: 99.99 };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            {/* Dark Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={onClose} />

            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden max-w-4xl w-full shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in duration-300 max-h-[95dvh] flex flex-col md:flex-row">

                {/* Left Side: Visuals & Social Proof (Hidden on small mobile if needed, but here we keep it) */}
                <div className="hidden md:flex flex-col w-1/3 bg-neutral-900/50 border-r border-white/5 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="z-10">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Heart size={20} className="text-pink-500 fill-pink-500" /> Community
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {PROFILES.map(p => (
                                <div key={p.id} className="relative group cursor-pointer">
                                    <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 group-hover:border-pink-500/50 transition-all duration-300">
                                        <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </div>
                                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-neutral-900" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Discrétion Totale</p>
                                    <p className="text-[10px] text-white/40">Aucune mention "Kinky" sur vos relevés.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Accès Instantané</p>
                                    <p className="text-[10px] text-white/40">Vos crédits sont valables à vie.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: The Offer */}
                <div className="flex-1 p-6 md:p-10 flex flex-col relative">
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors z-20">
                        <X size={24} />
                    </button>

                    <div className="mb-8 md:mb-12">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tighter leading-tight">
                            Profitez pleinement de <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">KINKY.</span>
                        </h2>
                        <p className="text-white/40 text-sm md:text-base max-w-md">
                            Achetez des minutes pour des rencontres sans limites. Pas d'abonnement. Pas de frais récurrents.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 md:mb-12">
                        {[pack1, pack2, pack3].map((pack, idx) => {
                            const isSelected = selectedPack === pack.credits;
                            const isPremium = idx === 1;
                            const isPrivilege = idx === 2;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedPack(pack.credits)}
                                    className={`relative group cursor-pointer rounded-3xl p-6 transition-all duration-500 border overflow-hidden ${isSelected
                                            ? 'bg-neutral-800/80 border-indigo-500/50 shadow-2xl scale-105 z-10'
                                            : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    {isPremium && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
                                    )}
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isPremium ? 'text-indigo-400' : isPrivilege ? 'text-pink-400' : 'text-white/40'}`}>
                                            {idx === 0 ? 'Essentiel' : idx === 1 ? 'Populaire' : 'Elite'}
                                        </span>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-3xl md:text-4xl font-black text-white">{pack.credits}</span>
                                            <Coins size={24} className="text-yellow-400 fill-yellow-500/20" />
                                        </div>
                                        <span className="text-white/40 font-bold text-sm">${pack.priceUsd.toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-4 max-w-sm w-full mx-auto md:mx-0">
                        <button
                            onClick={() => onPurchase(selectedPack)}
                            className="w-full py-5 rounded-2xl bg-white text-black font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 group"
                        >
                            <span className="text-2xl"></span> Payer avec Apple Pay
                        </button>
                        <button
                            onClick={() => onPurchase(selectedPack)}
                            className="w-full py-5 rounded-2xl bg-neutral-800 border border-white/10 text-white font-black text-lg hover:bg-neutral-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <CreditCard size={22} className="text-white/60" /> Carte Bancaire
                        </button>
                        <p className="text-[9px] text-center text-white/20 font-bold uppercase tracking-widest mt-4">
                            Paiement 100% sécurisé • Pas d'abonnement
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
