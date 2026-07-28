"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  detectBrowserLanguage,
  normalizePublicLanguage,
  publicLanguageQueryKey,
  publicLanguageStorageKey,
  publicLocaleCopy,
  type PublicLanguage,
  type PublicLocaleCopy
} from "@/lib/public-i18n";

type PublicLanguageContextValue = {
  language: PublicLanguage;
  copy: PublicLocaleCopy;
  setLanguage: (language: PublicLanguage) => void;
};

const PublicLanguageContext = createContext<PublicLanguageContextValue | null>(null);

function requestedLanguage() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalizePublicLanguage(params.get(publicLanguageQueryKey));
  if (fromUrl) return fromUrl;
  const fromStorage = normalizePublicLanguage(window.localStorage.getItem(publicLanguageStorageKey));
  if (fromStorage) return fromStorage;
  return detectBrowserLanguage(window.navigator.languages || [window.navigator.language]);
}

export default function PublicLanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<PublicLanguage>("en");

  useEffect(() => {
    updateLanguage(requestedLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `${publicLanguageStorageKey}=${encodeURIComponent(language)}; path=/; max-age=31536000; SameSite=Lax`;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: PublicLanguage) => {
    updateLanguage(nextLanguage);
    window.localStorage.setItem(publicLanguageStorageKey, nextLanguage);
    const url = new URL(window.location.href);
    if (nextLanguage === "en") url.searchParams.delete(publicLanguageQueryKey);
    else url.searchParams.set(publicLanguageQueryKey, nextLanguage);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const value = useMemo<PublicLanguageContextValue>(() => ({
    language,
    copy: publicLocaleCopy[language],
    setLanguage
  }), [language, setLanguage]);

  return <PublicLanguageContext.Provider value={value}>{children}</PublicLanguageContext.Provider>;
}

export function usePublicLanguage() {
  const value = useContext(PublicLanguageContext);
  if (!value) throw new Error("usePublicLanguage must be used inside PublicLanguageProvider.");
  return value;
}
