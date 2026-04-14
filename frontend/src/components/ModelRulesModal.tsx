"use client";

import { X, ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

interface ModelRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ModelRulesModal({ isOpen, onClose }: ModelRulesModalProps) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-xl bg-neutral-900 border border-rose-500/20 rounded-[2.5rem] shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden">
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <ShieldAlert className="text-rose-500" />
                            {t('dashboard.rules_modal_title')}
                        </h2>
                        <p className="text-rose-400 font-bold text-xs uppercase tracking-widest mt-1">
                            {t('dashboard.rules_warning_title')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="text-white/40" />
                    </button>
                </div>

                <div className="px-8 pb-10">
                    <p className="text-white/70 text-sm leading-relaxed mb-8 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                        <AlertTriangle className="inline-block mr-2 text-rose-500" size={16} />
                        {t('dashboard.rules_warning_desc')}
                    </p>

                    {/* Prohibited Section */}
                    <div className="space-y-4 mb-8">
                        <h3 className="text-rose-500 font-black text-xs uppercase tracking-[0.2em] px-1">
                            {t('dashboard.rules_prohibited_title')}
                        </h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl group hover:border-rose-500/30 transition-colors">
                                    <XCircle className="text-rose-500 mt-0.5 shrink-0" size={18} />
                                    <span className="text-white/80 text-sm font-medium leading-snug">
                                        {t(`dashboard.rules_prohibited_item${i}`)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Allowed Section */}
                    <div className="space-y-4">
                        <h3 className="text-green-500 font-black text-xs uppercase tracking-[0.2em] px-1">
                            {t('dashboard.rules_allowed_title')}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-2xl group hover:border-green-500/30 transition-colors">
                                <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={18} />
                                <span className="text-white/80 text-sm font-medium leading-snug">
                                    {t('dashboard.rules_allowed_item1')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Close CTA */}
                    <button
                        onClick={onClose}
                        className="w-full mt-10 py-5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest transition-all active:scale-[0.98] border border-white/5"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
