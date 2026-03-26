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

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const urlLocale = params?.locale as Language;

    const [language, setLanguageState] = useState<Language>(urlLocale || 'en');
    const [translations, setTranslations] = useState<Record<string, string>>({});

    useEffect(() => {
        // Sync state if URL locale changes
        if (urlLocale && urlLocale !== language && languageMap[urlLocale]) {
            setLanguageState(urlLocale);
            localStorage.setItem('preferred_language', urlLocale);
        }
    }, [urlLocale]);

    useEffect(() => {
        const savedLang = localStorage.getItem('preferred_language') as Language;
        if (!urlLocale) {
            if (savedLang && languageMap[savedLang]) {
                setLanguageState(savedLang);
            } else {
                const browserLang = navigator.language.split('-')[0];
                if (languageMap[browserLang]) {
                    setLanguageState(languageMap[browserLang]);
                }
            }
        }
    }, [urlLocale]);

    useEffect(() => {
        // 2. Load translations
        const loadTranslations = async () => {
            try {
                const res = await fetch(`/locales/${language}.json`);
                const data = await res.json();
                setTranslations(data);
                document.documentElement.lang = language;
            } catch (err) {
                console.error(`Failed to load ${language} translations:`, err);
            }
        };
        loadTranslations();
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('preferred_language', lang);

        // Navigate to the new localized route
        const segments = pathname.split('/');
        // If segments[1] is a locale, replace it.
        if (languageMap[segments[1]]) {
            segments[1] = lang;
        } else {
            // This shouldn't happen with middleware, but handle just in case
            segments.splice(1, 0, lang);
        }
        router.push(segments.join('/'));
    };

    const t = (key: string, params?: Record<string, any>) => {
        let text = translations[key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{{${k}}}`, v.toString());
            });
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useTranslation must be used within LanguageProvider');
    return context;
};
