"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

export function OnlineGauge() {
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
        <div className="inline-flex flex-col gap-3 px-6 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500 max-w-[280px]">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500/50 via-indigo-500/50 to-pink-500/50 opacity-30" />

            <div className="flex justify-between items-end mb-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">En ligne</span>
                    <span className="text-xl font-black text-white tabular-nums">
                        {(femaleCount + maleCount).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* Gauge Bar */}
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                    style={{ width: `${ratio}%` }}
                />
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000 ease-in-out"
                    style={{ width: `${100 - ratio}%` }}
                />

                {/* Separator / Marker */}
                <div
                    className="absolute top-0 h-full w-0.5 bg-white/80 shadow-[0_0_10px_white] z-10 transition-all duration-1000 ease-in-out"
                    style={{ left: `${ratio}%` }}
                />
            </div>

            {/* Labels */}
            <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                <div className="flex flex-col items-start">
                    <span className="text-pink-400/80 mb-0.5">♀ Femmes</span>
                    <span className="text-white/40">{ratio}%</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-indigo-400/80 mb-0.5">Hommes ♂</span>
                    <span className="text-white/40">{100 - ratio}%</span>
                </div>
            </div>
        </div>
    );
}
