"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';

type Language = 'fr' | 'en' | 'de' | 'es' | 'nl' | 'it' | 'ro' | 'uk' | 'pt' | 'ru' | 'sv' | 'no' | 'fi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Map browser languages to our supported languages
const languageMap: Record<string, Language> = {
    'fr': 'fr', 'en': 'en', 'de': 'de', 'es': 'es', 'nl': 'nl', 'it': 'it',
    'ro': 'ro', 'uk': 'uk', 'pt': 'pt', 'ru': 'ru', 'sv': 'sv', 'no': 'no', 'fi': 'fi'
};

// Global cache to persist translations across remounts (App Router layout transitions)
const translationsCache: Record<string, Record<string, string>> = {};
const statusCache: Record<string, boolean> = {};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const urlLocale = (params?.locale as Language) || 'en';

    // Initialize from cache if available to prevent flicker
    const [language, setLanguageState] = useState<Language>(urlLocale);
    const [translations, setTranslations] = useState<Record<string, string>>(translationsCache[urlLocale] || {});
    const [isLoaded, setIsLoaded] = useState(statusCache[urlLocale] || false);

    // Sync state with URL locale changes without necessarily resetting isLoaded
    useEffect(() => {
        if (urlLocale && urlLocale !== language && languageMap[urlLocale]) {
            setLanguageState(urlLocale);
            localStorage.setItem('preferred_language', urlLocale);
            
            // If we don't have translations for this new language, then we mark as not loaded
            if (!translationsCache[urlLocale]) {
                setIsLoaded(false);
            } else {
                setTranslations(translationsCache[urlLocale]);
                setIsLoaded(true);
            }
        }
    }, [urlLocale, language]);

    useEffect(() => {
        const savedLang = localStorage.getItem('preferred_language') as Language;
        if (!params?.locale) {
            if (savedLang && languageMap[savedLang]) {
                setLanguageState(savedLang);
            } else {
                const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
                if (languageMap[browserLang]) {
                    setLanguageState(languageMap[browserLang]);
                }
            }
        }
    }, [params?.locale]);

    useEffect(() => {
        // Only fetch if not in cache or if we need a refresh
        const loadTranslations = async () => {
            if (translationsCache[language] && statusCache[language]) {
                setTranslations(translationsCache[language]);
                setIsLoaded(true);
                return;
            }

            try {
                const res = await fetch(`/locales/${language}.json?v=2026_v10`);
                const data = await res.json();
                translationsCache[language] = data;
                statusCache[language] = true;
                setTranslations(data);
                setIsLoaded(true);
                document.documentElement.lang = language;
            } catch (err) {
                console.error(`Failed to load ${language} translations:`, err);
                setIsLoaded(true);
            }
        };
        loadTranslations();
    }, [language]);

    const setLanguage = (lang: Language) => {
        // Do NOT set isLoaded(false) here to avoid the black flicker
        // The URL change will trigger the sync effect
        setLanguageState(lang);
        localStorage.setItem('preferred_language', lang);

        const segments = pathname.split('/');
        if (languageMap[segments[1]]) {
            segments[1] = lang;
        } else {
            segments.splice(1, 0, lang);
        }
        
        // Use replace to avoid history cluttering during lang switches
        router.replace(segments.join('/'));
    };

    const t = (key: string, params?: Record<string, any>) => {
        // Fallback to key if not loaded yet, but try to use cache if possible
        const text = translations[key] || translationsCache[language]?.[key] || key;
        
        if (!params) return text;
        
        let processedText = text;
        Object.entries(params).forEach(([k, v]) => {
            processedText = processedText.replace(`{{${k}}}`, v.toString());
        });
        return processedText;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {!isLoaded && Object.keys(translations).length === 0 ? (
                <div className="fixed inset-0 bg-[#050505] z-[9999] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="notranslate" translate="no">
                    {children}
                </div>
            )}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useTranslation must be used within LanguageProvider');
    return context;
};
