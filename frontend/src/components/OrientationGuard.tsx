"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function OrientationGuard() {
    const { t } = useTranslation();
    const [isLandscape, setIsLandscape] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            // Only trigger if it's a mobile-like screen size AND landscape AND touch device
            // We use 1024px as the breakpoint for desktop
            const isMobile = window.innerWidth < 1024;
            const isTouch = window.matchMedia("(pointer: coarse)").matches;
            const landscape = window.matchMedia("(orientation: landscape)").matches;
            setIsLandscape(isMobile && isTouch && landscape);

        };

        checkOrientation();
        window.addEventListener("resize", checkOrientation);
        return () => window.removeEventListener("resize", checkOrientation);
    }, []);

    if (!isLandscape) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-neutral-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative animate-bounce-slow">
                    <Smartphone size={80} className="text-white/20" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 animate-rotate-device">
                        <Smartphone size={80} className="text-indigo-500" />
                    </div>
                </div>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">
                Portrait Mode Required
            </h2>
            <p className="text-white/60 max-w-xs leading-relaxed font-medium">
                {t('room.rotate_device')}
            </p>

            <div className="mt-12 flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20" />
            </div>
        </div>
    );
}
