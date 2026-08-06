"use client";

import { LogOut } from "lucide-react";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateMyTyora } from "@/lib/my-tyora-i18n";
import { broadcastCommunitySessionChange } from "@/lib/client/community-session-sync";

export default function MyTyoraLogoutButton() {
  const { language } = usePublicLanguage();
  async function logout() {
    await fetch("/api/community/logout", { method: "POST" }).catch(() => undefined);
    broadcastCommunitySessionChange("logout");
    window.location.href = "/me";
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#fed7aa] bg-[#fff7ed] px-3 text-sm font-semibold text-[#9a3412] transition hover:bg-[#ffedd5]"
    >
      <LogOut size={15} /> {translateMyTyora(language, "logout")}
    </button>
  );
}
