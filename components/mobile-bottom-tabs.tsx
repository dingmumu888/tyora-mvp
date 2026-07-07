"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Lightbulb, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";

const tabs = [
  { label: "Home", href: "/", icon: Home, match: (path: string) => path === "/" },
  { label: "Ideas", href: "/ask", icon: Lightbulb, match: (path: string) => path === "/ask" || (path.startsWith("/ask/") && path !== "/ask/new") },
  { label: "Activity", href: "/me#notifications", icon: Bell, match: (path: string, hash: string) => path === "/me" && hash === "#notifications" },
  { label: "Me", href: "/me", icon: User, match: (path: string, hash: string) => path === "/me" && hash !== "#notifications" }
];

function shouldShow(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/me") return true;
  if (pathname === "/ask" || pathname === "/ask/new" || pathname.startsWith("/ask/")) return true;
  return false;
}

export default function MobileBottomTabs() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  if (!shouldShow(pathname)) return null;

  const plusActive = pathname === "/ask/new";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07080a]/96 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname, hash);
          return (
            <Link key={tab.label} href={tab.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition ${active ? "text-white" : "text-white/48"}`}>
              <Icon size={20} strokeWidth={active ? 2.6 : 2.1} />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        <Link href="/ask/new" className="mx-auto -mt-4 flex flex-col items-center gap-1" aria-label="Start a discussion">
          <span className={`flex size-14 items-center justify-center rounded-2xl shadow-2xl transition ${plusActive ? "bg-white text-[#101216] shadow-white/20" : "bg-[#2563eb] text-white shadow-[#2563eb]/30"}`}>
            <Plus size={30} strokeWidth={2.8} />
          </span>
          <span className={`text-[11px] font-semibold ${plusActive ? "text-white" : "text-white/48"}`}>Post</span>
        </Link>

        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname, hash);
          return (
            <Link key={tab.label} href={tab.href} className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition ${active ? "text-white" : "text-white/48"}`}>
              {tab.label === "Activity" ? <span className="absolute right-5 top-1 rounded-full bg-[#ff385c] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">•</span> : null}
              <Icon size={20} strokeWidth={active ? 2.6 : 2.1} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
