import { useState, useEffect } from "react";
import { CreditCard, X, Coins } from "lucide-react";

interface PaywallModalProps {
    onClose: () => void;
    onPurchase: (credits: number) => void;
}

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

    const pack1 = packs[0] || { name: 'Essential', credits: 100, priceUsd: 9.99 };
    const pack2 = packs[1] || { name: 'Premium', credits: 300, priceUsd: 24.99 };
    const pack3 = packs[2] || { name: 'Privilege', credits: 1300, priceUsd: 99.99 };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl">
            <div className="relative bg-neutral-900 border border-white/5 rounded-[2rem] p-10 max-w-4xl w-full mx-4 shadow-2xl">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-4xl font-light text-center text-white mb-2 tracking-tight">Continue watching</h2>
                <p className="text-neutral-400 text-center mb-10 text-lg">Top up your credits to resume your session.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Essential Pack */}
                    <div
                        onClick={() => setSelectedPack(pack1.credits)}
                        className={`rounded-3xl border transition-all cursor-pointer group p-8 flex flex-col items-center ${selectedPack === pack1.credits
                            ? 'bg-white/10 border-white/40 shadow-lg shadow-white/10'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                            }`}
                    >
                        <h3 className="text-neutral-400 font-medium mb-6 uppercase tracking-wider text-sm">{pack1.name}</h3>
                        <div className={`text-5xl font-light mb-2 flex items-center justify-center gap-2 transition-transform ${selectedPack === pack1.credits ? 'text-white scale-110' : 'text-neutral-300'}`}>
                            {pack1.credits} <Coins size={28} className="text-yellow-400 fill-yellow-500/30" />
                        </div>
                        <div className="text-neutral-500 font-medium">${pack1.priceUsd.toFixed(2)}</div>
                    </div>

                    {/* Premium Pack */}
                    <div
                        onClick={() => setSelectedPack(pack2.credits)}
                        className={`rounded-3xl border relative transform md:scale-110 shadow-2xl cursor-pointer p-8 flex flex-col items-center transition-all ${selectedPack === pack2.credits
                            ? 'bg-indigo-500/20 border-indigo-400 shadow-indigo-500/40 ring-2 ring-indigo-500/50'
                            : 'bg-indigo-500/10 border-indigo-500/50 shadow-indigo-500/20'
                            }`}
                    >
                        <div className="absolute top-0 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] text-center py-1.5 shadow-lg rounded-t-xl overflow-hidden">
                            Most Chosen
                        </div>
                        <h3 className="text-indigo-300 font-medium mb-6 mt-4 uppercase tracking-wider text-sm">{pack2.name}</h3>
                        <div className={`text-6xl font-light mb-2 flex items-center justify-center gap-2 transition-transform ${selectedPack === pack2.credits ? 'text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.8)] scale-105' : 'text-indigo-100'}`}>
                            {pack2.credits} <Coins size={36} className="text-yellow-400 fill-yellow-500/30" />
                        </div>
                        <div className="text-indigo-300 font-medium">${pack2.priceUsd.toFixed(2)}</div>
                    </div>

                    {/* Privilege Pack */}
                    <div
                        onClick={() => setSelectedPack(pack3.credits)}
                        className={`rounded-3xl border relative cursor-pointer group p-8 flex flex-col items-center transition-all ${selectedPack === pack3.credits
                            ? 'bg-pink-500/10 border-pink-400 shadow-xl shadow-pink-500/20'
                            : 'bg-pink-500/[0.03] border-pink-500/30 hover:bg-pink-500/[0.05]'
                            }`}
                    >
                        <div className="absolute top-0 w-full bg-pink-500/20 text-pink-300 text-[10px] font-bold uppercase tracking-[0.2em] text-center py-1.5 border-b border-pink-500/30 rounded-t-xl overflow-hidden">
                            Best Value
                        </div>
                        <h3 className="text-pink-400 font-medium mb-6 mt-4 uppercase tracking-wider text-sm">{pack3.name}</h3>
                        <div className={`text-5xl font-light mb-2 flex items-center justify-center gap-2 transition-transform ${selectedPack === pack3.credits ? 'text-white scale-110' : 'text-pink-100'}`}>
                            {pack3.credits} <Coins size={28} className="text-yellow-400 fill-yellow-500/30" />
                        </div>
                        <div className="text-pink-500/80 font-medium">${pack3.priceUsd.toFixed(2)}</div>
                    </div>
                </div>

                {/* Mock Payment */}
                <div className="flex flex-col gap-4 max-w-sm mx-auto">
                    <button
                        onClick={() => {
                            // Log this simulated purchase to tracking (optimistic)
                            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/stats/client`, { method: 'POST' }).catch(() => null);
                            onPurchase(selectedPack);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black rounded-full py-4 font-semibold text-lg hover:bg-neutral-200 transition-colors shadow-xl"
                    >
                         Pay
                    </button>
                    <button
                        onClick={() => {
                            fetch('http://localhost:3001/api/stats/client', { method: 'POST' }).catch(() => null);
                            onPurchase(selectedPack);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-neutral-800 border border-white/10 text-white rounded-full py-4 font-semibold text-lg hover:bg-neutral-700 transition-colors"
                    >
                        <CreditCard size={24} /> Google Pay
                    </button>
                </div>
            </div>
        </div>
    );
}
