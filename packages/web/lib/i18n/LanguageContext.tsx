'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Locale = 'en' | 'es' | 'zh';

type Messages = Record<string, any>;

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
    tRaw: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'suiloop-locale';

// Cache loaded JSON so we don't re-fetch
const cache: Record<string, Messages> = {};

async function fetchMessages(locale: Locale): Promise<Messages> {
    if (cache[locale]) return cache[locale];
    try {
        const mod = await import(`../../messages/${locale}.json`);
        cache[locale] = mod.default || mod;
        return cache[locale];
    } catch (e) {
        console.warn(`[i18n] Failed to load ${locale}`, e);
        return {};
    }
}

// Resolve dot-notation key (returns any type)
function resolve(obj: Messages, key: string): any {
    let cur: any = obj;
    const parts = key.split('.');
    for (const part of parts) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = cur[part];
    }
    return cur;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleRaw] = useState<Locale>('en');
    // Store messages IN React state so changes trigger re-renders
    const [messages, setMessages] = useState<Messages>({});
    const [enMessages, setEnMessages] = useState<Messages>({});

    // On mount: restore saved locale & preload English always
    useEffect(() => {
        let saved: Locale = 'en';
        try {
            saved = (localStorage.getItem(STORAGE_KEY) as Locale) || 'en';
        } catch { }

        // Always load English first (fallback), then the saved locale
        Promise.all([fetchMessages('en'), fetchMessages(saved)]).then(([en, loc]) => {
            setEnMessages(en);
            setMessages(loc);
            setLocaleRaw(saved);
            try { document.documentElement.lang = saved; } catch { }
        });
    }, []);

    const setLocale = useCallback(async (newLocale: Locale) => {
        setLocaleRaw(newLocale);
        try { localStorage.setItem(STORAGE_KEY, newLocale); } catch { }
        try { document.documentElement.lang = newLocale; } catch { }

        const msgs = await fetchMessages(newLocale);
        setMessages(msgs);
    }, []);

    const t = useCallback((key: string): string => {
        const val = resolve(messages, key);
        if (typeof val === 'string') return val;

        const fallback = resolve(enMessages, key);
        if (typeof fallback === 'string') return fallback;

        return key;
    }, [messages, enMessages]);

    // tRaw allows retrieving arrays/objects
    const tRaw = useCallback((key: string): any => {
        const val = resolve(messages, key);
        if (val !== undefined) return val;

        const fallback = resolve(enMessages, key);
        return fallback !== undefined ? fallback : undefined;
    }, [messages, enMessages]);

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, tRaw }}>
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
