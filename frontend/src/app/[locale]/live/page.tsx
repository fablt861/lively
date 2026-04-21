"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VideoRoom } from "@/components/VideoRoom";
import { useLiveKit } from "@/hooks/useLiveKit";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { CameraPermissionGuard } from "@/components/CameraPermissionGuard";

export default function LivePage({ params }: { params: { locale: string } }) {
    const [role, setRole] = useState<"user" | "model" | null>(null);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isLaunch, setIsLaunch] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const searchParams = useSearchParams();
    const roomParam = searchParams.get('room');
    const isDirectCall = !!roomParam;

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

    const videoSession = useLiveKit(role || "user", !isMaintenance && !isLaunch && !isChecking, showAuthModal, showPaywall);

    const activeMaintenance = isMaintenance || videoSession.isMaintenance;
    const activeLaunch = isLaunch || videoSession.isLaunch;
    
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
    if (videoSession.cameraPermissionError) return <CameraPermissionGuard onRetry={videoSession.retryCamera} />;
    
    // We pass previewStream for localStream to allow the PreMatchModal to show the camera check
    if (activeLaunch) return <VideoRoom {...videoSession} isAudioMuted={videoSession.isAudioMuted} setIsAudioMuted={videoSession.setIsAudioMuted} isVideoMuted={videoSession.isVideoMuted} setIsVideoMuted={videoSession.setIsVideoMuted} localStream={videoSession.previewStream} remoteStream={null} role={role} language={params.locale} onCreditsUpdate={() => {}} onCallEnd={videoSession.endCall} onNext={videoSession.nextPartner} onPurchase={handlePurchase} isLaunchOverride={true} packs={settings?.packs} isDirectCall={isDirectCall} showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal} showPaywall={showPaywall} setShowPaywall={setShowPaywall} />;
    if (isChecking || !role) return <div className="min-h-screen bg-[#050505]"></div>;

    return <VideoRoom {...videoSession} isAudioMuted={videoSession.isAudioMuted} setIsAudioMuted={videoSession.setIsAudioMuted} isVideoMuted={videoSession.isVideoMuted} setIsVideoMuted={videoSession.setIsVideoMuted} localStream={videoSession.previewStream} remoteStream={null} role={role} language={params.locale} onCreditsUpdate={() => {}} onCallEnd={videoSession.endCall} onNext={videoSession.nextPartner} onPurchase={handlePurchase} packs={settings?.packs} isDirectCall={isDirectCall} showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal} showPaywall={showPaywall} setShowPaywall={setShowPaywall} />;
}
