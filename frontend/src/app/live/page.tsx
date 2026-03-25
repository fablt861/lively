"use client";

import { useEffect, useState } from "react";
import { VideoRoom } from "../../components/VideoRoom";
import { useWebRTC } from "../../hooks/useWebRTC";

export default function LivePage() {
    const [role, setRole] = useState<"user" | "model" | null>(null);

    useEffect(() => {
        const storedRole = localStorage.getItem("kinky_role") as "user" | "model" | null;
        // Si pas de rôle (accès direct par URL), on le considère comme un "user" (guest 30s)
        setRole(storedRole || "user");
    }, []);

    const webRTC = useWebRTC(role || "user");

    if (!role) return <div className="min-h-screen bg-[#050505]"></div>;

    return <VideoRoom {...webRTC} role={role} />;
}
