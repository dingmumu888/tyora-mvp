"use client";

import { translateCommunityText } from "@/components/community-text";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateMyTyora, type MyTyoraKey } from "@/lib/my-tyora-i18n";

export default function IdeaOwnerLifecycleNotice({
  status,
  reason,
  moderatedAt,
  canRevise
}: {
  status: string;
  reason?: string;
  moderatedAt?: string;
  canRevise: boolean;
}) {
  const { language } = usePublicLanguage();
  const t = (key: MyTyoraKey, values?: Record<string, string | number>) => translateMyTyora(language, key, values);
  return (
    <div className="mt-4 rounded-2xl border border-[#fedf89] bg-[#fffcf5] px-4 py-3 text-sm leading-6 text-[#93370d]">
      <p className="font-semibold">{t("lifecycleState", { status: translateCommunityText(language, status) })}</p>
      {reason ? <p className="mt-1">{t("moderationReason", { reason })}</p> : null}
      {moderatedAt ? <p>{t("moderatedOn", { time: new Date(moderatedAt).toLocaleString() })}</p> : null}
      {canRevise ? <p className="mt-1 font-semibold">{t("nextActionEdit")}</p> : null}
    </div>
  );
}
