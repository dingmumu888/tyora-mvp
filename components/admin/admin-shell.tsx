"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CircleDollarSign,
  FileSearch,
  FolderKanban,
  GalleryVerticalEnd,
  Globe2,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  Save,
  Search,
  Settings,
  Users,
  X
} from "lucide-react";
import { AdminViewCommunityLink } from "@/components/admin-view-community-link";

export type AdminSectionId =
  | "today"
  | "inbox"
  | "submissions"
  | "customers"
  | "cases"
  | "pricing"
  | "homepage"
  | "media"
  | "team"
  | "sourceContent"
  | "analytics"
  | "mobileTabs"
  | "moduleVisibility"
  | "brand"
  | "video"
  | "contact"
  | "founder";

export type AdminSearchItem = {
  id: string;
  label: string;
  description: string;
  href?: string;
  sectionId?: AdminSectionId;
  keywords?: string;
};

type NavItem = {
  label: string;
  icon: typeof Home;
  href?: string;
  sectionId?: AdminSectionId;
  keywords?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, sectionId: "today", keywords: "overview kpi" },
      { label: "Inbox", icon: MessageSquareText, href: "/admin/work-orders", sectionId: "inbox", keywords: "requests follow up" },
      { label: "Ideas Moderation", icon: FileSearch, href: "/admin/community", keywords: "community assessment" },
      { label: "Projects", icon: FolderKanban, sectionId: "submissions", keywords: "submissions pipeline" },
      { label: "Customers", icon: Users, sectionId: "customers", keywords: "accounts contacts" }
    ]
  },
  {
    label: "Content",
    items: [
      { label: "Cases", icon: GalleryVerticalEnd, sectionId: "cases", keywords: "case studies" },
      { label: "Pricing", icon: CircleDollarSign, sectionId: "pricing", keywords: "service fees" },
      { label: "Website Content", icon: Globe2, sectionId: "homepage", keywords: "homepage cms" },
      { label: "Media", icon: Image, sectionId: "media", keywords: "images files video" }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Source", icon: BriefcaseBusiness, href: "/admin/source", keywords: "supplier requests" },
      { label: "Analytics", icon: BarChart3, sectionId: "analytics", keywords: "traffic visitors" },
      { label: "Team & Settings", icon: Settings, sectionId: "team", keywords: "members roles general" }
    ]
  }
];

const settingsNav: NavItem[] = [
  { label: "Source Page", icon: Globe2, sectionId: "sourceContent" },
  { label: "Mobile Navigation", icon: Menu, sectionId: "mobileTabs" },
  { label: "Homepage Modules", icon: LayoutDashboard, sectionId: "moduleVisibility" },
  { label: "Brand & Navigation", icon: Home, sectionId: "brand" },
  { label: "Brand Film", icon: Image, sectionId: "video" },
  { label: "Contact Settings", icon: Settings, sectionId: "contact" },
  { label: "Founder Profile", icon: Users, sectionId: "founder" }
];

function navKey(item: NavItem) {
  return item.href || item.sectionId || item.label;
}

function itemIsActive(item: NavItem, activeSection: AdminSectionId) {
  return Boolean(item.sectionId && item.sectionId === activeSection);
}

export default function AdminShell({
  activeSection,
  pageTitle,
  pageDescription,
  notificationCount,
  searchItems,
  canSave,
  languageLabel,
  onNavigate,
  onNewProject,
  onSave,
  onToggleLanguage,
  onLogout,
  children
}: {
  activeSection: AdminSectionId;
  pageTitle: string;
  pageDescription: string;
  notificationCount: number;
  searchItems: AdminSearchItem[];
  canSave: boolean;
  languageLabel: string;
  onNavigate: (section: AdminSectionId) => void;
  onNewProject: () => void;
  onSave: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setSearchOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const staticSearchItems = useMemo<AdminSearchItem[]>(
    () => [...navGroups.flatMap((group) => group.items), ...settingsNav].map((item) => ({
      id: `nav-${navKey(item)}`,
      label: item.label,
      description: item.href ? "Open admin workspace" : "Open admin section",
      href: item.href,
      sectionId: item.sectionId,
      keywords: item.keywords
    })),
    []
  );
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return staticSearchItems.slice(0, 8);
    return [...staticSearchItems, ...searchItems]
      .filter((item) => [item.label, item.description, item.keywords].join(" ").toLowerCase().includes(normalized))
      .slice(0, 10);
  }, [query, searchItems, staticSearchItems]);

  function chooseSection(section: AdminSectionId) {
    onNavigate(section);
    setMobileOpen(false);
    setSearchOpen(false);
    setQuery("");
  }

  function chooseSearchItem(item: AdminSearchItem) {
    if (item.href) {
      window.location.assign(item.href);
      return;
    }
    if (item.sectionId) chooseSection(item.sectionId);
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-[#071b3a] text-white">
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-white">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#155eef] text-sm font-bold">TY</span>
          <span className="min-w-0">
            <span className="block text-base font-bold">TYORA OS</span>
            <span className="block truncate text-[11px] text-white/58">Operations workspace</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="grid size-10 place-items-center rounded-md text-white/72 hover:bg-white/10 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/42">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = itemIsActive(item, activeSection);
                  const className = `flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                    active ? "bg-[#155eef] text-white" : "text-white/72 hover:bg-white/8 hover:text-white"
                  }`;
                  return item.href ? (
                    <Link key={navKey(item)} href={item.href} className={className} onClick={() => setMobileOpen(false)}>
                      <Icon size={17} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <button key={navKey(item)} type="button" onClick={() => item.sectionId && chooseSection(item.sectionId)} className={className}>
                      <Icon size={17} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <button
              type="button"
              onClick={() => setSettingsOpen((current) => !current)}
              className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm font-semibold text-white/72 hover:bg-white/8 hover:text-white"
              aria-expanded={settingsOpen}
            >
              <span className="flex items-center gap-3"><Settings size={17} /> Site settings</span>
              <ChevronRight size={15} className={`transition ${settingsOpen ? "rotate-90" : ""}`} />
            </button>
            {settingsOpen ? (
              <div className="mt-1 space-y-1 border-l border-white/12 pl-3">
                {settingsNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={navKey(item)}
                      type="button"
                      onClick={() => item.sectionId && chooseSection(item.sectionId)}
                      className={`flex min-h-9 w-full items-center gap-2 rounded-md px-3 text-left text-xs font-semibold ${
                        itemIsActive(item, activeSection) ? "bg-white/12 text-white" : "text-white/58 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <Icon size={14} /> {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md bg-white/6 p-3">
          <span className="grid size-8 place-items-center rounded-full bg-white text-xs font-bold text-[#071b3a]">A</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Admin</span>
            <span className="block truncate text-[11px] text-white/52">TYORA Operations</span>
          </span>
        </div>
        <button type="button" onClick={onLogout} className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-white/64 hover:bg-white/8 hover:text-white">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#101828]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] lg:block">{sidebar}</aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[#071b3a]/55" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />
          <aside className="absolute inset-y-0 left-0 w-[min(280px,86vw)] shadow-2xl">{sidebar}</aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-[#e4e7ec] bg-white/96 backdrop-blur">
          <div className="flex min-h-[72px] items-center gap-2 px-3 sm:px-5 xl:px-7">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-11 shrink-0 place-items-center rounded-md border border-[#e4e7ec] text-[#344054] lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <Menu size={20} />
            </button>

            <div className="hidden min-w-0 xl:block">
              <h1 className="truncate text-lg font-bold">{pageTitle}</h1>
              <p className="truncate text-xs text-[#667085]">{pageDescription}</p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <label className="flex h-11 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 shadow-sm focus-within:border-[#155eef] focus-within:ring-4 focus-within:ring-[#155eef]/10">
                <Search size={17} className="shrink-0 text-[#667085]" aria-hidden="true" />
                <span className="sr-only">Search admin</span>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && results[0]) {
                      event.preventDefault();
                      chooseSearchItem(results[0]);
                    }
                  }}
                  placeholder="Search admin sections and submissions"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  aria-expanded={searchOpen}
                  aria-controls="admin-search-results"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery("")} className="grid size-8 place-items-center rounded-md text-[#667085] hover:bg-[#f2f4f7]" aria-label="Clear search">
                    <X size={15} />
                  </button>
                ) : null}
              </label>
              {searchOpen ? (
                <div id="admin-search-results" className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-md border border-[#e4e7ec] bg-white shadow-xl" role="listbox">
                  <div className="flex items-center justify-between border-b border-[#eaecf0] px-3 py-2">
                    <span className="text-xs font-semibold text-[#667085]">Search results</span>
                    <button type="button" onClick={() => setSearchOpen(false)} className="text-xs font-semibold text-[#155eef]">Close</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1.5">
                    {results.length ? results.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() => chooseSearchItem(item)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-[#f2f4f7] focus:bg-[#eef4ff]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{item.label}</span>
                          <span className="block truncate text-xs text-[#667085]">{item.description}</span>
                        </span>
                        <ChevronRight size={15} className="shrink-0 text-[#98a2b3]" />
                      </button>
                    )) : <p className="px-3 py-6 text-center text-sm text-[#667085]">No matching admin items.</p>}
                  </div>
                </div>
              ) : null}
            </div>

            <AdminViewCommunityLink className="hidden xl:inline-flex" />
            <button
              type="button"
              onClick={() => window.location.assign("/admin/work-orders")}
              className="relative grid size-11 shrink-0 place-items-center rounded-md border border-[#e4e7ec] bg-white text-[#344054] hover:bg-[#f9fafb]"
              aria-label={notificationCount ? `${notificationCount} items need a reply` : "No pending notifications"}
              title="Needs reply"
            >
              <Bell size={18} />
              {notificationCount ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#f04438]" aria-hidden="true" /> : null}
            </button>
            <button
              type="button"
              onClick={onNewProject}
              className="hidden min-h-11 shrink-0 items-center gap-2 rounded-md bg-[#155eef] px-4 text-sm font-bold text-white hover:bg-[#004eeb] sm:inline-flex"
            >
              <Plus size={17} /> New Project
            </button>
            <button type="button" onClick={onToggleLanguage} className="hidden min-h-11 shrink-0 rounded-md border border-[#e4e7ec] px-3 text-xs font-bold text-[#344054] 2xl:inline-flex 2xl:items-center">
              {languageLabel}
            </button>
            {canSave ? (
              <button type="button" onClick={onSave} className="grid size-11 shrink-0 place-items-center rounded-md border border-[#e4e7ec] bg-white text-[#344054] hover:bg-[#f9fafb]" aria-label="Save changes" title="Save changes">
                <Save size={18} />
              </button>
            ) : null}
          </div>
        </header>

        <div className="px-3 py-4 sm:px-5 sm:py-5 xl:px-7 xl:py-6">
          <div className="mb-4 xl:hidden">
            <h1 className="text-xl font-bold">{pageTitle}</h1>
            <p className="mt-1 text-sm text-[#667085]">{pageDescription}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
