import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, Clock } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function ModelSimulator() {
    const { t } = useTranslation();
    const [hours, setHours] = useState(4);
    const [monthlyEarnings, setMonthlyEarnings] = useState(0);

    const MINUTE_RATE = 0.50;
    const HOURLY_RATE = MINUTE_RATE * 60; // 30€
    const DAYS_PER_MONTH = 22; // Standard active month

    useEffect(() => {
        setMonthlyEarnings(Math.round(hours * HOURLY_RATE * DAYS_PER_MONTH));
    }, [hours]);

    return (
        <div className="w-full max-w-xl bg-neutral-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Light */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] group-hover:bg-pink-500/30 transition-all duration-700" />

            <div className="relative z-10 space-y-10">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <TrendingUp className="text-pink-500" />
                        {t('simulator.title')}
                    </h3>
                    <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">{t('simulator.subtitle')}</p>
                </div>

                <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-white/60 flex items-center gap-2">
                                <Clock size={16} className="text-indigo-400" />
                                {t('simulator.presence')}
                            </span>
                            <span className="text-4xl font-black text-white tabular-nums">
                                {hours}<span className="text-lg text-white/40 ml-1">{t('simulator.hours_unit')}</span>
                            </span>
                        </div>

                        <input
                            type="range"
                            min="1"
                            max="12"
                            value={hours}
                            onChange={(e) => setHours(parseInt(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        />

                        <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
                            <span>{t('simulator.range_low')}</span>
                            <span>{t('simulator.range_high')}</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign size={80} />
                        </div>

                        <div className="relative z-10 space-y-1">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">{t('simulator.estimated_income')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl">
                                    {monthlyEarnings.toLocaleString()}
                                </span>
                                <span className="text-2xl font-bold text-white/40">€</span>
                            </div>
                            <p className="text-[11px] text-white/30 italic pt-4 flex items-center gap-2">
                                <Calendar size={12} /> {t('simulator.basis_text', { days: DAYS_PER_MONTH })}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = '/model/signup'}
                        className="w-full py-6 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500 text-white font-black text-lg shadow-[0_20px_40px_rgba(236,72,153,0.3)] hover:shadow-[0_25px_50px_rgba(236,72,153,0.5)] transition-all duration-500 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group/btn"
                    >
                        {t('simulator.cta')}
                        <TrendingUp size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
