"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, SearchCheck } from "lucide-react";

type CommunityIdeaResult = {
  slug: string;
  title: string;
  description: string;
  category: string;
};

type SearchItem = {
  title: string;
  description: string;
  href: string;
  keywords: string;
  type: "Page" | "Source" | "Community";
};

const staticSearchItems: SearchItem[] = [
  {
    title: "Source This Product",
    description: "Upload product photos and get China supplier options and factory pricing.",
    href: "/source",
    keywords: "source supplier factory pricing quote china product images sample managed sourcing category quantity",
    type: "Source"
  },
  {
    title: "How TYORA Source Works",
    description: "Supplier introduction, managed sourcing, no hidden markup, samples, and process details.",
    href: "/source/how-it-works",
    keywords: "supplier introduction managed sourcing process sample inspection shipping no hidden markup factory price",
    type: "Source"
  },
  {
    title: "Private Custom Project",
    description: "Send an AI design, sketch, or confidential product idea to TYORA for a private manufacturing review.",
    href: "/custom",
    keywords: "custom private confidential ai design sketch manufacturability moq mold sample budget production",
    type: "Page"
  },
  {
    title: "Service protection",
    description: "Source service protection, replacement supplier support, refund terms, and order status rules.",
    href: "/source#service-protection",
    keywords: "service protection refund policy replacement supplier unavailable managed sourcing cost",
    type: "Source"
  },
  {
    title: "Pricing",
    description: "Free product match, supplier introduction fees, and managed sourcing fees.",
    href: "/source#pricing",
    keywords: "pricing price fee free quote 3% 5% 10% 15% minimum supplier introduction managed sourcing",
    type: "Page"
  },
  {
    title: "Ask TYORA Community",
    description: "Browse product ideas, manufacturing discussions, TYORA reviews, and buyer feedback.",
    href: "/ask",
    keywords: "community ask discussion product ideas manufacturing review comments buyer feedback",
    type: "Community"
  },
  {
    title: "Start a Discussion",
    description: "Post a product idea and get feedback from TYORA and the community.",
    href: "/ask/new",
    keywords: "post idea upload image discussion ask tyora free review",
    type: "Community"
  },
  {
    title: "My TYORA",
    description: "View your discussions, comments, liked ideas, and notifications.",
    href: "/me",
    keywords: "profile login email notifications messages likes comments my tyora",
    type: "Page"
  },
  {
    title: "Privacy Policy",
    description: "How TYORA handles contact details, uploaded files, and site data.",
    href: "/privacy-policy",
    keywords: "privacy data contact email whatsapp files policy",
    type: "Page"
  },
  {
    title: "Terms",
    description: "TYORA site terms, sourcing terms, communication, and payment notes.",
    href: "/terms",
    keywords: "terms payment communication sourcing source refund service",
    type: "Page"
  }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matches(item: SearchItem, query: string) {
  const haystack = normalize(`${item.title} ${item.description} ${item.keywords}`);
  return query.split(/\s+/).filter(Boolean).every((part) => haystack.includes(part));
}

export default function SiteSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [communityResults, setCommunityResults] = useState<SearchItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/community/ideas?sort=trending&limit=50")
      .then((response) => response.json())
      .then((payload) => {
        const ideas = Array.isArray(payload.data) ? payload.data as CommunityIdeaResult[] : [];
        setCommunityResults(ideas.map((idea) => ({
          title: idea.title,
          description: `${idea.category} · ${idea.description}`,
          href: `/ask/${idea.slug}`,
          keywords: `${idea.title} ${idea.category} ${idea.description}`,
          type: "Community"
        })));
      })
      .catch(() => setCommunityResults([]));
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setFocused(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const normalizedQuery = normalize(query);
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return [...staticSearchItems, ...communityResults]
      .filter((item) => matches(item, normalizedQuery))
      .slice(0, 8);
  }, [communityResults, normalizedQuery]);

  const showResults = focused && normalizedQuery.length > 0;

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstResult = results[0];
    if (!firstResult) return;
    setFocused(false);
    router.push(firstResult.href);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={submitSearch} className="flex h-10 w-full items-center gap-1 rounded-full border border-[#bfdbfe] bg-[#eff6ff] p-1 text-sm text-[#1e3a8a] shadow-sm shadow-[#2563eb]/10 transition focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/12">
        <SearchCheck size={15} className="ml-2 shrink-0 text-[#2563eb]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent px-1 font-semibold outline-none placeholder:text-[#5f7fb8]"
          aria-label="Search TYORA"
        />
        <button
          type="submit"
          aria-label="Open first search result"
          disabled={results.length === 0}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8] disabled:bg-[#93b4ef] disabled:opacity-70"
        >
          <ArrowRight size={15} />
        </button>
      </form>

      {showResults ? (
        <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-[#dfe6ef] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="border-b border-[#edf1f5] px-4 py-3">
            <p className="text-xs font-semibold uppercase text-[#69707d]">Search results</p>
          </div>
          {results.length > 0 ? (
            <div className="max-h-[420px] overflow-y-auto p-2">
              {results.map((item) => (
                <Link
                  key={`${item.href}-${item.title}`}
                  href={item.href}
                  onClick={() => setFocused(false)}
                  className="block rounded-2xl p-3 transition hover:bg-[#f5f7fb]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-semibold text-[#101216]">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-[#eef4ff] px-2 py-1 text-[10px] font-semibold text-[#315fbd]">{item.type}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#69707d]">{item.description}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm font-medium text-[#69707d]">No results found.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
