"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  LanguageMeta,
  TranslationStrings,
  getTranslations,
} from "@/lib/translations";

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setCurrentLanguage: (lang: LanguageCode) => void;
  t: TranslationStrings;
  bcp47: string;
  supportedLanguages: LanguageMeta[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>("English");

  // Optional: load persisted language preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ipsakti_preferred_language") as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setCurrentLanguageState(saved);
      }
    }
  }, []);

  const setCurrentLanguage = (lang: LanguageCode) => {
    setCurrentLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("ipsakti_preferred_language", lang);
    }
  };

  const activeMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  const t = getTranslations(currentLanguage);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage,
        t,
        bcp47: activeMeta.bcp47,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
