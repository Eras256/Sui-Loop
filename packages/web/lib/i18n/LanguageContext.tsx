'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'en' | 'es' | 'zh';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'suiloop-locale';

// Lazy-load translations
const translations: Record<Locale, Record<string, any>> = {
    en: {},
    es: {},
    zh: {},
};

// Load translations dynamically
async function loadTranslations(locale: Locale) {
    if (Object.keys(translations[locale]).length > 0) return;
    try {
        const data = await import(`../../messages/${locale}.json`);
        translations[locale] = data.default;
    } catch (e) {
        console.warn(`Failed to load translations for ${locale}`, e);
    }
}

// Resolve dot-notation key (e.g. "nav.home")
function resolve(obj: Record<string, any>, key: string): string {
    const parts = key.split('.');
    let current: any = obj;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return key;
        current = current[part];
    }
    return typeof current === 'string' ? current : key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');
    const [loaded, setLoaded] = useState(false);

    // Load saved locale + preload all translations on mount
    useEffect(() => {
        const saved = (localStorage.getItem(STORAGE_KEY) as Locale) || 'en';
        setLocaleState(saved);

        // Preload all 3 languages in parallel
        Promise.all([
            loadTranslations('en'),
            loadTranslations('es'),
            loadTranslations('zh'),
        ]).then(() => setLoaded(true));
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(STORAGE_KEY, newLocale);
        // Update html lang attribute for SEO
        document.documentElement.lang = newLocale;
    };

    const t = (key: string): string => {
        if (!loaded) return key;
        const result = resolve(translations[locale], key);
        // Fallback to English if key missing in current locale
        if (result === key && locale !== 'en') {
            return resolve(translations['en'], key);
        }
        return result;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextType {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}

export const LOCALE_LABELS: Record<Locale, { flag: string; label: string; native: string }> = {
    en: { flag: '🇺🇸', label: 'English', native: 'English' },
    es: { flag: '🇲🇽', label: 'Spanish', native: 'Español' },
    zh: { flag: '🇨🇳', label: 'Chinese', native: '中文' },
};
