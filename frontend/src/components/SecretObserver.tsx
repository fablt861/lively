"use client";

import React, { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { X, User, ShieldCheck } from "lucide-react";

interface SecretObserverProps {
  roomName: string;
  token: string;
  onClose: () => void;
}

export function SecretObserver({ roomName, token, onClose }: SecretObserverProps) {
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://live.kinky.live";

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        className="relative w-full max-w-5xl h-[80vh] bg-neutral-950 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-neutral-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Spectator Mode</h3>
              <p className="text-xs text-neutral-500 uppercase font-black tracking-widest">{roomName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all transform active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative p-8">
            <ObserverContent />
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function ObserverContent() {
    const tracks = useTracks(
        [
            Track.Source.Camera,
            Track.Source.Microphone,
        ],
        { onlySubscribed: true }
    ).filter(t => t.participant.metadata !== 'admin');

    if (tracks.length === 0) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-indigo-400 font-bold uppercase tracking-widest animate-pulse">Establishing direct connection...</p>
            </div>
        );
    }

    return (
        <div className={`grid gap-8 h-full w-full max-w-7xl mx-auto ${tracks.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {tracks.filter(t => t.source === Track.Source.Camera).map((track) => (
                <div key={track.participant.identity} className="relative aspect-video bg-neutral-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                    <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                    
                    {/* Badge */}
                    <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                        <User size={14} className="text-indigo-400" />
                        <span className="text-xs font-black text-white uppercase tracking-tighter">
                            {JSON.parse(track.participant.metadata || '{}').role === 'model' ? 'MODEL' : 'USER'}
                        </span>
                    </div>

                    <div className="absolute bottom-6 left-6">
                         <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Live Stream Active</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
