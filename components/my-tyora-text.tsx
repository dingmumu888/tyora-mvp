"use client";

import { usePublicLanguage } from "@/components/public-language-provider";
import { translateMyTyora, type MyTyoraKey } from "@/lib/my-tyora-i18n";

export default function MyTyoraText({
  textKey,
  values
}: {
  textKey: MyTyoraKey;
  values?: Record<string, string | number>;
}) {
  const { language } = usePublicLanguage();
  return <>{translateMyTyora(language, textKey, values)}</>;
}
