"use client";

import { Languages } from "lucide-react";
import { publicLanguages, type PublicLanguage } from "@/lib/public-i18n";
import { usePublicLanguage } from "@/components/public-language-provider";

export default function PublicLanguageSwitcher({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { language, copy, setLanguage } = usePublicLanguage();

  return (
    <label className={`relative inline-flex h-10 items-center gap-1.5 rounded-md border border-[#d0d5dd] bg-white px-2 text-sm font-semibold text-[#344054] shadow-sm ${className}`}>
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">{copy.common.chooseLanguage}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as PublicLanguage)}
        aria-label={copy.common.chooseLanguage}
        className={`cursor-pointer appearance-none bg-transparent pr-4 outline-none ${compact ? "w-10" : "max-w-28"}`}
      >
        {publicLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {compact ? item.shortLabel : item.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-[9px] text-[#667085]">▼</span>
    </label>
  );
}
