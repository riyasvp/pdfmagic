"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { locales, localeNames, type Locale } from "@/i18n";
import { defaultLocale } from "@/i18n";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  localeNames: typeof localeNames;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ 
  children, 
  initialLocale = defaultLocale 
}: { 
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, any>>({});

  // Load messages when locale changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(`@/messages/${locale}.json`);
        setMessages(msgs.default);
      } catch {
        // Fallback to English
        const msgs = await import(`@/messages/en.json`);
        setMessages(msgs.default);
      }
    };
    loadMessages();
  }, [locale]);

  // Save locale preference
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("pdfmagic-locale", newLocale);
    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
    // For RTL languages
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
  };

  // Load saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem("pdfmagic-locale") as Locale | null;
    if (saved && locales.includes(saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }
  }, []);

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || `{${paramKey}}`;
      });
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, localeNames }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslations must be used within I18nProvider");
  }
  return context;
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    return defaultLocale;
  }
  return context.locale;
}
