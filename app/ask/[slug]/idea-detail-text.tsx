"use client";

import { useEffect, useState } from "react";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateIdeaDetail, type IdeaDetailKey } from "@/lib/idea-detail-i18n";

export function useIdeaDetailText() {
  const { language } = usePublicLanguage();
  return (key: IdeaDetailKey, values: Record<string, string | number> = {}) =>
    translateIdeaDetail(language, key, values);
}

export default function IdeaDetailText({
  textKey,
  values
}: {
  textKey: IdeaDetailKey;
  values?: Record<string, string | number>;
}) {
  const t = useIdeaDetailText();
  return <>{t(textKey, values)}</>;
}

export function IdeaRelativeTime({ value }: { value: string }) {
  const t = useIdeaDetailText();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const diff = Math.max(0, now - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return <>{t("justNow")}</>;
  if (minutes < 60) return <>{t("minutesAgo", { count: minutes })}</>;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return <>{t("hoursAgo", { count: hours })}</>;
  return <>{t("daysAgo", { count: Math.floor(hours / 24) })}</>;
}
