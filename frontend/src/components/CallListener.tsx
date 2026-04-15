"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Phone, PhoneOff, X, Bell } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live";

export function CallListener() {
    const { t, language } = useTranslation();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [incomingCall, setIncomingCall] = useState<{
        requestorId: string;
        requestorPseudo: string;
        requestorSocketId: string;
    } | null>(null);

    useEffect(() => {
        const role = localStorage.getItem('kinky_user_role');
        const id = localStorage.getItem('kinky_user_id');
        
        console.log('[CallListener] Initializing...', { role, id });
        
        if (role !== 'model' || !id) return;

        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        // Tell backend who we are so it can map our ID to this socket 
        // without joining the matching queue
        newSocket.emit('identify', { role: 'model', id, language });

        newSocket.on('direct_call_incoming', (payload) => {
            console.log('[CallListener] Incoming call:', payload);
            setIncomingCall(payload);
        });

        newSocket.on('direct_call_accepted', ({ roomId }) => {
            setIncomingCall(null);
            setTimeout(() => {
                window.location.href = `/${language}/live?room=${roomId}&init=false`;
            }, 1000);
        });
        newSocket.on('direct_call_rejected', () => setIncomingCall(null));

        return () => {
            newSocket.disconnect();
        };
    }, [language]);

    const handleResponse = (accepted: boolean) => {
        if (!socket || !incomingCall) return;

        const id = localStorage.getItem('kinky_user_id');
        socket.emit('direct_call_response', {
            requestorSocketId: incomingCall.requestorSocketId,
            requestorId: incomingCall.requestorId,
            accepted,
            modelId: id
        });

        if (accepted) {
            // The direct_call_accepted event handled above will clear the popup
            // and the specific roomId will be sent via direct_call_accepted to this socket too
        } else {
            setIncomingCall(null);
        }
    };

    if (!incomingCall) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-neutral-900 border border-indigo-500/30 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(79,70,229,0.2)] overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-8 animate-bounce">
                        <Bell size={40} />
                    </div>

                    <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Appel Direct</h3>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-6">
                        {incomingCall.requestorPseudo} souhaite vous rejoindre
                    </p>
                    <p className="text-white/40 text-sm leading-relaxed mb-10 px-4">
                        Ce client souhaite démarrer une session privée immédiatement avec vous.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <button 
                            onClick={() => handleResponse(true)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-indigo-500/20"
                        >
                            <Phone size={18} /> ACCEPTER
                        </button>
                        <button 
                            onClick={() => handleResponse(false)}
                            className="bg-white/5 hover:bg-white/10 text-white/60 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95"
                        >
                            <PhoneOff size={18} /> PLUS TARD
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
