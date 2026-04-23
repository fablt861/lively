import os

filepath = '/Users/fabrice/APPS/LC Bis/lively/frontend/src/components/ModelBillingModal.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacements
replacements = [
    (
        'onChange={e => setInfo({...info, country: e.target.value})}\n                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"',
        'onChange={e => setInfo({...info, country: e.target.value})}\n                                            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer ${validationErrors.country ? \'border-red-500/50 bg-red-500/5\' : \'border-white/10\'}`}'
    ),
    (
        '</select>\n                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">\n                                            <ChevronDown size={16} />\n                                        </div>\n                                    </div>\n                                </div>',
        '</select>\n                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">\n                                            <ChevronDown size={16} />\n                                        </div>\n                                    </div>\n                                    {validationErrors.country && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.country}</p>}\n                                </div>'
    ),
    (
        'onChange={e => setInfo({...info, address: e.target.value})}\n                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"',
        'onChange={e => setInfo({...info, address: e.target.value})}\n                                        className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none ${validationErrors.address ? \'border-red-500/50 bg-red-500/5\' : \'border-white/10\'}`}'
    ),
    (
        'className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"\n                                    />\n                                </div>',
        'className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none ${validationErrors.address ? \'border-red-500/50 bg-red-500/5\' : \'border-white/10\'}`}\n                                    />\n                                    {validationErrors.address && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.address}</p>}\n                                </div>'
    ),
    # And so on for all others... 
]

# Actually, it's risky. I'll just write the WHOLE JSX block from "Form" to "Footer" using the python script.

jsx_start = '{/* Form */}'
jsx_end = '                {/* Footer */}'

# I'll build the new block carefully.
new_block = """                {/* Form */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    {loading ? (
                        <div className="py-20 text-center text-neutral-500 animate-pulse">{t('dashboard.history_loading')}</div>
                    ) : (
                        <div className="space-y-8">
                            {/* Basic Info Group */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <User size={12} /> {t('billing.name')}
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        value={info.name}
                                        onChange={e => setInfo({...info, name: e.target.value})}
                                        className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all ${validationErrors.name ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                    />
                                    {validationErrors.name && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <Globe size={12} /> {t('billing.country')}
                                    </label>
                                    <div className="relative group">
                                        <select 
                                            required
                                            value={info.country}
                                            onChange={e => setInfo({...info, country: e.target.value})}
                                            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer ${validationErrors.country ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                        >
                                            <option value="" disabled>{t('billing.select_country')}</option>
                                            {countries.map(c => (
                                                <option key={c.code} value={c.code}>{language === 'fr' ? c.nameFr : c.nameEn} {c.flag}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                    {validationErrors.country && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.country}</p>}
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <MapPin size={12} /> {t('billing.address')}
                                    </label>
                                    <textarea 
                                        required
                                        rows={2}
                                        value={info.address}
                                        onChange={e => setInfo({...info, address: e.target.value})}
                                        className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none ${validationErrors.address ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                    />
                                    {validationErrors.address && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.address}</p>}
                                </div>
                            </div>

                            {/* Method Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                    {t('billing.method')}
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'bank', icon: Landmark, label: t('billing.method_bank') },
                                        { id: 'paxum', icon: Mail, label: t('billing.method_paxum') },
                                        { id: 'crypto', icon: Wallet, label: t('billing.method_usdc_polygon') }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setInfo({...info, method: m.id as any})}
                                            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${info.method === m.id ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'}`}
                                        >
                                            <m.icon size={24} />
                                            <span className="text-[10px] font-bold uppercase tracking-tighter text-center">{m.label}</span>
                                            {/* Fee Badge */}
                                            <div className="mt-1 px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-black tracking-widest text-neutral-500">
                                                {t('billing.fee_notice', { fee: payoutFee })}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                {info.method === 'bank' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                                <Globe size={12} /> {t('billing.bank_country')}
                                            </label>
                                            <div className="relative group">
                                                <select 
                                                    required
                                                    value={info.bankCountry || ""}
                                                    onChange={e => setInfo({...info, bankCountry: e.target.value})}
                                                    className={`w-full bg-black/40 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer ${validationErrors.bankCountry ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                >
                                                    <option value="" disabled>{t('billing.select_bank_country')}</option>
                                                    {countries.map(c => (
                                                        <option key={c.code} value={c.code}>{language === 'fr' ? c.nameFr : c.nameEn} {c.flag}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                            {validationErrors.bankCountry && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankCountry}</p>}
                                        </div>

                                        {/* Dynamic Fields based on Bank Country */}
                                        {info.bankCountry && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {/* SEPA (Europe) */}
                                                {['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'LU', 'IE', 'PT', 'GR', 'AT', 'FI', 'EE', 'LV', 'LT', 'SK', 'SI', 'MT', 'CY', 'CH', 'LI', 'NO', 'IS', 'HR', 'MC', 'SM', 'AD', 'VA'].includes(info.bankCountry) ? (
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_iban')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankIban || ""}
                                                                onChange={e => setInfo({...info, bankIban: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankIban ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankIban && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankIban}</p>}
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_swift')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankSwift || ""}
                                                                onChange={e => setInfo({...info, bankSwift: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankSwift ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankSwift && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankSwift}</p>}
                                                        </div>
                                                    </>
                                                ) : info.bankCountry === 'US' ? (
                                                    /* USA */
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_routing')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankRouting || ""}
                                                                onChange={e => setInfo({...info, bankRouting: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankRouting ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankRouting && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankRouting}</p>}
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_account')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankAccount || ""}
                                                                onChange={e => setInfo({...info, bankAccount: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankAccount ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankAccount && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankAccount}</p>}
                                                        </div>
                                                    </>
                                                ) : info.bankCountry === 'GB' ? (
                                                    /* UK */
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_sort_code')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankSortCode || ""}
                                                                onChange={e => setInfo({...info, bankSortCode: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankSortCode ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankSortCode && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankSortCode}</p>}
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_account')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankAccount || ""}
                                                                onChange={e => setInfo({...info, bankAccount: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankAccount ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankAccount && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankAccount}</p>}
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Global / Others */
                                                    <>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_swift')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankSwift || ""}
                                                                onChange={e => setInfo({...info, bankSwift: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankSwift ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankSwift && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankSwift}</p>}
                                                        </div>
                                                        <div className="space-y-2 col-span-2">
                                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.bank_account')}</label>
                                                            <input 
                                                                type="text"
                                                                required
                                                                value={info.bankAccount || ""}
                                                                onChange={e => setInfo({...info, bankAccount: e.target.value})}
                                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono ${validationErrors.bankAccount ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                            />
                                                            {validationErrors.bankAccount && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.bankAccount}</p>}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                                {info.method === 'paxum' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.paxum_email')}</label>
                                        <input 
                                            type="email"
                                            required
                                            value={info.paxumEmail || ""}
                                            onChange={e => setInfo({...info, paxumEmail: e.target.value})}
                                            className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all ${validationErrors.paxumEmail ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                            placeholder="votre@email-paxum.com"
                                        />
                                        {validationErrors.paxumEmail && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.paxumEmail}</p>}
                                    </div>
                                )}
                                {info.method === 'crypto' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.crypto_network')}</label>
                                            <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 text-indigo-400 font-bold text-sm">
                                                USDC (Polygon / MATIC Network)
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{t('billing.crypto_address')}</label>
                                            <input 
                                                type="text"
                                                required
                                                value={info.cryptoAddress || ""}
                                                onChange={e => setInfo({...info, cryptoAddress: e.target.value})}
                                                className={`w-full bg-white/5 border rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm ${validationErrors.cryptoAddress ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                                placeholder="0x..."
                                            />
                                            {validationErrors.cryptoAddress && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-in fade-in duration-300">{validationErrors.cryptoAddress}</p>}
                                        </div>
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                            <p className="text-[10px] text-amber-500 font-bold leading-relaxed">
                                                {t('billing.crypto_warning')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>"""

start_index = content.find(jsx_start)
end_index = content.find(jsx_end)

if start_index != -1 and end_index != -1:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content[:start_index] + new_block + content[end_index:])
    print("Sucessfully updated JSX")
else:
    print(f"Could not find markers: start={start_index}, end={end_index}")
