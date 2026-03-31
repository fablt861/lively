import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function ModelSimulator() {
    const { t, language } = useTranslation();
    const [hours, setHours] = useState(4);
    const [monthlyEarnings, setMonthlyEarnings] = useState(0);

    const MINUTE_RATE = 0.50;
    const HOURLY_RATE = MINUTE_RATE * 60; // 30€
    const DAYS_PER_MONTH = 22; // Standard active month

    useEffect(() => {
        setMonthlyEarnings(Math.round(hours * HOURLY_RATE * DAYS_PER_MONTH));
    }, [hours]);

    return (
        <div className="w-full max-w-sm md:max-w-md bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Light */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px]" />

            <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <TrendingUp className="text-indigo-400 w-5 h-5" />
                        {t('simulator.title')}
                    </h3>
                    <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">{t('simulator.subtitle')}</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-indigo-500" />
                                {t('simulator.presence')}
                            </span>
                            <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                {hours}<span className="text-sm text-white/30 ml-0.5">{t('simulator.hours_unit')}</span>
                            </span>
                        </div>

                        <div className="relative pt-2">
                            <input
                                type="range"
                                min="1"
                                max="12"
                                value={hours}
                                onChange={(e) => setHours(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                            />
                        </div>

                        <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                            <span>{t('simulator.range_low')}</span>
                            <span>{t('simulator.range_high')}</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/5 relative overflow-hidden">
                        <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12">
                            <DollarSign size={100} />
                        </div>

                        <div className="relative z-10 space-y-1">
                            <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.3em] mb-1">{t('simulator.estimated_income')}</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                                    {monthlyEarnings.toLocaleString()}
                                </span>
                                <span className="text-xl font-bold text-white/30 tracking-tight">€</span>
                            </div>
                            <p className="text-[9px] text-white/60 font-medium pt-3 flex items-center gap-2 uppercase tracking-widest">
                                <Calendar size={10} className="opacity-70" /> {t('simulator.basis_text', { days: DAYS_PER_MONTH })}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = `/${language}/model/signup`}
                        className="w-full py-4 rounded-full bg-white text-black font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 ring-1 ring-white/20"
                    >
                        {t('simulator.cta')}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
