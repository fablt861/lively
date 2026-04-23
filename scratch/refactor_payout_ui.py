import os

filepath = '/Users/fabrice/APPS/LC Bis/lively/frontend/src/app/[locale]/hq-center/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. NEW PAYOUT TAB CONTENT (Ready + Ongoing sections with Review buttons, and NO table at the bottom)
new_payout_tab = """{payoutSubTab === 'pending' ? (
                            <>
                                {payoutSummary && (
                                    <div className="space-y-12">
                                        {/* Ready Section (Last Week) */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-light text-white/50 flex items-center gap-3">
                                                    <CheckCircle className="text-green-400" size={20} />
                                                    {t('admin.payouts.weekly_history_title') || "Dernière Semaine (À Payer)"}
                                                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                                                        {t('admin.payouts.week_ending', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Jusqu'au ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                    <div className="ml-auto flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl">
                                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('common.total') || "Total Global"}</span>
                                                        <span className="text-xl font-mono font-bold text-green-400 animate-in fade-in zoom-in duration-500">
                                                            ${Object.values(payoutSummary.ready || {}).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    { id: 'bank', icon: Landmark, label: t('billing.method_bank'), color: 'text-blue-400' },
                                                    { id: 'crypto', icon: Wallet, label: t('billing.method_crypto'), color: 'text-indigo-400' },
                                                    { id: 'paxum', icon: Mail, label: 'Paxum', color: 'text-pink-400' }
                                                ].map(m => {
                                                    const data = payoutSummary.ready?.[m.id] || { count: 0, total: 0 };
                                                    return (
                                                        <div key={m.id} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${m.color}`}>
                                                                    <m.icon size={20} />
                                                                </div>
                                                                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                                    {data.count || 0} {t('admin.payouts.requests') || "Requests"}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-xs text-neutral-500 font-medium">{m.label}</div>
                                                                <div className="text-2xl font-bold text-white font-mono">
                                                                    ${(data.total || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex flex-col gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        setReviewMethod(m.id as any);
                                                                        setReviewSection('ready');
                                                                        setReviewModalOpen(true);
                                                                    }}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-3 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Search size={14} />
                                                                    DÉTAILS & REVIEW
                                                                </button>
                                                                <button 
                                                                    onClick={() => downloadPayoutCSV(m.id)}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 opacity-50"
                                                                >
                                                                    <FileText size={14} />
                                                                    {t('admin.payouts.download_csv') || "Download CSV"}
                                                                </button>
                                                                
                                                                {(data.count || 0) > 0 && (
                                                                    <button 
                                                                        disabled={isApprovatingBatch === m.id}
                                                                        onClick={() => approveBatchPayout(m.id, payoutSummary.cutoff)}
                                                                        className="w-full bg-green-500/80 hover:bg-green-400 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                                                                    >
                                                                        {isApprovatingBatch === m.id ? (
                                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle size={14} />
                                                                        )}
                                                                        {t('admin.payouts.batch_approve') || `VALIDATE ALL AS PAID`}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Ongoing Section (Current Week) */}
                                        <div className="space-y-6 pt-6 border-t border-white/5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-light text-white/50 flex items-center gap-3">
                                                    <HistoryIcon className="text-neutral-500" size={20} />
                                                    {t('admin.payouts.ongoing_week_title') || "Semaine en cours (Ongoing)"}
                                                    <span className="text-xs bg-white/5 text-neutral-500 px-2 py-1 rounded-lg border border-white/10">
                                                        {t('admin.payouts.since_date', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Depuis le ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                    <div className="ml-auto flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl opacity-60">
                                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('common.total') || "Total Global"}</span>
                                                        <span className="text-xl font-mono font-bold text-white leading-none">
                                                            ${Object.values(payoutSummary.ongoing || {}).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    { id: 'bank', icon: Landmark, label: t('billing.method_bank'), color: 'text-blue-400' },
                                                    { id: 'crypto', icon: Wallet, label: t('billing.method_crypto'), color: 'text-indigo-400' },
                                                    { id: 'paxum', icon: Mail, label: 'Paxum', color: 'text-pink-400' }
                                                ].map(m => {
                                                    const data = payoutSummary.ongoing?.[m.id] || { count: 0, total: 0 };
                                                    return (
                                                        <div key={m.id} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl relative overflow-hidden group opacity-80 hover:opacity-100 transition-all">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${m.color}`}>
                                                                    <m.icon size={20} />
                                                                </div>
                                                                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                                    {data.count || 0} {t('admin.payouts.requests') || "Requests"}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-xs text-neutral-500 font-medium">{m.label}</div>
                                                                <div className="text-2xl font-bold text-white font-mono opacity-50">
                                                                    ${(data.total || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="mt-6 flex flex-col gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        setReviewMethod(m.id as any);
                                                                        setReviewSection('ongoing');
                                                                        setReviewModalOpen(true);
                                                                    }}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-3 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Search size={14} />
                                                                    DÉTAILS & REVIEW
                                                                </button>
                                                                <button 
                                                                    onClick={() => downloadPayoutCSV(m.id)}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 opacity-50"
                                                                >
                                                                    <FileText size={14} />
                                                                    {t('admin.payouts.download_csv') || "Download CSV"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : ("""

# Replace section from 1916 to the start of the next tab part
payout_tab_start = "{payoutSubTab === 'pending' ? ("
payout_tab_end_marker = ") : ("

start_idx = content.find(payout_tab_start)
# We seek the occurrence of that marker AFTER the start
end_idx = content.find(payout_tab_end_marker, start_idx + 100)

if start_idx != -1 and end_idx != -1:
    # We also want to remove the table which comes after the </div> of the summary
    # The table block ends with </>\n                        )\n                    ) : (
    
    # Actually, I'll just replace everything between payout_tab_start and the end of the pending block
    # based on the content I viewed earlier.
    
    # In my view_file output:
    # 2144:                         ) : (
    # This was the end of the pending subtab.
    
    content = content[:start_idx] + new_payout_tab + content[end_idx:]
    print("Success replacing tab content")

# 2. ADD MODAL AT THE END
modal_jsx = \"\"\"
            {/* Payout Review Modal */}
            {reviewModalOpen && reviewMethod && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-neutral-900 border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl text-indigo-400">
                                    {reviewMethod === 'bank' ? <Landmark size={24} /> : reviewMethod === 'crypto' ? <Wallet size={24} /> : <Mail size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold uppercase tracking-tighter">
                                        Payout Review: {reviewMethod.toUpperCase()}
                                    </h4>
                                    <p className="text-xs text-neutral-500 font-medium">
                                        {reviewSection === 'ready' ? "Dernière Semaine (Ready to Pay)" : "Semaine en cours (Ongoing)"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setReviewModalOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {payoutRequests.filter(p => {
                                const isMethod = p.method === reviewMethod;
                                const date = new Date(p.createdAt);
                                const cutoff = new Date(payoutSummary.cutoff);
                                const isReady = date <= cutoff;
                                return isMethod && (reviewSection === 'ready' ? isReady : !isReady);
                            }).length === 0 ? (
                                <div className="py-20 text-center text-neutral-500 italic">Aucune transaction trouvée pour ce filtre.</div>
                            ) : (
                                payoutRequests.filter(p => {
                                    const isMethod = p.method === reviewMethod;
                                    const date = new Date(p.createdAt);
                                    const cutoff = new Date(payoutSummary.cutoff);
                                    const isReady = date <= cutoff;
                                    return isMethod && (reviewSection === 'ready' ? isReady : !isReady);
                                }).map((p, i) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-all">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-white text-lg">{p.billingInfo.name}</span>
                                                <span className="text-[10px] bg-white/5 text-neutral-500 px-2 py-0.5 rounded-full border border-white/5">{p.modelEmail}</span>
                                            </div>
                                            <div className="text-xs text-neutral-400 space-y-1 font-medium bg-black/20 p-3 rounded-xl border border-white/5">
                                                {p.method === 'bank' && (
                                                    <div className="grid grid-cols-2 gap-x-4">
                                                        <div><span className="text-neutral-600 block text-[9px] uppercase font-black uppercase">IBAN</span> <span className="font-mono text-white tracking-tighter">{p.billingInfo.bankIban}</span></div>
                                                        <div><span className="text-neutral-600 block text-[9px] uppercase font-black uppercase">SWIFT/BIC</span> <span className="font-mono text-white tracking-tighter">{p.billingInfo.bankSwift}</span></div>
                                                    </div>
                                                )}
                                                {p.method === 'crypto' && (
                                                    <div><span className="text-neutral-600 block text-[9px] uppercase font-black uppercase">Polygon Wallet (USDC)</span> <span className="font-mono text-white break-all">{p.billingInfo.cryptoAddress}</span></div>
                                                )}
                                                {p.method === 'paxum' && (
                                                    <div><span className="text-neutral-600 block text-[9px] uppercase font-black uppercase">Paxum Email</span> <span className="font-mono text-white">{p.billingInfo.paxumEmail}</span></div>
                                                )}
                                                <div className="pt-2 mt-2 border-t border-white/5 text-[9px] opacity-40 uppercase tracking-widest italic">
                                                    {p.billingInfo.address}, {p.billingInfo.country}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center md:items-end gap-3 min-w-[120px]">
                                            <div className="text-2xl font-black text-green-400 font-mono italic underline decoration-green-900/50 decoration-4">
                                                ${p.amount.toFixed(2)}
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => postponePayout(p.id)}
                                                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/20 transition-all flex items-center justify-center gap-2 text-[10px] font-bold"
                                                    title="Reporter à la semaine prochaine"
                                                >
                                                    <Clock size={14} /> REPORTER
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        if (confirm(t('admin.payouts.confirm_reject') || "Reject this payout and refund the balance?")) {
                                                            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.kinky.live"}/api/admin/payouts/${p.id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                                                            fetchPayoutRequests();
                                                        }
                                                    }}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2 text-[10px] font-bold"
                                                    title="Rejeter et rembourser"
                                                >
                                                    <XCircle size={14} /> REJETER
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">
                                Transaction review system powered by Lively Admin
                            </p>
                        </div>
                    </div>
                </div>
            )}
\"\"\"

# Insert before last </div>
last_div_idx = content.rfind('</div>')
if last_div_idx != -1:
    content = content[:last_div_idx] + modal_jsx + content[last_div_idx:]
    print("Success adding modal")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
