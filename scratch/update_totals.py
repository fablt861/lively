import os

filepath = '/Users/fabrice/APPS/LC Bis/lively/frontend/src/app/[locale]/hq-center/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacement 1: Ready Section Total
target1 = """                                                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                                                        {t('admin.payouts.week_ending', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Jusqu'au ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                </h3>"""

replacement1 = """                                                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                                                        {t('admin.payouts.week_ending', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Jusqu'au ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                    <div className="ml-auto flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl">
                                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('common.total') || "Total Global"}</span>
                                                        <span className="text-xl font-mono font-bold text-green-400 animate-in fade-in zoom-in duration-500">
                                                            ${Object.values(payoutSummary.ready || {}).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </h3>"""

# Replacement 2: Ongoing Section Total
target2 = """                                                    <span className="text-xs bg-white/5 text-neutral-500 px-2 py-1 rounded-lg border border-white/10">
                                                        {t('admin.payouts.since_date', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Depuis le ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                </h3>"""

replacement2 = """                                                    <span className="text-xs bg-white/5 text-neutral-500 px-2 py-1 rounded-lg border border-white/10">
                                                        {t('admin.payouts.since_date', { date: new Date(payoutSummary.cutoff).toLocaleDateString() }) || `Depuis le ${new Date(payoutSummary.cutoff).toLocaleDateString()}`}
                                                    </span>
                                                    <div className="ml-auto flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-2xl opacity-60">
                                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('common.total') || "Total Global"}</span>
                                                        <span className="text-xl font-mono font-bold text-white leading-none">
                                                            ${Object.values(payoutSummary.ongoing || {}).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </h3>"""

if target1 in content and target2 in content:
    new_content = content.replace(target1, replacement1).replace(target2, replacement2)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print(f"Failed to find targets. Target1: {target1 in content}, Target2: {target2 in content}")
