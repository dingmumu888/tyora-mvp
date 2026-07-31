"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, PenLine, Search, Sparkles } from "lucide-react";
import CommunityText, { CommunitySearchInput } from "@/components/community-text";
import CommunityUserMenu from "@/components/community-user-menu";
import PublicLanguageSwitcher from "@/components/public-language-switcher";

const navigation = [
  ["Ideas", "/ask"],
  ["Manufacturing", "/build"],
  ["Source", "/source"],
  ["Pricing", "/build#pricing"]
] as const;

export default function CommunityDetailHeader({
  brandName,
  logoImage,
  showBrandNameWithLogo
}: {
  brandName: string;
  logoImage?: string;
  showBrandNameWithLogo: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1426] text-white shadow-[0_4px_18px_rgba(11,20,38,0.16)]">
      <div className="relative mx-auto flex h-[60px] max-w-[1580px] items-center gap-3 px-3 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-white transition hover:bg-white/10 lg:hidden"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={21} />
        </button>

        <Link href="/ask" className="flex shrink-0 items-center gap-2.5 pr-2 lg:pr-7" aria-label={`${brandName} ideas`}>
          <span className="grid size-9 place-items-center overflow-hidden rounded-lg bg-white p-1">
            {logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoImage} alt="" className="size-full object-contain" />
            ) : <Sparkles size={17} className="text-[#0b1426]" />}
          </span>
          {showBrandNameWithLogo ? <span className="text-base font-bold tracking-[0.08em]">{brandName}</span> : null}
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Community navigation">
          {navigation.map(([label, href]) => (
            <Link key={label} href={href} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${href === "/ask" ? "bg-white/12 text-white" : "text-white/72 hover:bg-white/8 hover:text-white"}`}>
              <CommunityText text={label} />
            </Link>
          ))}
        </nav>

        <form action="/ask" className="mx-auto hidden h-10 w-full max-w-[500px] items-center gap-2 rounded-lg border border-white/25 bg-white/7 px-3 text-white/65 lg:flex">
          <Search size={16} />
          <CommunitySearchInput placeholder="Search ideas, products, or manufacturing questions" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/48" />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/ask" className="grid size-10 place-items-center rounded-lg text-white transition hover:bg-white/10 lg:hidden" aria-label="Search ideas">
            <Search size={20} />
          </Link>
          <PublicLanguageSwitcher compact className="hidden sm:inline-flex" />
          <CommunityUserMenu loginClassName="hidden h-10 items-center rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/15 md:inline-flex" />
          <Link href="/ask/new" className="hidden h-10 items-center gap-2 rounded-lg bg-[#1565f9] px-4 text-sm font-semibold text-white shadow-sm shadow-[#1565f9]/20 transition hover:bg-[#0b55de] sm:inline-flex">
            <PenLine size={15} /> <CommunityText text="Start a discussion" />
          </Link>
        </div>

        {mobileMenuOpen ? (
          <div className="absolute inset-x-3 top-[54px] z-50 rounded-2xl border border-[#d8dee8] bg-white p-3 text-[#0b1426] shadow-2xl lg:hidden">
            <nav className="grid gap-1" aria-label="Mobile community navigation">
              {navigation.map(([label, href]) => (
                <Link key={label} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-[#eef4ff]">
                  <CommunityText text={label} />
                </Link>
              ))}
            </nav>
            <div className="mt-2 flex items-center gap-2 border-t border-[#e4e7ec] pt-3">
              <PublicLanguageSwitcher compact />
              <CommunityUserMenu loginClassName="inline-flex h-10 items-center rounded-lg border border-[#d8dee8] px-3 text-sm font-semibold text-[#0b1426]" />
              <Link href="/ask/new" onClick={() => setMobileMenuOpen(false)} className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-[#1565f9] px-3 text-sm font-semibold text-white">
                <PenLine size={15} /> <CommunityText text="Start a discussion" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
