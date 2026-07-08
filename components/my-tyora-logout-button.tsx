"use client";

import { LogOut } from "lucide-react";

export default function MyTyoraLogoutButton() {
  async function logout() {
    await fetch("/api/community/logout", { method: "POST" }).catch(() => undefined);
    window.dispatchEvent(new CustomEvent("tyora:community-logout"));
    window.location.href = "/me";
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#fed7aa] bg-[#fff7ed] px-3 text-sm font-semibold text-[#9a3412] transition hover:bg-[#ffedd5]"
    >
      <LogOut size={15} /> Log out
    </button>
  );
}
