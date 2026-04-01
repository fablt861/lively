"use client";

import { useEffect, useState } from "react";
import { VideoRoom } from "@/components/VideoRoom";
import { useWebRTC } from "@/hooks/useWebRTC";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";

export default function LivePage({ params }: { params: { locale: string } }) {
    const [role, setRole] = useState<"user" | "model" | null>(null);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const storedRole = localStorage.getItem("kinky_user_role") as "user" | "model" | null;
        setRole(storedRole || "user");

        // Check maintenance mode
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/settings`)
            .then(res => res.json())
            .then(settings => {
                if (settings.maintenanceMode) {
                    setIsMaintenance(true);
                }
            })
            .catch(() => {})
            .finally(() => setIsChecking(false));
    }, []);

    const webRTC = useWebRTC(role || "user", !isMaintenance && !isChecking);


    const activeMaintenance = isMaintenance || webRTC.isMaintenance;
    
    if (activeMaintenance) return <MaintenanceGuard />;
    if (isChecking || !role) return <div className="min-h-screen bg-[#050505]"></div>;

    return <VideoRoom {...webRTC} role={role} language={params.locale} onCreditsUpdate={() => {}} onCallEnd={webRTC.endCall} onNext={webRTC.nextPartner} />;
}


