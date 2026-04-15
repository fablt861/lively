"use client";

import { useEffect, useState } from "react";
import { VideoRoom } from "@/components/VideoRoom";
import { useWebRTC } from "@/hooks/useWebRTC";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { CameraPermissionGuard } from "@/components/CameraPermissionGuard";

export default function LivePage({ params }: { params: { locale: string } }) {
    const [role, setRole] = useState<"user" | "model" | null>(null);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isLaunch, setIsLaunch] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const storedRole = localStorage.getItem("kinky_user_role") as "user" | "model" | null;
        setRole(storedRole || "user");

        // Check maintenance & launch mode
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/settings`)
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                if (data.maintenanceMode) setIsMaintenance(true);
                if (data.launchMode) setIsLaunch(true);
            })
            .catch(() => {})
            .finally(() => setIsChecking(false));
    }, []);

    const webRTC = useWebRTC(role || "user", !isMaintenance && !isLaunch && !isChecking);

    const activeMaintenance = isMaintenance || webRTC.isMaintenance;
    const activeLaunch = isLaunch || webRTC.isLaunch;
    
    const handlePurchase = async (credits: number, priceUsd: number) => {
        const id = localStorage.getItem('kinky_user_id');
        if (!id) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/auth/add-credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, amount: credits, priceUsd })
            });
            if (!res.ok) console.error('[Purchase] Error:', await res.text());
        } catch (err) {
            console.error('[Purchase] Network Error:', err);
        }
    };

    if (activeMaintenance) return <MaintenanceGuard />;
    if (webRTC.cameraPermissionError) return <CameraPermissionGuard onRetry={webRTC.retryCamera} />;
    if (activeLaunch) return <VideoRoom {...webRTC} role={role} language={params.locale} onCreditsUpdate={() => {}} onCallEnd={webRTC.endCall} onNext={webRTC.nextPartner} onPurchase={handlePurchase} isLaunchOverride={true} packs={settings?.packs} isDirectCall={webRTC.isDirectCall} />;
    if (isChecking || !role) return <div className="min-h-screen bg-[#050505]"></div>;

    return <VideoRoom {...webRTC} role={role} language={params.locale} onCreditsUpdate={() => {}} onCallEnd={webRTC.endCall} onNext={webRTC.nextPartner} onPurchase={handlePurchase} packs={settings?.packs} isDirectCall={webRTC.isDirectCall} />;
}


