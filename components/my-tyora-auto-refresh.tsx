"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateMyTyora, type MyTyoraKey } from "@/lib/my-tyora-i18n";

const REFRESH_INTERVAL_MS = 15_000;

export default function MyTyoraAutoRefresh({ enabled = true }: { enabled?: boolean }) {
  const router = useRouter();
  const { language } = usePublicLanguage();
  const t = (key: MyTyoraKey) => translateMyTyora(language, key);
  const refreshingRef = useRef(false);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || document.visibilityState !== "visible" || refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const response = await fetch("/api/community/session", { cache: "no-store" });
      if (!response.ok) throw new Error("refresh-failed");
      setFailed(false);
      router.refresh();
      window.dispatchEvent(new CustomEvent("tyora:community-revalidate"));
    } catch {
      setFailed(true);
    } finally {
      refreshingRef.current = false;
    }
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, refresh]);

  if (!failed) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex max-w-sm items-center gap-3 rounded-2xl border border-[#fedf89] bg-[#fffcf5] px-4 py-3 text-sm text-[#93370d] shadow-lg" role="status">
      <span>{t("autoRefreshFailed")}</span>
      <button type="button" onClick={() => void refresh()} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#101216] px-3 py-1.5 text-xs font-semibold text-white">
        <RefreshCw size={12} /> {t("retryRefresh")}
      </button>
    </div>
  );
}
