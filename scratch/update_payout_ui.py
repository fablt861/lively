import os

filepath = '/Users/fabrice/APPS/LC Bis/lively/frontend/src/app/[locale]/hq-center/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Cards in READY section (Last Week)
card_ready_target = """                                                                 {(data.count || 0) > 0 && (
                                                                    <button 
                                                                        disabled={isApprovatingBatch === m.id}
                                                                        onClick={() => approveBatchPayout(m.id, payoutSummary.cutoff)}
                                                                        className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-2 animate-pulse disabled:opacity-50"
                                                                    >
                                                                        {isApprovatingBatch === m.id ? (
                                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle size={14} />
                                                                        )}
                                                                        {t('admin.payouts.batch_approve') || `MARQUER TOUS COMME PAYÉS`}
                                                                    </button>
                                                                )}"""

card_ready_replacement = """                                                                <button 
                                                                    onClick={() => {
                                                                        setReviewMethod(m.id as any);
                                                                        setReviewSection('ready');
                                                                        setReviewModalOpen(true);
                                                                    }}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Search size={14} />
                                                                    DÉTAILS & REVIEW
                                                                </button>

                                                                {(data.count || 0) > 0 && (
                                                                    <button 
                                                                        disabled={isApprovatingBatch === m.id}
                                                                        onClick={() => approveBatchPayout(m.id, payoutSummary.cutoff)}
                                                                        className="w-full bg-green-500 hover:bg-green-400 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                                                                    >
                                                                        {isApprovatingBatch === m.id ? (
                                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle size={14} />
                                                                        )}
                                                                        {t('admin.payouts.batch_approve') || `MARK AS ALL PAID`}
                                                                    </button>
                                                                )}"""

# 2. Update Cards in ONGOING section
card_ongoing_target = """                                                             <div className="mt-6">
                                                                <button 
                                                                    onClick={() => downloadPayoutCSV(m.id)}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <FileText size={14} />
                                                                    {t('admin.payouts.download_csv') || "Download CSV"}
                                                                </button>
                                                            </div>"""

card_ongoing_replacement = """                                                             <div className="mt-6 flex flex-col gap-2">
                                                                <button 
                                                                    onClick={() => downloadPayoutCSV(m.id)}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <FileText size={14} />
                                                                    {t('admin.payouts.download_csv') || "Download CSV"}
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        setReviewMethod(m.id as any);
                                                                        setReviewSection('ongoing');
                                                                        setReviewModalOpen(true);
                                                                    }}
                                                                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-2 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Search size={14} />
                                                                    DÉTAILS & REVIEW
                                                                </button>
                                                            </div>"""

# 3. Remove bottom table
# I'll search for the block between {payoutRequests.length === 0 ? ( and )}
# and replace it with just </> or something.

table_start = "{payoutRequests.length === 0 ?"
table_end = "</>\n                        )\n                    ) : ("

# Wait, the table end might be tricky.
# I'll replace the whole block from table_start to its closing.

if card_ready_target in content:
    content = content.replace(card_ready_target, card_ready_replacement)
    print("Updated ready cards")

if card_ongoing_target in content:
    content = content.replace(card_ongoing_target, card_ongoing_replacement)
    print("Updated ongoing cards")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
