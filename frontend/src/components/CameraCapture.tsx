"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

interface CameraCaptureProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isLoading, setIsLoading] = useState(true);

    const startCamera = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setIsLoading(false);
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please ensure you have granted permission.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(dataUrl);
            }
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    const saveAndClose = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold uppercase tracking-widest text-white/90 flex items-center gap-3">
                        <Camera size={24} className="text-pink-500" />
                        {t('model.signup.camera_title') || "Camera Capture"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Main View */}
                <div className="relative flex-1 bg-black aspect-video flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="text-center p-8 space-y-4">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-white/60 max-w-xs mx-auto">{error}</p>
                        </div>
                    ) : capturedImage ? (
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                    ) : (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                            />
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <RefreshCw className="text-white/40 animate-spin" size={48} />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-8 bg-neutral-900/50 border-t border-white/5">
                    <div className="flex items-center justify-center gap-6">
                        {!capturedImage && !error ? (
                            <>
                                <button 
                                    onClick={toggleCamera}
                                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
                                    title={t('model.signup.camera_flip_btn') || "Flip Camera"}
                                >
                                    <RefreshCw size={24} />
                                </button>
                                <button 
                                    onClick={capturePhoto}
                                    disabled={isLoading}
                                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <div className="w-16 h-16 rounded-full border-4 border-black/10" />
                                </button>
                                <div className="w-14" /> {/* Placeholder for balance */}
                            </>
                        ) : capturedImage ? (
                            <>
                                <button 
                                    onClick={retake}
                                    className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <RefreshCw size={18} />
                                    {t('model.signup.camera_cancel_btn') || "Retake"}
                                </button>
                                <button 
                                    onClick={saveAndClose}
                                    className="px-10 py-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    {t('model.signup.camera_save_btn') || "Use Photo"}
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={onClose}
                                className="px-10 py-4 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-all active:scale-95"
                            >
                                {t('model.signup.camera_cancel_btn') || "Close"}
                            </button>
                        )}
                    </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
