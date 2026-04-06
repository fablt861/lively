"use client";

import { useEffect, useState } from "react";
import { VideoRoom } from "@/components/VideoRoom";
import { useWebRTC } from "@/hooks/useWebRTC";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";

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
    
    if (activeMaintenance) return <MaintenanceGuard />;
    if (activeLaunch) return <VideoRoom {...webRTC} role={role} language={params.locale} onCreditsUpdate={() => {}} onCallEnd={webRTC.endCall} onNext={webRTC.nextPartner} isLaunchOverride={true} packs={settings?.packs} />;
    if (isChecking || !role) return <div className="min-h-screen bg-[#050505]"></div>;

    return <VideoRoom {...webRTC} role={role} language={params.locale} onCreditsUpdate={() => {}} onCallEnd={webRTC.endCall} onNext={webRTC.nextPartner} packs={settings?.packs} />;
}


