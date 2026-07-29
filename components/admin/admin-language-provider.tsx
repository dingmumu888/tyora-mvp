"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AdminLanguage, translateAdminText } from "@/lib/admin-i18n";

const STORAGE_KEY = "tyora-admin-language";

type AdminLanguageContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
};

const AdminLanguageContext = createContext<AdminLanguageContextValue | null>(null);

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") setLanguageState(saved);
  }, []);

  const setLanguage = useCallback((next: AdminLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<AdminLanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === "en" ? "zh" : "en"),
    t: (text) => translateAdminText(language, text)
  }), [language, setLanguage]);

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLanguage() {
  const context = useContext(AdminLanguageContext);
  if (!context) throw new Error("useAdminLanguage must be used inside AdminLanguageProvider");
  return context;
}

export function AdminText({ text }: { text: string }) {
  const { t } = useAdminLanguage();
  return <>{t(text)}</>;
}
