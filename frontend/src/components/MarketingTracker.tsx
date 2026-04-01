"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export function MarketingTracker() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const hasTracked = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || hasTracked.current) return;
        
        // Don't track visits to the admin panel
        if (pathname?.includes("/admin")) return;

        const src = searchParams.get("src");
        const camp = searchParams.get("camp");
        const ad = searchParams.get("ad");

        // If any of the tracked parameters exist, save them and notify backend
        if (src || camp || ad) {
            const params = {
                src: src || "",
                camp: camp || "",
                ad: ad || ""
            };

            // 1. Persist for signup/purchase association
            localStorage.setItem("kinky_marketing_params", JSON.stringify(params));

            // 2. Track visit once per landing
            hasTracked.current = true;
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/stats/track-visit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params)
            }).catch(err => console.error("[MarketingTracker] Failed to log visit:", err));
        } else {
            // Log a 'direct' visit if no params and we haven't tracked yet
            // Wait: we only want to track each 'session' or landing once.
            // For now, let's just track if params are present to avoid flooding 'direct' 
            // OR we track 'direct' only if no marketing params are in localStorage either.
            
            const saved = localStorage.getItem("kinky_marketing_params");
            const alreadyTrackedDirect = sessionStorage.getItem("kinky_tracked_direct");

            if (!saved && !alreadyTrackedDirect) {
                hasTracked.current = true;
                sessionStorage.setItem("kinky_tracked_direct", "true");
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/admin/stats/track-visit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ src: "", camp: "", ad: "" })
                }).catch(err => console.error("[MarketingTracker] Failed to log direct visit:", err));
            }
        }
    }, [searchParams]);

    return null; // Invisible component
}
