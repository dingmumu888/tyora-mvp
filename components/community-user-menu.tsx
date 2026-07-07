"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Bell, Heart, LogOut, MessageCircle, PenLine, Settings } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";
import CommunityProfileModal, { CommunitySessionUser } from "@/components/community-profile-modal";
import EmailLogin from "@/components/email-login";
import { cn } from "@/lib/utils";

export default function CommunityUserMenu({
  loginClassName,
  loginChildren = "Email Login",
  loginOpenSignal,
  loginOnSuccess
}: {
  loginClassName?: string;
  loginChildren?: ReactNode;
  loginOpenSignal?: number;
  loginOnSuccess?: () => void;
}) {
  const [user, setUser] = useState<CommunitySessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function refreshSession() {
    try {
      const response = await fetch("/api/community/session");
      const payload = await response.json();
      setUser(payload.user || null);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    void refreshSession();
    function onLogin(event: Event) {
      const detail = (event as CustomEvent<{ user?: CommunitySessionUser }>).detail;
      if (detail?.user) setUser(detail.user);
      void refreshSession();
    }
    function onProfileUpdated(event: Event) {
      const detail = (event as CustomEvent<{ user?: CommunitySessionUser }>).detail;
      if (detail?.user) setUser(detail.user);
    }
    window.addEventListener("tyora:community-login", onLogin);
    window.addEventListener("tyora:community-profile-updated", onProfileUpdated);
    return () => {
      window.removeEventListener("tyora:community-login", onLogin);
      window.removeEventListener("tyora:community-profile-updated", onProfileUpdated);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function logout() {
    await fetch("/api/community/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent("tyora:community-logout"));
  }

  if (!user) {
    return (
      <EmailLogin className={loginClassName} openSignal={loginOpenSignal} onSuccess={loginOnSuccess}>
        {loginChildren}
      </EmailLogin>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-2.5 pr-3 text-sm font-semibold text-[#101216] shadow-sm transition hover:bg-[#f6f7fb]"
        aria-label="Community profile menu"
      >
        <CommunityAvatar name={user.name} src={user.avatar} className="size-7 text-[10px]" />
        <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-3xl border border-[#e4e8ef] bg-white p-2 shadow-[0_22px_70px_rgba(16,18,22,0.16)]">
          <div className="flex items-center gap-3 rounded-2xl bg-[#f7f8fa] p-3">
            <CommunityAvatar name={user.name} src={user.avatar} className="size-11 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-[#69707d]">@{user.username}</p>
            </div>
          </div>
          <div className="mt-2 grid gap-1">
            {[
              ["My Discussions", "/me#discussions", PenLine],
              ["My Comments", "/me#comments", MessageCircle],
              ["Liked Ideas", "/me#liked", Heart],
              ["Notifications", "/me#notifications", Bell]
            ].map(([label, href, Icon]) => (
              <Link
                key={label as string}
                href={href as string}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#59616e] transition hover:bg-[#f6f7fb] hover:text-[#101216]"
              >
                <Icon size={16} /> {label as string}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setProfileOpen(true);
            }}
            className={cn("mt-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#59616e] transition hover:bg-[#f6f7fb] hover:text-[#101216]")}
          >
            <Settings size={16} /> Profile Settings
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#9a3412] transition hover:bg-[#fff7ed]"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      ) : null}

      <CommunityProfileModal open={profileOpen} user={user} mode="edit" onClose={() => setProfileOpen(false)} onSaved={(nextUser) => setUser(nextUser)} />
    </div>
  );
}
