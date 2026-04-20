import React from 'react';
import { Coins, X, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface DirectCallRestrictionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuyCredits: () => void;
    modelName: string;
    requiredCredits: number;
}

export function DirectCallRestrictionModal({ 
    isOpen, 
    onClose, 
    onBuyCredits, 
    modelName, 
    requiredCredits 
}: DirectCallRestrictionModalProps) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
                onClick={onClose} 
            />

            {/* Modal Content */}
            <div className="relative bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 md:p-12 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 mb-8 border border-indigo-500/20">
                        <Coins size={40} />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight uppercase">
                        {t('dashboard.restriction.title')}
                    </h2>

                    <p className="text-white/60 text-sm md:text-base leading-relaxed mb-10">
                        {t('dashboard.restriction.description', { 
                            credits: requiredCredits, 
                            name: modelName 
                        })}
                    </p>

                    <div className="w-full space-y-4">
                        <button
                            onClick={onBuyCredits}
                            className="w-full py-5 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {t('dashboard.restriction.cta')}
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-white/5 text-white/40 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                        >
                            {t('common.close') || 'Close'}
                        </button>
                    </div>
                </div>

                {/* Close X */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
}
