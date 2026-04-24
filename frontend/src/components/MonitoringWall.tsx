"use client";

import { Camera, Users, Zap, ExternalLink, RefreshCcw, Clock, ShieldAlert, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { SecretObserver } from "./SecretObserver";

interface MonitoringRoom {
    roomId: string;
    modelId: string;
    userId: string;
    modelPseudo: string;
    userPseudo: string;
    startTime: number;
    isStarted: boolean;
    earnedUsd: number;
    userCountryCode: string;
    lastSnapshotAt: number | null;
}

export function MonitoringWall({ token }: { token: string }) {
    const { t, language } = useTranslation();
    const router = useRouter();
    const [rooms, setRooms] = useState<MonitoringRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [observingRoom, setObservingRoom] = useState<{ roomId: string; roomName: string; lkToken: string } | null>(null);

    const fetchRooms = async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live";
            const res = await fetch(`${backendUrl}/api/admin/monitoring/active-rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
                setLastUpdate(new Date());
            }
        } catch (err) {
            console.error("Failed to fetch monitoring rooms", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const handleJoinInvisible = async (room: MonitoringRoom) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live";
            // Get token for LiveKit direct join
            const resp = await fetch(`${backendUrl}/api/video/token?room=${room.roomId}&identity=admin-${Date.now()}&role=admin`);
            const { token: lkToken } = await resp.json();
            
            setObservingRoom({
                roomId: room.roomId,
                roomName: `Room: ${room.modelPseudo} / ${room.userPseudo}`,
                lkToken
            });
        } catch (err) {
            console.error("[Monitoring] Failed to get observer token", err);
        }
    };

    if (loading && rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-neutral-500">
                <RefreshCcw className="w-10 h-10 animate-spin mb-4 opacity-20" />
                <p>Chargement du mur de surveillance...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {observingRoom && (
                <SecretObserver 
                    roomName={observingRoom.roomName}
                    token={observingRoom.lkToken}
                    onClose={() => setObservingRoom(null)}
                />
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-light flex items-center gap-3">
                        <Camera className="text-indigo-500" /> 
                        Monitoring Live
                    </h2>
                    <p className="text-neutral-500 text-sm mt-1">
                        Dernière mise à jour : {lastUpdate.toLocaleTimeString()}
                    </p>
                </div>
                <button 
                    onClick={fetchRooms}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-neutral-400"
                    title="Rafraîchir maintenant"
                >
                    <RefreshCcw size={20} />
                </button>
            </div>

            {rooms.length === 0 ? (
                <div className="bg-neutral-900/50 border border-white/5 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-neutral-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Aucun appel en cours</h3>
                    <p className="text-neutral-500 max-w-sm">
                        Lorsqu'un utilisateur et une modèle seront en ligne, leurs flux apparaîtront ici.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rooms.map((room) => (
                        <RoomCard 
                            key={room.roomId} 
                            room={room} 
                            token={token} 
                            onJoin={() => handleJoinInvisible(room)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function RoomCard({ room, token, onJoin }: { room: MonitoringRoom, token: string, onJoin: () => void }) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live";
    const snapshotUrl = `${backendUrl}/api/admin/monitoring/image/${room.modelId}?token=${token}&t=${room.lastSnapshotAt || Date.now()}`;
    
    const durationMin = Math.floor((Date.now() - room.startTime) / 60000);
    const country = room.userCountryCode && room.userCountryCode !== 'Unknown' ? room.userCountryCode : null;

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col group hover:border-indigo-500/30 transition-all shadow-xl">
            {/* Snapshot Area */}
            <div className="aspect-video relative bg-black overflow-hidden">
                {room.lastSnapshotAt ? (
                    <img 
                        src={snapshotUrl} 
                        alt={room.modelPseudo} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 bg-neutral-950">
                        <Camera size={40} className="mb-2 opacity-20" />
                        <span className="text-xs uppercase tracking-widest font-black">Waiting for sync</span>
                    </div>
                )}
                
                {/* Overlay Info */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-tighter border border-white/10 flex items-center gap-1">
                        {country ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {country}
                            </>
                        ) : (
                            <>
                                <Globe size={10} className="text-neutral-400" />
                                ??
                            </>
                        )}
                    </span>
                    <span className="px-2 py-1 bg-indigo-500/80 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-tighter border border-white/10 animate-pulse">
                        LIVE
                    </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/5">
                        <Clock size={12} className="text-neutral-400" />
                        <span className="text-[10px] font-bold text-white">{durationMin}m</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 backdrop-blur-md rounded-lg border border-green-500/20">
                        <Zap size={12} className="text-green-400" />
                        <span className="text-[10px] font-black text-green-400">${room.earnedUsd.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Interactions */}
            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-neutral-400 text-[10px] uppercase font-black tracking-widest">Modèle</span>
                        <span className="text-white font-bold truncate max-w-[120px]">{room.modelPseudo}</span>
                    </div>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="flex flex-col items-end">
                        <span className="text-neutral-400 text-[10px] uppercase font-black tracking-widest">Client</span>
                        <span className="text-white/70 font-medium truncate max-w-[120px]">{room.userPseudo}</span>
                    </div>
                </div>

                <button 
                    onClick={onJoin}
                    className="w-full py-3 bg-white hover:bg-neutral-200 text-black rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                    <ShieldAlert size={14} /> Join Inconito
                </button>
            </div>
        </div>
    );
}
