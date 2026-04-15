import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function ModelSimulator() {
    const { t, language } = useTranslation();
    const [hours, setHours] = useState(4);
    const [monthlyEarnings, setMonthlyEarnings] = useState(0);

    const MINUTE_RATE = 0.40;
    const HOURLY_RATE = MINUTE_RATE * 60; // 30$
    const DAYS_PER_MONTH = 30; // 30 days calculation base

    useEffect(() => {
        setMonthlyEarnings(Math.round(hours * HOURLY_RATE * DAYS_PER_MONTH));
    }, [hours]);

    return (
        <div className="w-full max-w-sm md:max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Light */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px]" />

            <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2">
                        <TrendingUp className="text-indigo-400 w-6 h-6" />
                        {t('simulator.title')}
                    </h3>
                    <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em]">{t('simulator.subtitle')}</p>
                </div>

                <div className="space-y-8">
                    <div className="space-y-5">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-white/80 uppercase tracking-widest flex items-center gap-2.5">
                                <Clock size={16} className="text-indigo-500" />
                                {t('simulator.presence')}
                            </span>
                            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
                                {hours}<span className="text-base text-white/40 ml-1">{t('simulator.hours_unit')}</span>
                            </span>
                        </div>

                        <div className="relative pt-2">
                            <input
                                type="range"
                                min="1"
                                max="12"
                                value={hours}
                                onChange={(e) => setHours(parseInt(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                            />
                        </div>

                        <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                            <span>{t('simulator.range_low')}</span>
                            <span>{t('simulator.range_high')}</span>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent border border-white/10 relative overflow-hidden shadow-inner">
                        <div className="absolute -bottom-6 -right-6 opacity-[0.05] rotate-12">
                            <DollarSign size={120} />
                        </div>

                        <div className="relative z-10 space-y-2">
                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">{t('simulator.estimated_income')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                                    {monthlyEarnings.toLocaleString()}
                                </span>
                                <span className="text-2xl font-bold text-white/40 tracking-tight">$</span>
                            </div>
                            <p className="text-xs text-white/60 font-semibold pt-4 flex items-center gap-2 uppercase tracking-widest">
                                <Calendar size={12} className="text-indigo-400" /> {t('simulator.basis_text', { days: 30 })}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = `/${language}/elite/signup`}
                        className="w-full py-5 rounded-full bg-white text-black font-black text-base shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 ring-1 ring-white/20"
                    >
                        {t('simulator.cta')}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
