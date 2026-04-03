import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";

export function OnlineGauge() {
    const { t } = useTranslation();
    const [femaleCount, setFemaleCount] = useState(2438);
    const [maleCount, setMaleCount] = useState(4127);
    const [ratio, setRatio] = useState(38); // 38% female

    useEffect(() => {
        const interval = setInterval(() => {
            setFemaleCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
            setMaleCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500 w-full sm:w-auto min-w-[320px] sm:max-w-none">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500/30 via-indigo-500/30 to-pink-500/30 opacity-30" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black text-green-400 uppercase tracking-widest leading-none">{t('gauge.live')}</span>
            </div>

            {/* Gauge with Labels Container */}
            <div className="flex-1 flex flex-col gap-2 min-w-[140px]">
                <div className="flex justify-between text-[9px] font-black tracking-widest uppercase">
                    <span className="text-pink-400/80">♀ {ratio}%</span>
                    <span className="text-indigo-400/80">{100 - ratio}% ♂</span>
                </div>

                {/* Gauge Bar */}
                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(236,72,153,0.4)]"
                        style={{ width: `${ratio}%` }}
                    />
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000 ease-in-out"
                        style={{ width: `${100 - ratio}%` }}
                    />

                    {/* Marker */}
                    <div
                        className="absolute top-0 h-full w-0.5 bg-white/60 shadow-[0_0_5px_white] z-10 transition-all duration-1000 ease-in-out"
                        style={{ left: `${ratio}%` }}
                    />
                </div>

                {/* Matchmaking Label */}
                <div className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] text-center">
                    {t('gauge.matchmaking')}
                </div>
            </div>
        </div>
    );
}
