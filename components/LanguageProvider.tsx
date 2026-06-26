"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import th from "@/locales/th";
import en from "@/locales/en";
import type { Translations } from "@/locales/th";

type Lang = "th" | "en";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "th",
  setLang: () => {},
  t: (key) => th[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    const stored = localStorage.getItem("mz-lang") as Lang | null;
    if (stored === "th" || stored === "en") {
      setLangState(stored);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("mz-lang", newLang);
  };

  const dict = lang === "en" ? en : th;
  const t = (key: keyof Translations): string => dict[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
