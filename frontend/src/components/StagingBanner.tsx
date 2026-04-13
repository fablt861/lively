"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";

export function StagingBanner() {
    const { t } = useTranslation();
    const [isStaging, setIsStaging] = useState(false);

    useEffect(() => {
        // Show banner if it's not production
        // Vercel sets NEXT_PUBLIC_VERCEL_ENV to 'preview' or 'development'
        const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
        const isStagingDomain = window.location.hostname.includes("staging");
        const isLocal = window.location.hostname.includes("localhost");

        if (isPreview || isStagingDomain || isLocal) {
            setIsStaging(true);
        }
    }, []);

    if (!isStaging) return null;

    return (
        <div className="bg-amber-500/90 text-black py-1.5 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-center sticky top-0 z-[9999] backdrop-blur-md border-b border-black/10">
            <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-black animate-pulse" />
                {t('common.staging_notice')}
                <span className="inline-block w-2 h-2 rounded-full bg-black animate-pulse" />
            </span>
        </div>
    );
}
