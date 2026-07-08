"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronLeft,
  ClipboardCheck,
  Eye,
  Flame,
  Heart,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  Play,
  SearchCheck,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CommunityImage from "@/components/community-image";
import CommunityAvatar from "@/components/community-avatar";
import CommunityUserMenu from "@/components/community-user-menu";
import {
  defaultContent,
  Lead,
  loadContent,
  saveLead,
  SiteContent,
  uploadProjectFile
} from "@/lib/storage";
import {
  Language,
  localizeContent,
  ui
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { normalizeWhatsAppUrl } from "@/lib/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { CommunityIdea } from "@/lib/community";

const brandFilmUrl = "/videos/TYORA_Brand_Film_v1.1_Final_v2.mp4";
const brandFilmPoster = "/videos/TYORA_Brand_Film_v1.1_Poster.jpg";
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] hover:shadow-md hover:shadow-[#2563eb]/25";
const starterExamples = [
  {
    title: "Magnetic Phone Stand",
    category: "Phone Accessories",
    description: "A foldable desk stand with a weighted base, magnetic ring, and manufacturable hinge design."
  },
  {
    title: "Portable Pet Water Bottle",
    category: "Pet",
    description: "A leak-resistant travel bottle with a one-hand drinking tray and easy-clean plastic parts."
  },
  {
    title: "Travel Coffee Mug",
    category: "Kitchen",
    description: "A compact insulated mug with a secure lid, tactile grip, and low-MOQ material options."
  }
] as const;
const exampleMetrics = [
  { love: 28, comments: 14, buy: 9, views: 483, reply: "5 min ago", avatars: ["AL", "TY", "JR"] },
  { love: 21, comments: 11, buy: 7, views: 356, reply: "9 min ago", avatars: ["SA", "TY", "MK"] },
  { love: 34, comments: 18, buy: 12, views: 621, reply: "12 min ago", avatars: ["MI", "TY", "LE"] }
] as const;
const fallbackActivity = [
  ["Alex uploaded a new idea", "2 min ago", "bg-[#14b8a6]"],
  ["TYORA replied to a mug project", "5 min ago", "bg-[#2563eb]"],
  ["Sarah commented on material choice", "7 min ago", "bg-[#f59e0b]"],
  ["Mike started manufacturing", "14 min ago", "bg-[#8b5cf6]"]
] as const;
const featuredJourney = [
  ["Idea", "Founder shares a spill-proof mug concept", "Done"],
  ["Discussion", "Community compares lid, grip and MOQ", "Done"],
  ["TYORA Review", "Material, tooling and factory path reviewed", "Done"],
  ["Prototype", "Sample structure and finish confirmed", "Done"],
  ["Manufacturing", "Factory route and QC plan locked", "Active"],
  ["Delivered", "First batch ready for creator testing", "Next"]
] as const;
const earlyCommunityStats = [
  ["Early access", "Founder community"],
  ["Free review", "Within 8 working hours"],
  ["Public discussion", "Open to browse"],
  ["No password", "Email code login"],
  ["Build path", "When ready"]
] as const;
const buildSupportCards = [
  ["Manufacturing review", "Understand feasibility, materials, MOQ and cost before paying for samples.", ClipboardCheck],
  ["Factory path", "When a discussion is ready, TYORA can help identify the right manufacturing route.", SearchCheck],
  ["Project support", "Move from community feedback into samples, QC, production and shipping when needed.", PackageCheck]
] as const;
const sourceProductSteps = [
  { step: "1", title: "Upload reference", body: "Photo, link, material and target quantity.", icon: SearchCheck },
  { step: "2", title: "TYORA checks options", body: "Supplier fit and estimated China pricing.", icon: ClipboardCheck },
  { step: "3", title: "Choose next step", body: "Factory introduction or managed sourcing.", icon: PackageCheck }
] as const;
const topNavigation = [
  ["Discover Ideas", "/ask"],
  ["Ask TYORA", "/ask/new"],
  ["Source Products", "/source"],
  ["Journeys", "/#journeys"],
  ["Success Stories", "/#success-stories"],
  ["Pricing", "/#pricing"]
] as const;

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 6e4));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function ideaViews(idea: CommunityIdea) {
  return Math.max(idea.likeCount * 18 + idea.comments.length * 24 + idea.interestedCount * 30, 37);
}

function HotBadge({ idea }: { idea: CommunityIdea }) {
  if (!idea.isHot) return null;
  return (
    <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#ff385c] px-2.5 py-1 text-[10px] font-bold uppercase tracking-normal text-white shadow-[0_8px_22px_rgba(255,56,92,0.28)]">
      <Flame size={11} fill="currentColor" /> Hot
    </span>
  );
}

export default function Home() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [language] = useState<Language>("en");
  const [idea, setIdea] = useState("");
  const [productName, setProductName] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAllMobileCases, setShowAllMobileCases] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [communityIdeas, setCommunityIdeas] = useState<CommunityIdea[]>([]);
  const [sourceRequestCount, setSourceRequestCount] = useState(0);

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  useEffect(() => {
    trackAnalyticsEvent("page_visit");
  }, []);

  useEffect(() => {
    fetch("/api/community/ideas?sort=trending")
      .then((response) => response.json())
      .then((payload) => setCommunityIdeas(payload.data || []))
      .catch(() => setCommunityIdeas([]));
  }, []);

  useEffect(() => {
    fetch("/api/source/stats", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setSourceRequestCount(Number(payload.data?.total || 0)))
      .catch(() => setSourceRequestCount(0));
  }, []);

  const t = ui[language];
  const displayContent = useMemo(
    () => localizeContent(content, language),
    [content, language]
  );
  const whatsappUrl = useMemo(
    () => normalizeWhatsAppUrl(displayContent.whatsappLink),
    [displayContent.whatsappLink]
  );
  const visibleCases = displayContent.cases.filter((story) => story.visible);
  const faqItems = [
    {
      question: "Is TYORA a factory?",
      answer:
        "No. TYORA is your product development and manufacturing support partner. We help review the product, plan the manufacturing path, match the right factory, and manage the process when needed."
    },
    {
      question: "Do I need a finished design before contacting TYORA?",
      answer:
        "No. A product name, sketch, AI image, reference product, PDF, or CAD file is enough to start a review."
    },
    {
      question: "Can TYORA help if I am based in the United States?",
      answer:
        "Yes. TYORA is positioned for US product founders who want practical support working with manufacturing partners in China."
    },
    {
      question: "Can I manage the factory myself after the review?",
      answer:
        "Yes. You can start with factory matching and manage communication yourself, or choose full project management if you want TYORA involved through samples, production, quality, and shipping."
    },
    {
      question: "Does TYORA guarantee a factory will produce my product?",
      answer:
        "No responsible partner can guarantee that before review. TYORA helps you understand feasibility, risks, requirements, and the most realistic manufacturing path before you commit."
    },
    {
      question: "How do I start?",
      answer:
        "Enter your product name, upload a reference if you have one, and start the WhatsApp conversation. TYORA will review the project and guide the next step."
    }
  ];

  function openWizard() {
    trackAnalyticsEvent("upload_click");
    setWizardOpen(true);
    setProductName((current) => current || idea);
  }

  async function startWhatsAppChat() {
    if (submitting) return;
    setSubmitting(true);
    trackAnalyticsEvent("whatsapp_click");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    let uploadedFiles: string[] = [];
    try {
      if (selectedFile) {
        const asset = await uploadProjectFile(selectedFile);
        uploadedFiles = [asset.url];
      }

      const lead: Lead = {
        id: crypto.randomUUID(),
        productIdea: productName || idea || "Product idea not named yet",
        designType: selectedFile ? "Uploaded reference" : "",
        quantity: "",
        budget: "",
        timeline: "",
        sampleRequirement: t.no,
        sampleReview: "",
        additionalRequirements: "",
        uploadedFile: uploadedFiles[0] || fileName,
        uploadedFiles,
        submissionDate: new Date().toISOString(),
        status: "New"
      };

      await saveLead(lead);
      trackAnalyticsEvent("lead_submit_success");
      setWizardOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to submit project.");
    } finally {
      setSubmitting(false);
    }
  }

  const canStartChat = Boolean(productName.trim());
  const supportedUploads = [t.aiImage, t.sketch, t.referenceImage, t.pdf, t.cadSupported];
  const homeFeedIdeas = communityIdeas;
  const homeExamples = homeFeedIdeas.length < 3 ? starterExamples.slice(0, 3 - homeFeedIdeas.length) : [];
  const hasCommunityStats = communityIdeas.length > 0;
  const communityStats = [
    ["Ideas Shared", communityIdeas.length],
    ["TYORA Reviews", communityIdeas.filter((idea) => idea.review).length],
    ["Projects Started", communityIdeas.filter((idea) => ["Project Started", "Manufacturing", "Shipping", "Completed"].includes(idea.status)).length],
    ["Products Delivered", communityIdeas.filter((idea) => idea.status === "Completed").length],
    ["Countries", new Set(communityIdeas.map((idea) => idea.country).filter(Boolean)).size]
  ] as const;
  const moduleVisibility = displayContent.moduleVisibility;
  const sourceCopy = displayContent.sourcePage;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f5f7fb_32%,#f7f5f0_72%,#eef2f8_100%)] pb-28 text-[#101216] md:pb-0">
      <header className="sticky top-0 z-40 overflow-hidden border-b border-[#eef1f4]/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2 font-semibold">
            {displayContent.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayContent.logoImage}
                alt={displayContent.brandName}
                className="size-8 rounded-lg object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#101216] text-white">
                <Sparkles size={16} />
              </span>
            )}
            <span className="leading-tight">
              {displayContent.brandName}
              <span className="block text-[10px] font-medium uppercase tracking-normal text-[#69707d]">
                Idea2Product
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex">
            {topNavigation.map(([label, href]) => (
              <Link key={label} href={href} className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition hover:bg-[#f5f6f8] hover:text-[#101216]",
                label === "Discover Ideas" ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] hover:text-white" : "text-[#59616e]"
              )}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden h-10 w-44 items-center gap-2 rounded-full border border-[#e1e5ea] bg-white px-3 text-sm text-[#8b93a1] xl:flex">
              <SearchCheck size={15} /> Search
            </div>
            <CommunityUserMenu loginClassName="hidden rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold md:inline-flex" />
            <Link href="/ask/new" className={`hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold sm:inline-flex ${primaryButton}`}>
              <Upload size={15} /> <span className="hidden sm:inline">Start a Discussion</span>
            </Link>
            <Link href="/me#notifications" className="hidden size-10 items-center justify-center rounded-full border border-[#dfe3e8] md:inline-flex" aria-label="Notifications">
              <Bell size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section id="community" className="scroll-mt-20 border-b border-[#e4e8ef] bg-transparent lg:min-h-[calc(100vh-64px)]">
        <div className="mx-auto grid max-w-[1700px] gap-3 px-2.5 py-3 sm:px-4 lg:grid-cols-[280px_minmax(0,1fr)_360px] lg:px-5">
          <aside className="hidden self-start rounded-[18px] border border-[#d7e0ec] bg-white p-4 shadow-[0_14px_44px_rgba(15,23,42,0.1)] lg:sticky lg:top-20 lg:block">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#101216] text-white"><Sparkles size={19} /></div>
            <h2 className="mt-3 text-lg font-semibold">Creator HQ</h2>
            <p className="mt-1.5 text-sm leading-6 text-[#69707d]">Founders testing ideas with manufacturing experts.</p>
            <div className="mt-3 grid gap-2">
              {[
                ["Founders Online", Math.max(communityIdeas.length * 3, 12), "bg-[#ecfdf5] text-[#0f766e]", "bg-[#14b8a6]"],
                ["Discussions Today", Math.max(communityIdeas.length + homeExamples.length, 8), "bg-[#f2f7ff] text-[#315fbd]", "bg-[#2563eb]"],
                ["TYORA Replies Today", Math.max(communityIdeas.filter((item) => item.review).length, 5), "bg-[#fff7ed] text-[#c2410c]", "bg-[#f59e0b]"]
              ].map(([label, value, tone, dot]) => (
                <div key={label} className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold ${tone}`}>
                  <span className="inline-flex items-center gap-2">
                    <span className={`size-2 rounded-full ${dot} ${label === "Founders Online" ? "animate-pulse shadow-[0_0_0_4px_rgba(20,184,166,0.13)]" : ""}`} />
                    {label}
                  </span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
            <Link href="/ask/new" className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold ${primaryButton}`}>
              <Upload size={15} /> Start a Discussion
            </Link>
            <Link href="/ask" className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full border border-[#dfe3e8] text-sm font-semibold">Browse Ideas</Link>
            <p className="mt-3 rounded-2xl bg-[#e9f7f3] p-3 text-sm font-semibold text-[#0f766e]">3 FREE Expert Reviews per day</p>
          </aside>

          <div className="min-w-0">
            <div className="hidden rounded-[18px] border border-[#dfe6ef] bg-white/96 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:block sm:p-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
                <Users size={14} /> Community is the product
              </p>
              <div className="mt-2 grid gap-2.5 sm:gap-3">
                <div>
                  <h1 className="max-w-4xl text-[1.55rem] font-semibold leading-[1.08] tracking-normal sm:text-4xl lg:text-[2.65rem]">What are founders building next?</h1>
                  <p className="mt-1.5 max-w-[320px] text-sm leading-5 text-[#59616e] sm:mt-2 sm:max-w-3xl sm:text-base sm:leading-6">
                    Share your idea. Get a FREE manufacturing review within 8 working hours.
                  </p>
                  <p className="mt-1.5 max-w-[340px] break-words text-xs font-semibold text-[#315fbd] sm:mt-2 sm:max-w-3xl sm:text-sm">Founders are discussing product ideas with TYORA manufacturing experts.</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Link href="/ask/new" className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold sm:h-12 sm:px-5 ${primaryButton}`}><Upload size={16} /> Start a Discussion</Link>
                  <Link href="/ask" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold sm:h-12 sm:px-5"><SearchCheck size={16} /> Browse Ideas</Link>
                </div>
                <p className="hidden text-xs font-semibold text-[#69707d] sm:block">Share your idea. Get FREE manufacturing feedback within 8 working hours.</p>
              </div>
              <div className="no-scrollbar mt-2.5 hidden gap-2 overflow-x-auto pb-1 sm:flex xl:grid xl:grid-cols-5 xl:overflow-visible xl:pb-0">
                {(hasCommunityStats ? communityStats : earlyCommunityStats).map(([label, value]) => (
                  <div key={label} className="min-w-[122px] rounded-xl border border-[#e7edf5] bg-gradient-to-br from-white to-[#f7fbff] p-2.5 shadow-sm shadow-[#101216]/3 sm:min-w-[142px] xl:min-w-0">
                    <p className="text-lg font-semibold">{value}</p>
                    <p className="mt-1 text-xs font-medium text-[#69707d]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
              {["Trending", "Newest", "Most Discussed", "Latest TYORA Reply", "Recently Uploaded"].map((item, index) => (
                <Link key={item} href="/ask" className={cn("whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold", index === 0 ? "bg-[#2563eb] text-white" : "border border-[#dfe3e8] bg-white text-[#59616e]")}>{item}</Link>
              ))}
            </div>

            <div className="mt-2.5 grid gap-2">
              {communityIdeas.length === 0 ? (
                <div className="rounded-[18px] border border-[#e4e8ef] bg-white/95 p-3 shadow-sm shadow-[#101216]/4 sm:p-4">
                  <div className="grid gap-2.5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <p className="inline-flex rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">Starter community</p>
                      <h2 className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">Be the first founder to start a discussion.</h2>
                      <p className="mt-1.5 max-w-2xl text-sm leading-5 text-[#59616e]">
                        Share a product idea and get a free manufacturing review from TYORA.
                      </p>
                    </div>
                    <Link href="/ask/new" className={`hidden h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold sm:inline-flex ${primaryButton}`}>
                      <Upload size={16} /> Start a Discussion
                    </Link>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {starterExamples.map((example, index) => (
                      <Link
                        key={example.title}
                        href="/ask/new"
                        className="group grid grid-cols-[124px_minmax(0,1fr)] gap-3 rounded-[24px] border border-[#e8edf5] bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-[180ms] hover:-translate-y-1 hover:border-[#93c5fd] hover:bg-white hover:shadow-[0_20px_46px_rgba(37,99,235,0.14)] sm:grid-cols-[132px_1fr] sm:gap-2.5 sm:rounded-[14px] sm:border-[#e4e8ef] sm:bg-[#fbfbfc] sm:p-2 sm:shadow-none"
                      >
                        <div className={cn(
                          "relative flex aspect-square items-center justify-center rounded-[20px] bg-gradient-to-br shadow-inner shadow-white sm:rounded-xl",
                          index === 0 ? "from-[#e9f7f3] via-white to-[#efe9ff]" : index === 1 ? "from-[#fff4e7] via-white to-[#e9f2ff]" : "from-[#edf7ff] via-white to-[#effaf3]"
                        )}>
                          <span className="rounded-2xl bg-white/78 px-3 py-2 text-lg font-semibold shadow-sm ring-1 ring-white">
                            {example.title.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase text-[#69707d] ring-1 ring-[#e8ebef] max-sm:hidden">
                            Example
                          </span>
                        </div>
                        <div className="min-w-0 py-0.5 sm:py-0">
                          <div className="flex items-center gap-2 text-xs font-medium text-[#69707d] sm:hidden">
                            <span>founder</span>
                            <span className="size-1.5 rounded-full bg-[#14b8a6] shadow-[0_0_0_4px_rgba(20,184,166,0.1)]" />
                            <span className="text-[#536174]">Ready for review</span>
                            <span className="ml-auto">5 min ago</span>
                            <MoreHorizontal size={16} className="text-[#9aa4b2]" />
                          </div>
                          <div className="hidden flex-wrap gap-2 text-xs text-[#69707d] sm:flex">
                            <span className="rounded-full bg-white px-2 py-1 ring-1 ring-[#e8ebef]">{example.category}</span>
                            <span>Demo prompt</span>
                          </div>
                          <h3 className="mt-1.5 line-clamp-1 text-[17px] font-semibold leading-tight text-[#111827] sm:text-lg">{example.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#536174] sm:text-[#59616e]">{example.description}</p>
                          <div className="mt-2 flex gap-1.5 sm:hidden">
                            <span className="max-w-[112px] truncate rounded-full bg-[#edf4ff] px-2.5 py-1 text-[11px] font-semibold text-[#2563eb]">{example.category}</span>
                            <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">Example</span>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-[13px] font-medium text-[#5f6b7a] sm:mt-1.5 sm:flex-wrap sm:gap-x-2.5 sm:gap-y-0.5 sm:text-[11px]">
                            <span className="inline-flex items-center gap-1"><Heart size={15} className="sm:size-[13px]" /> {exampleMetrics[index].love}<span className="hidden sm:inline"> Love</span></span>
                            <span className="inline-flex items-center gap-1"><MessageCircle size={15} className="sm:size-[13px]" /> {exampleMetrics[index].comments}<span className="hidden sm:inline"> Comments</span></span>
                            <span className="inline-flex items-center gap-1 sm:hidden"><Eye size={15} /> {exampleMetrics[index].views}</span>
                            <span className="hidden items-center gap-1 sm:inline-flex"><ShoppingBag size={13} /> {exampleMetrics[index].buy} I'd Buy</span>
                            <span className="hidden items-center gap-1 sm:inline-flex"><Eye size={13} /> {exampleMetrics[index].views} Views</span>
                            <span className="hidden text-[#315fbd] sm:inline">Last reply {exampleMetrics[index].reply}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between sm:hidden">
                            <div className="flex -space-x-2">
                              {exampleMetrics[index].avatars.map((avatar) => (
                                <span key={`${example.title}-mobile-${avatar}`} className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#101216] text-[9px] font-semibold text-white">
                                  {avatar}
                                </span>
                              ))}
                            </div>
                            <span className="size-3 rounded-full bg-[#14b8a6] shadow-[0_0_0_5px_rgba(20,184,166,0.12)]" />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between max-sm:hidden">
                            <div className="flex -space-x-2">
                              {exampleMetrics[index].avatars.map((avatar) => (
                                <span key={avatar} className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#101216] text-[9px] font-semibold text-white">
                                  {avatar}
                                </span>
                              ))}
                            </div>
                            <span className="text-[11px] font-semibold text-[#8b93a1]">Founder + TYORA + makers</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {homeFeedIdeas.map((idea) => (
                <Link key={idea.id} href={`/ask/${idea.slug}`} className="group relative grid grid-cols-[124px_minmax(0,1fr)] gap-3 rounded-[24px] border border-[#e8edf5] bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-[180ms] hover:-translate-y-1 hover:border-[#93c5fd] hover:shadow-[0_20px_46px_rgba(37,99,235,0.14)] sm:grid-cols-[132px_1fr] sm:gap-2.5 sm:rounded-[12px] sm:border-[#e1e6ee] sm:p-2 sm:shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
                  <HotBadge idea={idea} />
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-[#e9f7f3] via-white to-[#efe9ff] text-lg font-semibold shadow-inner shadow-white sm:rounded-xl">
                    <CommunityImage src={idea.imageUrls[0]} alt={idea.title} className="size-full rounded-[20px] object-cover transition duration-500 group-hover:scale-[1.025] sm:rounded-2xl" />
                  </div>
                  <div className="min-w-0 py-0.5 sm:py-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#69707d] sm:hidden">
                      <span className="max-w-[72px] truncate">{idea.author.name}</span>
                      <span className="size-1.5 rounded-full bg-[#14b8a6] shadow-[0_0_0_4px_rgba(20,184,166,0.1)]" />
                      <span className={cn(
                        "truncate",
                        idea.status === "TYORA Reviewing" ? "text-[#c2410c]" : idea.status === "Completed" ? "text-[#0f766e]" : "text-[#536174]"
                      )}>{idea.status}</span>
                      <span className="ml-auto shrink-0">{timeAgo(idea.updatedAt || idea.createdAt)}</span>
                      <MoreHorizontal size={16} className="shrink-0 text-[#9aa4b2]" />
                    </div>
                    <div className="hidden flex-wrap gap-2 text-xs text-[#69707d] sm:flex">
                      <span>{idea.country}</span><span>{idea.author.name}</span><span>{idea.status}</span>
                    </div>
                    <h2 className="mt-1.5 line-clamp-1 text-[17px] font-semibold leading-tight text-[#111827] sm:text-base">{idea.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#536174] sm:text-[13px] sm:text-[#59616e]">{idea.description}</p>
                    <div className="mt-2 flex gap-1.5 sm:hidden">
                      <span className="max-w-[108px] truncate rounded-full bg-[#edf4ff] px-2.5 py-1 text-[11px] font-semibold text-[#2563eb]">{idea.category}</span>
                      <span className="max-w-[112px] truncate rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">{idea.questions[0] || "Manufacturing"}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-[13px] font-medium text-[#5f6b7a] sm:mt-1.5 sm:flex-wrap sm:gap-x-2.5 sm:gap-y-0.5 sm:text-[11px] max-sm:[&>span:nth-child(3)]:hidden">
                      <span className="inline-flex items-center gap-1"><Heart size={15} className="sm:size-[13px]" /> {idea.likeCount}<span className="hidden sm:inline"> Love</span></span>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={15} className="sm:size-[13px]" /> {idea.comments.length}<span className="hidden sm:inline"> Comments</span></span>
                      <span className="inline-flex items-center gap-1 sm:hidden"><Eye size={15} /> {ideaViews(idea)}</span>
                      <span className="hidden items-center gap-1 sm:inline-flex"><ShoppingBag size={13} /> {idea.interestedCount} I'd Buy</span>
                      <span className="hidden items-center gap-1 sm:inline-flex"><Eye size={13} /> {ideaViews(idea)} Views</span>
                      <span className="hidden text-[#315fbd] sm:inline">Last reply {timeAgo(idea.updatedAt || idea.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between sm:hidden">
                      <div className="flex -space-x-2">
                        <CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="size-6 border-2 border-white text-[9px]" />
                        {["TY", "CM"].map((avatar, avatarIndex) => (
                          <span key={`${idea.id}-mobile-${avatar}`} className={cn(
                            "flex size-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold",
                            avatarIndex === 0 ? "bg-[#2563eb] text-white" : "bg-[#e9f7f3] text-[#0f766e]"
                          )}>
                            {avatar}
                          </span>
                        ))}
                      </div>
                      <span className="size-3 rounded-full bg-[#14b8a6] shadow-[0_0_0_5px_rgba(20,184,166,0.12)]" />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between max-sm:hidden">
                      <div className="flex -space-x-2">
                        <CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="size-6 border-2 text-[9px]" />
                        {["TY", "CM"].map((avatar, avatarIndex) => (
                          <span key={`${idea.id}-${avatar}`} className={cn(
                            "flex size-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold",
                            avatarIndex === 0 ? "bg-[#2563eb] text-white" : "bg-[#e9f7f3] text-[#0f766e]"
                          )}>
                            {avatar}
                          </span>
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-[#8b93a1]">Founder + TYORA + makers</span>
                    </div>
                  </div>
                </Link>
                  ))}
                  {homeExamples.map((example, index) => (
                    <Link key={example.title} href="/ask/new" className="group grid grid-cols-[124px_minmax(0,1fr)] gap-3 rounded-[24px] border border-dashed border-[#cdd6e2] bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-[180ms] hover:-translate-y-1 hover:border-[#93c5fd] hover:bg-white hover:shadow-[0_20px_46px_rgba(37,99,235,0.14)] sm:grid-cols-[132px_1fr] sm:gap-2.5 sm:rounded-[12px] sm:bg-white/94 sm:p-2 sm:shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                      <div className={cn(
                        "relative flex aspect-square items-center justify-center rounded-[20px] bg-gradient-to-br shadow-inner shadow-white sm:rounded-xl",
                        index === 0 ? "from-[#e9f7f3] via-white to-[#efe9ff]" : index === 1 ? "from-[#fff4e7] via-white to-[#e9f2ff]" : "from-[#edf7ff] via-white to-[#effaf3]"
                      )}>
                        <span className="rounded-2xl bg-white/78 px-3 py-2 text-lg font-semibold shadow-sm ring-1 ring-white">
                          {example.title.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#69707d] ring-1 ring-[#e8ebef] max-sm:hidden">
                          Example
                        </span>
                      </div>
                      <div className="min-w-0 py-0.5 sm:py-0">
                        <div className="flex items-center gap-2 text-xs font-medium text-[#69707d] sm:hidden">
                          <span>founder</span>
                          <span className="size-1.5 rounded-full bg-[#14b8a6] shadow-[0_0_0_4px_rgba(20,184,166,0.1)]" />
                          <span className="text-[#536174]">Ready for review</span>
                          <span className="ml-auto">{exampleMetrics[index].reply}</span>
                          <MoreHorizontal size={16} className="text-[#9aa4b2]" />
                        </div>
                        <div className="hidden flex-wrap gap-2 text-xs text-[#69707d] sm:flex">
                          <span className="rounded-full bg-[#f4f6f8] px-2 py-1">{example.category}</span>
                          <span className="inline-flex items-center gap-1 text-[#0f766e]"><span className="size-1.5 rounded-full bg-[#14b8a6]" /> Ready for review</span>
                        </div>
                        <h3 className="mt-1.5 line-clamp-1 text-[17px] font-semibold leading-tight text-[#111827] sm:text-base">{example.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#536174] sm:text-[13px] sm:text-[#59616e]">{example.description}</p>
                        <div className="mt-2 flex gap-1.5 sm:hidden">
                          <span className="max-w-[112px] truncate rounded-full bg-[#edf4ff] px-2.5 py-1 text-[11px] font-semibold text-[#2563eb]">{example.category}</span>
                          <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">Example</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-[13px] font-medium text-[#5f6b7a] sm:mt-1.5 sm:flex-wrap sm:gap-x-2.5 sm:gap-y-0.5 sm:text-[11px]">
                          <span className="inline-flex items-center gap-1"><Heart size={15} className="sm:size-[13px]" /> {exampleMetrics[index].love}<span className="hidden sm:inline"> Love</span></span>
                          <span className="inline-flex items-center gap-1"><MessageCircle size={15} className="sm:size-[13px]" /> {exampleMetrics[index].comments}<span className="hidden sm:inline"> Comments</span></span>
                          <span className="inline-flex items-center gap-1 sm:hidden"><Eye size={15} /> {exampleMetrics[index].views}</span>
                          <span className="hidden items-center gap-1 sm:inline-flex"><ShoppingBag size={13} /> {exampleMetrics[index].buy} I'd Buy</span>
                          <span className="hidden items-center gap-1 sm:inline-flex"><Eye size={13} /> {exampleMetrics[index].views} Views</span>
                          <span className="hidden text-[#315fbd] sm:inline">Last reply {exampleMetrics[index].reply}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between sm:hidden">
                          <div className="flex -space-x-2">
                            {exampleMetrics[index].avatars.map((avatar) => (
                              <span key={`${example.title}-feed-mobile-${avatar}`} className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#101216] text-[9px] font-semibold text-white">
                                {avatar}
                              </span>
                            ))}
                          </div>
                          <span className="size-3 rounded-full bg-[#14b8a6] shadow-[0_0_0_5px_rgba(20,184,166,0.12)]" />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between max-sm:hidden">
                          <div className="flex -space-x-2">
                            {exampleMetrics[index].avatars.map((avatar) => (
                              <span key={avatar} className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#101216] text-[9px] font-semibold text-white">
                                {avatar}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] font-semibold text-[#8b93a1]">Example activity</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/ask" className="inline-flex h-11 items-center justify-center rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#2563eb] shadow-sm shadow-[#101216]/4 transition hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:bg-[#f8fbff]">
                    View all ideas in Ideas
                  </Link>
                </>
              )}
            </div>

            <div className="mt-2.5 rounded-[18px] border border-[#dfe6ef] bg-white/96 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:hidden">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
                <Users size={14} /> Community is the product
              </p>
              <div className="mt-2 grid gap-2.5">
                <div>
                  <h2 className="text-[1.45rem] font-semibold leading-[1.08] tracking-normal">What are founders building next?</h2>
                  <p className="mt-1.5 text-sm leading-5 text-[#59616e]">
                    Share your idea. Get a FREE manufacturing review within 8 working hours.
                  </p>
                  <p className="mt-1.5 break-words text-xs font-semibold text-[#315fbd]">Founders are discussing product ideas with TYORA manufacturing experts.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/ask/new" className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${primaryButton}`}><Upload size={16} /> Start a Discussion</Link>
                  <Link href="/ask" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold"><SearchCheck size={16} /> Browse Ideas</Link>
                </div>
              </div>
            </div>

            <div className="mt-3 hidden gap-3 sm:grid xl:hidden">
              <section className="rounded-[16px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Live Activity</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-1 text-[11px] font-semibold text-[#0f766e]">
                    <span className="size-1.5 rounded-full bg-[#14b8a6] animate-pulse" /> LIVE
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[#59616e]">
                  {communityIdeas.length === 0 ? (
                    fallbackActivity.slice(0, 3).map(([label, stamp, dot]) => (
                      <p key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fa] p-3">
                        <span className="inline-flex items-center gap-2"><span className={`size-2 rounded-full ${dot}`} />{label}</span>
                        <span className="shrink-0 text-xs text-[#8b93a1]">{stamp}</span>
                      </p>
                    ))
                  ) : communityIdeas.slice(0, 2).map((idea) => (
                    <p key={idea.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fa] p-3">
                      <span>{idea.author.name} uploaded {idea.title}</span>
                      <span className="shrink-0 text-xs text-[#8b93a1]">{timeAgo(idea.updatedAt || idea.createdAt)}</span>
                    </p>
                  ))}
                </div>
              </section>
              <section className="rounded-[16px] border border-[#e4e8ef] bg-white p-4">
                <h2 className="text-base font-semibold">Community Flow</h2>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm text-[#59616e]">
                  {["Idea", "Discussion", "TYORA Review", "Project", "Manufacturing", "Delivered"].map((step) => (
                    <span key={step} className="whitespace-nowrap rounded-full bg-[#f7f8fa] px-3 py-2">{step}</span>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <aside className="hidden space-y-3 self-start xl:sticky xl:top-20 xl:block">
            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-3.5 shadow-[0_10px_36px_rgba(15,23,42,0.07)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Live Activity</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-1 text-[11px] font-semibold text-[#0f766e]"><span className="size-1.5 rounded-full bg-[#14b8a6] animate-pulse shadow-[0_0_0_4px_rgba(20,184,166,0.12)]" /> LIVE</span>
              </div>
              <div className="mt-3 space-y-2">
                {communityIdeas.length === 0 ? (
                  fallbackActivity.map(([label, stamp, dot]) => (
                    <p key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]">
                      <span className="inline-flex items-center gap-2"><span className={`size-2 rounded-full ${dot}`} />{label}</span>
                      <span className="shrink-0 text-[11px] text-[#8b93a1]">{stamp}</span>
                    </p>
                  ))
                ) : null}
                {communityIdeas.slice(0, 4).map((idea, index) => <p key={idea.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]"><span className="inline-flex items-center gap-2"><span className={`size-2 rounded-full ${index % 3 === 0 ? "bg-[#14b8a6]" : index % 3 === 1 ? "bg-[#f59e0b]" : "bg-[#2563eb]"}`} />{idea.author.name} uploaded {idea.title}</span><span className="shrink-0 text-[11px] text-[#8b93a1]">{timeAgo(idea.updatedAt || idea.createdAt)}</span></p>)}
              </div>
            </section>
            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-3.5 shadow-sm shadow-[#101216]/4">
              <h2 className="text-base font-semibold">Products Built</h2>
              <div className="mt-3 space-y-2">
                {["Portable Coffee Mug", "Magnetic Phone Stand", "Pet Water Bottle"].map((product, index) => (
                  <p key={product} className="flex items-center justify-between rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]">
                    <span>{product}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", index === 0 ? "bg-[#ede9fe] text-[#6d28d9]" : "bg-[#e9f7f3] text-[#0f766e]")}>{index === 0 ? "Manufacturing" : "Reviewed"}</span>
                  </p>
                ))}
              </div>
            </section>
            <section className="rounded-[16px] border border-[#e8ebef] bg-[#101216] p-3.5 text-white shadow-[0_16px_44px_rgba(15,23,42,0.18)]">
              <h2 className="text-base font-semibold">Journey of the Week</h2>
              <p className="mt-1 text-sm font-semibold text-white">Portable Coffee Mug</p>
              <div className="mt-3 grid gap-1.5 text-sm text-white/72">
                {featuredJourney.slice(0, 5).map(([step, , state]) => <span key={step} className={cn("flex items-center justify-between rounded-full px-3 py-1.5", state === "Active" ? "bg-[#2563eb] text-white" : "bg-white/8")}><span>{step}</span><span className="text-[10px] uppercase">{state}</span></span>)}
              </div>
              <Link href="/ask" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#101216]">View Full Journey</Link>
            </section>
            <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4">
              <h2 className="text-lg font-semibold">Community Statistics</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {(hasCommunityStats ? [
                  ["Ideas", communityIdeas.length],
                  ["Reviews", communityIdeas.filter((idea) => idea.review).length],
                  ["Projects", communityIdeas.filter((idea) => ["Project Started", "Manufacturing", "Shipping", "Completed"].includes(idea.status)).length],
                  ["Delivered", communityIdeas.filter((idea) => idea.status === "Completed").length]
                ] : [
                  ["Access", "Open"],
                  ["Reviews", "Free"],
                  ["Login", "Email"],
                  ["Stage", "Early"]
                ]).map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f8fa] p-3">
                    <p className="text-lg font-semibold text-[#101216]">{value}</p>
                    <p className="text-xs text-[#69707d]">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>

      {moduleVisibility.source ? (
      <section id="source-products" className="hidden scroll-mt-20 border-b border-[#dfe6ef] bg-[linear-gradient(180deg,rgba(246,247,251,0.92),rgba(255,255,255,0.82))] md:block">
        <div className="mx-auto max-w-7xl px-3 py-7 sm:px-5 lg:px-6 lg:py-9">
          <div className="grid gap-4 rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-[0_16px_46px_rgba(15,23,42,0.07)] lg:grid-cols-[0.95fr_1.05fr] lg:p-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
                <SearchCheck size={14} /> {sourceCopy.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">{sourceCopy.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#59616e]">
                {sourceCopy.subtitle}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/source" className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ${primaryButton}`}>
                  {sourceCopy.ctaText} <ArrowRight size={16} />
                </Link>
                <p className="flex items-center rounded-full bg-[#ecfdf5] px-3 py-2 text-xs font-semibold text-[#0f766e]">
                  {sourceRequestCount} {sourceCopy.statLabel.toLowerCase()}
                </p>
                <p className="flex items-center text-xs font-semibold text-[#69707d]">{sourceCopy.sampleNote}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {sourceProductSteps.map(({ step, title, body, icon: Icon }) => (
                <div key={title} className="rounded-[18px] border border-[#e4e8ef] bg-[#f8fafc] p-4 transition duration-[180ms] hover:-translate-y-1 hover:border-[#93c5fd] hover:bg-white hover:shadow-[0_12px_34px_rgba(37,99,235,0.11)]">
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-[#101216] text-sm font-semibold text-white">{step}</span>
                  <div className="mt-4 flex items-center gap-2">
                    <Icon size={16} className="text-[#2563eb]" />
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#69707d]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {moduleVisibility.journeys ? (
      <section id="journeys" className="hidden scroll-mt-20 border-b border-[#dfe6ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(246,247,251,0.88))] md:block">
        <div className="mx-auto max-w-7xl px-3 py-8 sm:px-5 lg:px-6 lg:py-10">
          <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-stretch">
            <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-[0_12px_38px_rgba(15,23,42,0.07)]">
              <p className="inline-flex rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">Featured Journey</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">Portable Coffee Mug</h2>
              <p className="mt-3 text-sm leading-6 text-[#59616e]">
                A founder starts with a spill-proof travel mug idea. The community tightens the lid, grip and MOQ questions, TYORA reviews the manufacturing path, and the project moves into production planning.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["SA", "TY", "AL", "MI"].map((avatar, index) => (
                    <span key={avatar} className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold",
                      index === 1 ? "bg-[#2563eb] text-white" : index === 2 ? "bg-[#e9f7f3] text-[#0f766e]" : "bg-[#101216] text-white"
                    )}>{avatar}</span>
                  ))}
                </div>
                <p className="text-xs font-semibold text-[#69707d]">Founder, TYORA reviewer and 12 makers involved</p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf1f6]">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#14b8a6] via-[#2563eb] to-[#8b5cf6]" />
              </div>
              <Link href="/ask/new" className={`mt-5 inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${primaryButton}`}>
                Start a similar discussion <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {featuredJourney.map(([step, description, state], index) => (
                <div key={step} className={cn(
                  "rounded-[16px] border bg-white p-3 shadow-sm shadow-[#101216]/4 transition duration-[180ms] hover:-translate-y-1 hover:border-[#93c5fd] hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)]",
                  state === "Active" ? "border-[#bfdbfe] bg-[#f5f9ff]" : "border-[#e4e8ef]"
                )}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase text-[#8b93a1]">Step {index + 1}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", state === "Active" ? "bg-[#dbeafe] text-[#1d4ed8]" : state === "Done" ? "bg-[#ecfdf5] text-[#0f766e]" : "bg-[#f4f6f8] text-[#69707d]")}>{state}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{step}</p>
                  <p className="mt-2 text-xs leading-5 text-[#69707d]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {moduleVisibility.successStories ? (
      <section id="success-stories" className="hidden scroll-mt-20 border-b border-[#dfe6ef] bg-[#f6f7fb]/80 md:block">
        <div className="mx-auto max-w-7xl px-3 py-8 sm:px-5 lg:px-6 lg:py-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#69707d]">Products Built by Community</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">Real journeys, not product catalog cards.</h2>
            </div>
            <Link href="/ask" className="text-sm font-semibold text-[#2563eb]">Browse all ideas →</Link>
          </div>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {[
              ...communityIdeas.slice(0, 3).map((idea) => ({
                title: idea.title,
                tag: idea.status,
                description: idea.description,
                meta: `${idea.country} · ${idea.author.name}`,
                href: `/ask/${idea.slug}`
              })),
              ...starterExamples.map((item) => ({
                title: item.title,
                tag: "Example",
                description: item.description,
                meta: item.category,
                href: "/ask/new"
              }))
            ].slice(0, 6).map((item, index) => (
              <Link
                key={`${item.title}-${index}`}
                href={item.href}
                className={cn(
                  "mb-4 block break-inside-avoid rounded-[18px] border border-[#dfe6ef] bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(15,23,42,0.1)]",
                  index % 3 === 1 ? "lg:mt-6" : index % 3 === 2 ? "lg:mt-3" : ""
                )}
              >
                <div className="flex min-h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e9f7f3] via-white to-[#eff4ff] text-2xl font-semibold">
                  {item.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs font-semibold text-[#59616e]">{item.tag}</span>
                  <span className="text-xs text-[#8b93a1]">{item.meta}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#59616e]">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {moduleVisibility.build ? (
      <>
      <section id="build" className="hidden scroll-mt-20 border-b border-[#dfe6ef] bg-[#f7f8fb] md:block">
        <div className="mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:px-5 lg:grid-cols-[1fr_360px] lg:items-center lg:px-6 lg:py-10">
          <div>
            <p className="w-fit rounded-full border border-[#e5e8ec] bg-white px-3 py-1 text-xs font-medium text-[#69707d]">
              TYORA Brand Film v2.0
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-[#101216] lg:text-[2.4rem]">
              The maker story behind the community.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#59616e]">
              Keep watching the product story unfold: idea, discussion, review, prototype, manufacturing and delivery.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#69707d]">
              {["Independent review", "Factory fit", "Production clarity"].map((item) => (
                <span key={item} className="rounded-full border border-[#e8ebef] bg-white px-3 py-2">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Card className="w-full overflow-hidden rounded-2xl border-[#e6e9ee] bg-white p-2 shadow-xl shadow-[#101216]/10 transition hover:-translate-y-0.5 hover:shadow-[#101216]/15">
            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              className="group relative block w-full overflow-hidden rounded-xl bg-[#101216] text-left"
              aria-label="Watch TYORA brand film"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandFilmPoster}
                alt="TYORA brand film poster"
                className="aspect-[9/16] w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.015] group-hover:opacity-100"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#101216]/45 via-transparent to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#101216] backdrop-blur">
                30 second story
              </span>
              <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#101216] shadow-xl transition group-hover:scale-105">
                <Play size={22} fill="currentColor" />
              </span>
              <span className="absolute bottom-5 left-5 right-5 text-white">
                <span className="block text-sm text-white/75">TYORA Brand Film</span>
                <span className="mt-1 block text-lg font-semibold">A calmer path from idea to production.</span>
              </span>
            </button>
          </Card>
        </div>
      </section>

      <section className="hidden border-b border-[#dfe6ef] bg-white/88 md:block">
        <div className="mx-auto max-w-7xl px-3 py-7 sm:px-5 lg:px-6 lg:py-9">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-medium text-[#69707d]">When you're ready to build</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">Turn a good discussion into a manufacturing plan.</h2>
            </div>
            <p className="text-sm leading-6 text-[#59616e]">
              Community comes first. When an idea is ready, TYORA helps founders move from feedback into feasibility, factory fit, samples, quality and shipping with clearer decisions.
            </p>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {buildSupportCards.map(([title, description, Icon]) => (
              <Card key={title} className="rounded-[16px] bg-white p-4 shadow-sm shadow-[#101216]/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/6">
                <Icon size={20} className="text-[#101216]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#59616e]">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      </>
      ) : null}

      {moduleVisibility.pricing ? (
      <section id="pricing" className="hidden border-y border-[#eef1f4] bg-[#fbfbfc] md:block">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="text-[2rem] font-semibold leading-tight lg:text-[2.25rem]">{displayContent.pricingTitle}</h2>
          <p className="mt-2 text-[#59616e]">{displayContent.pricingSubtitle}</p>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {displayContent.pricing.filter((plan) => plan.visible).map((plan) => {
              const isPopular = Boolean(plan.badge);
              return (
              <Card key={plan.name} className={cn(
                "relative flex h-full flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5 lg:p-6",
                isPopular ? "border-[#101216] shadow-lg shadow-[#101216]/5" : ""
              )}>
                <div className="flex min-h-7 items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold lg:text-2xl">{plan.name}</h3>
                    {plan.subtitle ? <p className="mt-1 text-sm font-medium text-[#69707d]">{plan.subtitle}</p> : null}
                  </div>
                  {isPopular ? (
                    <span className="rounded-full bg-[#0f766e] px-2.5 py-1 text-xs font-medium text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 border-y border-[#eef1f4] py-4">
                  {plan.priceLabel ? <p className="text-sm font-medium text-[#69707d]">{plan.priceLabel}</p> : null}
                  <p className="mt-1 text-2xl font-semibold">{plan.price}</p>
                  {plan.priceSuffix ? (
                    <div className="mt-2 space-y-1 text-sm font-semibold text-[#101216]">
                      {plan.priceSuffix.split("\n").map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
                {plan.description ? (
                  <div className="mt-4 space-y-2 text-sm leading-6 text-[#59616e]">
                    {plan.description.split("\n\n").map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
                {plan.highlightBanner ? (
                  <p className="mt-4 rounded-md bg-[#e7f5f2] px-4 py-3 text-sm font-semibold text-[#0f766e]">
                    {plan.highlightBanner}
                  </p>
                ) : null}
                <p className="mt-5 text-sm font-semibold">Included</p>
                <ul className="mt-3 space-y-2 text-sm text-[#59616e] lg:space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 shrink-0 text-[#0f766e]" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.exclusions && plan.exclusions.length > 0 ? (
                  <>
                    <p className="mt-5 text-sm font-semibold">Not Included</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#59616e] lg:space-y-3">
                      {plan.exclusions.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <X className="mt-0.5 shrink-0 text-[#b42318]" size={16} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {plan.note ? (
                  <div className="mt-5 text-sm text-[#69707d]">
                    {plan.note.split("\n").map((line, index) => (
                      <p key={`${line}-${index}`} className={index === 0 ? "font-semibold text-[#101216]" : "mt-1"}>
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
                {plan.bottomNote ? <p className="mt-auto pt-5 text-sm font-medium text-[#69707d]">{plan.bottomNote}</p> : null}
                <Link href="/ask/new" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#101216] px-4 text-sm font-medium text-white transition hover:bg-[#1f2329]">
                  {plan.ctaText} <ArrowRight size={16} />
                </Link>
              </Card>
              );
            })}
          </div>
          <div className="mt-8 rounded-lg border border-[#e8ebef] bg-white p-5 text-center">
            <p className="font-semibold">{displayContent.pricingProofA}</p>
            <p className="mt-2 text-sm text-[#59616e]">{displayContent.pricingProofB}</p>
          </div>
        </div>
      </section>
      ) : null}

      {moduleVisibility.founder ? (
      <section className="hidden border-y border-[#eef1f4] bg-white md:block">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-medium text-[#69707d]">About TYORA</p>
            <h2 className="mt-4 text-[2rem] font-semibold leading-tight lg:text-[2.6rem]">
              {displayContent.founderTitle}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#59616e] lg:text-lg lg:leading-8">
              {displayContent.founderText}
            </p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")}>
              <Button className="mt-6 min-h-12">
                <MessageCircle size={16} /> Talk To TYORA On WhatsApp
              </Button>
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["For early product ideas", "Bring a rough idea, reference image, or product name. TYORA helps turn it into a practical manufacturing conversation."],
              ["For US launch teams", "Get China manufacturing support without trying to manage every supplier detail alone."],
              ["For risk reduction", "Clarify feasibility, samples, quality checks, timelines, and handoff points before production."],
              ["For practical execution", "Move from review to factory matching, sample coordination, production follow-up, and delivery support."]
            ].map(([title, description]) => (
              <Card key={title} className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {moduleVisibility.faq ? (
      <section id="faq" className="hidden border-y border-[#eef1f4] bg-[#fbfbfc] md:block">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mb-6 max-w-3xl">
            <p className="text-sm font-medium text-[#69707d]">FAQ</p>
            <h2 className="mt-3 text-[2rem] font-semibold leading-tight lg:text-[2.35rem]">
              Questions founders ask before building with TYORA
            </h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-[14px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  {item.question}
                  <span className="text-[#8b93a1] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {moduleVisibility.finalCta ? (
      <section className="hidden border-y border-[#eef1f4] bg-white px-4 py-16 sm:px-6 md:block lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[2.5rem] font-semibold leading-tight tracking-normal lg:text-[4rem]">
            Ready to build your product?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#59616e] lg:text-lg lg:leading-8">
            Start your manufacturing journey with confidence.
          </p>
          <Link href="/ask/new" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#101216] px-6 text-sm font-medium text-white transition hover:bg-[#1f2329]">
            Start Building <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      ) : null}

      <footer className="hidden border-t border-[#eef1f4] px-4 py-6 sm:block sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#59616e] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#101216]">{displayContent.brandName}</p>
            <p>{displayContent.footerSlogan}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href={`mailto:${displayContent.email}`} onClick={() => trackAnalyticsEvent("email_click")}>{t.email}</a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")}>{t.whatsApp}</a>
            <a href={displayContent.linkedInLink} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("linkedin_click")}>{t.linkedIn}</a>
          </div>
        </div>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackAnalyticsEvent("whatsapp_click")}
        className="fixed inset-x-4 bottom-3 z-40 hidden min-h-12 items-center justify-center gap-2 rounded-full bg-[#0f766e] px-4 text-sm font-medium text-white shadow-2xl shadow-[#0f766e]/20 transition hover:scale-[1.02] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:inline-flex sm:px-5"
      >
        <MessageCircle size={18} />
        {t.startWhatsAppChat}
      </a>

      <AnimatePresence>
        {videoModalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#101216]/70 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="relative w-full max-w-[420px] overflow-hidden rounded-2xl bg-white p-2 shadow-2xl shadow-black/30"
            >
              <button
                type="button"
                className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#101216] shadow-lg backdrop-blur transition hover:bg-white"
                onClick={() => setVideoModalOpen(false)}
                aria-label="Close video"
              >
                <X size={18} />
              </button>
              <video
                className="aspect-[9/16] w-full rounded-xl bg-[#101216] object-cover"
                src={brandFilmUrl}
                poster={brandFilmPoster}
                controls
                muted
                playsInline
                preload="metadata"
              />
            </motion.div>
          </motion.div>
        ) : null}
        {wizardOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-[#101216]/30 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="mx-auto flex h-full max-h-[820px] max-w-3xl flex-col overflow-hidden rounded-2xl bg-white soft-shadow"
            >
              <div className="border-b border-[#eef1f4] p-4">
                <div className="flex items-center justify-between">
                  <button
                    className="rounded-lg p-2 hover:bg-[#f5f6f8]"
                    onClick={() => setWizardOpen(false)}
                    aria-label={t.closeConversation}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <p className="text-sm text-[#69707d]">{t.conversationStart}</p>
                  <div className="w-9" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-medium text-[#69707d]">
                  <span className="rounded-full bg-[#f5f6f8] px-2 py-2">{t.uploadYourIdea}</span>
                  <span className="rounded-full bg-[#f5f6f8] px-2 py-2">{t.productName}</span>
                  <span className="rounded-full bg-[#e6f7f4] px-2 py-2 text-[#0f766e]">{t.whatsApp}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                <div className="space-y-7">
                  <section className="space-y-4">
                    <div className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#101216] text-white">
                        <Upload size={16} />
                      </span>
                      <div>
                        <h2 className="text-2xl font-semibold">{t.uploadYourIdea}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#59616e]">{t.uploadIdeaSubtitle}</p>
                      </div>
                    </div>
                    <div className="ml-0 rounded-lg border border-[#e1e5ea] bg-[#fbfbfc] p-4 sm:ml-12">
                      <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#cfd5dd] bg-white px-4 text-sm font-medium transition hover:bg-[#f5f6f8]">
                        <Upload size={16} />
                        {fileName || t.uploadDesign}
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/*,.pdf,.step,.stp,.iges,.igs,.obj,.stl,.dwg,.dxf"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setSelectedFile(file);
                            setFileName(file?.name || "");
                          }}
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#69707d]">
                        {supportedUploads.map((item) => (
                          <span key={item} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-[#e8ebef]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#101216] text-white">
                        <PackageCheck size={16} />
                      </span>
                      <div>
                        <h2 className="text-2xl font-semibold">{t.productName}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#59616e]">{t.productNameSubtitle}</p>
                      </div>
                    </div>
                    <div className="ml-0 sm:ml-12">
                      <Input
                        value={productName}
                        placeholder={t.productNamePlaceholder}
                        onChange={(event) => setProductName(event.target.value)}
                        className="min-h-14 text-base"
                      />
                      {!productName.trim() ? (
                        <p className="mt-3 text-sm text-[#8c94a1]">{t.productNameExample}</p>
                      ) : null}
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-[#eef1f4] p-4">
                <Button onClick={() => void startWhatsAppChat()} disabled={!canStartChat || submitting}>
                  <MessageCircle size={16} />
                  {submitting ? t.saving : t.startWhatsAppChat}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
