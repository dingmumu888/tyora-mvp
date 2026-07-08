"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Factory, Home, PackageSearch, Plus, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import CommunityAvatar from "@/components/community-avatar";
import { CommunitySessionUser } from "@/components/community-profile-modal";
import { defaultContent, loadContent, SiteContent } from "@/lib/storage";

type MobileTab = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (path: string, hash: string) => boolean;
};

const tabs: MobileTab[] = [
  { label: "Community", href: "/", icon: Home, match: (path) => path === "/" || path === "/ask" || (path.startsWith("/ask/") && path !== "/ask/new") },
  { label: "Source", href: "/source", icon: PackageSearch, match: (path) => path === "/source" },
  { label: "Build", href: "/build", icon: Factory, match: (path) => path === "/build" },
  { label: "Profile", href: "/me", icon: UserRound, match: (path) => path === "/me" }
];

function shouldShow(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/me") return true;
  if (pathname === "/source") return true;
  if (pathname === "/build") return true;
  if (pathname === "/ask" || pathname === "/ask/new" || pathname.startsWith("/ask/")) return true;
  return false;
}

export default function MobileBottomTabs() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [user, setUser] = useState<CommunitySessionUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const tabCopy = content.mobileTabs;

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  useEffect(() => {
    let active = true;
    async function loadNotificationCount() {
      try {
        const response = await fetch("/api/community/session", { cache: "no-store" });
        const payload = await response.json();
        if (active) {
          setNotificationCount(Number(payload.notificationCount || 0));
          setUser(payload.user || null);
        }
      } catch {
        if (active) {
          setNotificationCount(0);
          setUser(null);
        }
      }
    }
    const clearNotificationCount = () => setNotificationCount(0);
    const clearUser = () => {
      setUser(null);
      setNotificationCount(0);
    };
    void loadNotificationCount();
    window.addEventListener("tyora:community-login", loadNotificationCount);
    window.addEventListener("tyora:community-profile-updated", loadNotificationCount);
    window.addEventListener("tyora:community-logout", clearUser);
    window.addEventListener("tyora:community-notifications-read", clearNotificationCount);
    return () => {
      active = false;
      window.removeEventListener("tyora:community-login", loadNotificationCount);
      window.removeEventListener("tyora:community-profile-updated", loadNotificationCount);
      window.removeEventListener("tyora:community-logout", clearUser);
      window.removeEventListener("tyora:community-notifications-read", clearNotificationCount);
    };
  }, []);

  if (!shouldShow(pathname)) return null;

  const plusActive = pathname === "/ask/new";
  const notificationLabel = notificationCount > 99 ? "99+" : String(notificationCount);
  async function markNotificationsRead() {
    if (notificationCount <= 0) return;
    setNotificationCount(0);
    try {
      await fetch("/api/community/notifications/read", { method: "POST" });
      window.dispatchEvent(new CustomEvent("tyora:community-notifications-read"));
    } catch {
      void fetch("/api/community/session", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload) => setNotificationCount(Number(payload.notificationCount || 0)))
        .catch(() => setNotificationCount(0));
    }
  }

  return (
    <>
    {createOpen ? (
      <button
        type="button"
        aria-label="Close create menu"
        className="fixed inset-0 z-[9988] bg-transparent md:hidden"
        onClick={() => setCreateOpen(false)}
      />
    ) : null}
    {createOpen ? (
      <div className="fixed inset-x-4 bottom-[calc(6.8rem+env(safe-area-inset-bottom))] z-[9991] grid gap-2 rounded-[24px] border border-[#e4e8ef] bg-white p-3 text-[#101216] shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:hidden">
        <Link href="/ask/new" onClick={() => setCreateOpen(false)} className="rounded-2xl bg-[#101216] px-4 py-3 text-sm font-semibold text-white">
          {tabCopy.startDiscussion}
          <span className="mt-1 block text-xs font-medium text-white/70">{tabCopy.startDiscussionSubtitle}</span>
        </Link>
        <Link href="/source" onClick={() => setCreateOpen(false)} className="rounded-2xl border border-[#dfe5ee] bg-[#f8fafc] px-4 py-3 text-sm font-semibold">
          {tabCopy.sourceProduct}
          <span className="mt-1 block text-xs font-medium text-[#687284]">{tabCopy.sourceProductSubtitle}</span>
        </Link>
      </div>
    ) : null}
    <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[9990] rounded-[28px] border border-white/10 bg-[#07080a]/96 px-2 py-2 text-white shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname, hash);
          return (
            <Link key={tab.label} href={tab.href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition active:scale-95 ${active ? "bg-white/8 text-white" : "text-white/48"}`}>
              <Icon size={20} strokeWidth={active ? 2.6 : 2.1} />
              <span>{tab.label === "Community" ? tabCopy.community : tab.label === "Source" ? tabCopy.source : tab.label}</span>
            </Link>
          );
        })}

        <button type="button" onClick={() => setCreateOpen((value) => !value)} className="mx-auto -mt-5 flex flex-col items-center gap-1 active:scale-95" aria-label="Create">
          <span className={`flex size-14 items-center justify-center rounded-2xl shadow-2xl transition ${plusActive || createOpen ? "bg-white text-[#101216] shadow-white/20" : "bg-[#2563eb] text-white shadow-[#2563eb]/30"}`}>
            <Plus size={30} strokeWidth={2.8} />
          </span>
          <span className={`text-[11px] font-semibold ${plusActive || createOpen ? "text-white" : "text-white/48"}`}>{tabCopy.create}</span>
        </button>

        {tabs.slice(2, 3).map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname, hash);
          return (
            <Link key={tab.label} href={tab.href} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition active:scale-95 ${active ? "bg-white/8 text-white" : "text-white/48"}`}>
              <Icon size={20} strokeWidth={active ? 2.6 : 2.1} />
              <span>{tabCopy.build}</span>
            </Link>
          );
        })}
        <Link href="/me" onClick={() => void markNotificationsRead()} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition active:scale-95 ${tabs[3].match(pathname, hash) ? "bg-white/8 text-white" : "text-white/48"}`} aria-label="Profile and activity">
          {notificationCount > 0 ? (
            <span className="absolute right-3 top-1 min-w-5 rounded-full bg-[#ff385c] px-1.5 py-0.5 text-center text-[9px] font-bold leading-none text-white">
              {notificationLabel}
            </span>
          ) : null}
          {user ? (
            <CommunityAvatar name={user.name} src={user.avatar} className="size-6 border border-white/20 text-[9px]" />
          ) : (
            <UserRound size={20} />
          )}
          <span className="max-w-12 truncate">{user ? user.name.split(" ")[0] : tabCopy.profile}</span>
        </Link>
      </div>
    </nav>
    </>
  );
}
