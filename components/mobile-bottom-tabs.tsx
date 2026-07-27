"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Lightbulb, PackageSearch, Plus, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
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
  { label: "Home", href: "/", icon: Home, match: (path) => path === "/" },
  { label: "Ideas", href: "/ask", icon: Lightbulb, match: (path) => path === "/ask" || (path.startsWith("/ask/") && path !== "/ask/new") },
  { label: "Source", href: "/source", icon: PackageSearch, match: (path) => path === "/source" },
  { label: "Profile", href: "/me", icon: UserRound, match: (path) => path === "/me" }
];

function shouldShow(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/me") return true;
  if (pathname === "/source") return true;
  if (pathname === "/custom") return true;
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
  const [editingText, setEditingText] = useState(false);
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

  function openSourceForm(event: MouseEvent<HTMLAnchorElement>) {
    setCreateOpen(false);
    if (pathname !== "/source") return;

    event.preventDefault();
    window.requestAnimationFrame(() => {
      const sourceForm = document.getElementById("source-form");
      if (!sourceForm) return;
      window.history.replaceState(null, "", "/source#source-form");
      setHash("#source-form");
      sourceForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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

  useEffect(() => {
    function isTextEditor(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    }

    function onFocusIn(event: FocusEvent) {
      if (!isTextEditor(event.target)) return;
      setCreateOpen(false);
      setEditingText(true);
    }

    function onFocusOut() {
      window.setTimeout(() => {
        if (isTextEditor(document.activeElement)) return;
        setEditingText(false);
      }, 120);
    }

    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (!shouldShow(pathname) || editingText) return null;

  const plusActive = pathname === "/ask/new";
  const notificationLabel = notificationCount > 99 ? "99+" : String(notificationCount);
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
      <div className="fixed inset-x-4 bottom-[calc(6.8rem+env(safe-area-inset-bottom))] z-[9991] grid gap-2 rounded-lg border border-[#e4e8ef] bg-white p-3 text-[#101216] shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:hidden">
        <Link href="/ask/new" onClick={() => setCreateOpen(false)} className="rounded-md bg-[#101216] px-4 py-3 text-sm font-semibold text-white">
          {tabCopy.startDiscussion}
          <span className="mt-1 block text-xs font-medium text-white/70">{tabCopy.startDiscussionSubtitle}</span>
        </Link>
        <Link href="/custom" onClick={() => setCreateOpen(false)} className="rounded-md border border-[#dfe5ee] bg-white px-4 py-3 text-sm font-semibold">
          {tabCopy.privateCustom}
          <span className="mt-1 block text-xs font-medium text-[#687284]">{tabCopy.privateCustomSubtitle}</span>
        </Link>
        <Link href="/source#source-form" onClick={openSourceForm} className="rounded-md border border-[#dfe5ee] bg-[#f8fafc] px-4 py-3 text-sm font-semibold">
          {tabCopy.sourceProduct}
          <span className="mt-1 block text-xs font-medium text-[#687284]">{tabCopy.sourceProductSubtitle}</span>
        </Link>
      </div>
    ) : null}
    <nav className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-[9990] rounded-lg border border-white/10 bg-[#07080a]/96 px-1 py-2 text-white shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:inset-x-3 sm:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-2 md:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-0.5 sm:gap-1">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname, hash);
          return (
            <Link key={tab.label} href={tab.href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition active:scale-95 sm:text-[11px] ${active ? "bg-white/8 text-white" : "text-white/48"}`}>
              <Icon size={20} strokeWidth={active ? 2.6 : 2.1} />
              <span>{tab.label === "Home" ? tabCopy.community : tabCopy.build}</span>
            </Link>
          );
        })}

        <button type="button" onClick={() => setCreateOpen((value) => !value)} className="mx-auto -mt-5 flex flex-col items-center gap-1 active:scale-95" aria-label="Create">
          <span className={`flex size-14 items-center justify-center rounded-md shadow-2xl transition ${plusActive || createOpen ? "bg-white text-[#101216] shadow-white/20" : "bg-[#2563eb] text-white shadow-[#2563eb]/30"}`}>
            <Plus size={30} strokeWidth={2.8} />
          </span>
          <span className={`text-[10px] font-semibold sm:text-[11px] ${plusActive || createOpen ? "text-white" : "text-white/48"}`}>{tabCopy.create}</span>
        </button>

        {tabs.slice(2, 3).map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname, hash);
          return (
            <Link key={tab.label} href={tab.href} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition active:scale-95 sm:text-[11px] ${active ? "bg-white/8 text-white" : "text-white/48"}`}>
              <Icon size={20} strokeWidth={active ? 2.6 : 2.1} />
              <span>{tabCopy.source}</span>
            </Link>
          );
        })}
        <Link href="/me" className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition active:scale-95 sm:text-[11px] ${tabs[3].match(pathname, hash) ? "bg-white/8 text-white" : "text-white/48"}`} aria-label="Profile and activity">
          {user ? (
            <span className="relative">
              <CommunityAvatar name={user.name} src={user.avatar} className="size-6 border border-white/20 text-[9px]" />
              {notificationCount > 0 ? (
                <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[#ff385c] px-1.5 py-0.5 text-center text-[9px] font-bold leading-none text-white ring-2 ring-[#07080a]">
                  {notificationLabel}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="relative">
              <UserRound size={20} />
              {notificationCount > 0 ? (
                <span className="absolute -right-3 -top-2 min-w-5 rounded-full bg-[#ff385c] px-1.5 py-0.5 text-center text-[9px] font-bold leading-none text-white ring-2 ring-[#07080a]">
                  {notificationLabel}
                </span>
              ) : null}
            </span>
          )}
          <span>{tabCopy.profile}</span>
        </Link>
      </div>
    </nav>
    </>
  );
}
