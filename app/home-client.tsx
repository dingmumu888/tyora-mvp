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
  Heart,
  Layers,
  MessageCircle,
  PackageCheck,
  Play,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  Users,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
const heroFeatureCards = [
  {
    title: "Manufacturing Review",
    description: "Review your product before production.",
    icon: ClipboardCheck
  },
  {
    title: "Factory Matching",
    description: "Find manufacturers that actually fit your project.",
    icon: SearchCheck
  },
  {
    title: "Quote Comparison",
    description: "Compare quotations with confidence.",
    icon: Layers
  },
  {
    title: "Production Support",
    description: "Stay in control throughout manufacturing.",
    icon: PackageCheck
  }
];
const heroSteps = [
  ["Idea", Sparkles],
  ["Review", ClipboardCheck],
  ["Factory", SearchCheck],
  ["Sample", PackageCheck],
  ["Production", Truck]
] as const;
const whyTyoraCards = [
  ["Independent Advice", "We work for founders, not factories.", ShieldCheck],
  ["Transparent Process", "Clear communication and predictable workflows.", ClipboardCheck],
  ["Built for Product Founders", "Designed specifically for startups, inventors and growing brands.", Layers]
] as const;

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
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#101216]">
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
            {[
              ["Discover Ideas", "/ask"],
              ["Ask TYORA", "/ask/new"],
              ["Journeys", "/ask"],
              ["Success Stories", "/ask"],
              ["Pricing", "#pricing"]
            ].map(([label, href]) => (
              <Link key={label} href={href} className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition hover:bg-[#f5f6f8] hover:text-[#101216]",
                label === "Discover Ideas" ? "bg-[#101216] text-white hover:bg-[#101216] hover:text-white" : "text-[#59616e]"
              )}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden h-10 w-44 items-center gap-2 rounded-full border border-[#e1e5ea] bg-white px-3 text-sm text-[#8b93a1] xl:flex">
              <SearchCheck size={15} /> Search
            </div>
            <a href="/api/community/auth/google" className="hidden rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold md:inline-flex">Google Login</a>
            <Link href="/ask/new" className="hidden h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white sm:inline-flex">
              <Upload size={15} /> <span className="hidden sm:inline">Upload My Idea</span>
            </Link>
            <button className="hidden size-10 items-center justify-center rounded-full border border-[#dfe3e8] md:inline-flex" aria-label="Notifications">
              <Bell size={15} />
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#eef1f4] bg-[#f7f8fa]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:px-8">
          <aside className="hidden rounded-[22px] border border-[#e8ebef] bg-white p-5 shadow-sm shadow-[#101216]/4 lg:block">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101216] text-white"><Sparkles size={18} /></div>
            <h2 className="mt-4 text-lg font-semibold">Ask TYORA Community</h2>
            <p className="mt-2 text-sm leading-6 text-[#69707d]">Product creators discussing ideas with Chinese manufacturing expertise.</p>
            <Link href="/ask/new" className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#101216] text-sm font-semibold text-white">
              <Upload size={15} /> Upload My Idea
            </Link>
            <Link href="/ask" className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full border border-[#dfe3e8] text-sm font-semibold">Browse Ideas</Link>
            <p className="mt-3 rounded-2xl bg-[#e9f7f3] p-3 text-sm font-semibold text-[#0f766e]">3 FREE Expert Reviews per day</p>
          </aside>

          <div className="min-w-0">
            <div className="rounded-[28px] border border-[#e8ebef] bg-white p-5 shadow-sm shadow-[#101216]/4 sm:p-7 lg:p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
                <Users size={14} /> Community is the product
              </p>
              <div className="mt-4 grid gap-4">
                <div>
                  <h1 className="max-w-3xl text-3xl font-semibold leading-[1.08] tracking-normal sm:text-5xl lg:text-[3rem]">What&apos;s your next idea?</h1>
                  <p className="mt-4 max-w-[300px] text-base leading-7 text-[#59616e] sm:max-w-2xl sm:text-lg">
                    Upload your idea. Get a FREE manufacturing review within 8 working hours.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/ask/new" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white"><Upload size={16} /> Upload My Idea</Link>
                  <Link href="/ask" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-5 text-sm font-semibold"><SearchCheck size={16} /> Browse Ideas</Link>
                </div>
              </div>
              <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1 xl:grid xl:grid-cols-5 xl:overflow-visible xl:pb-0">
                {[
                  ["Ideas Shared", communityIdeas.length],
                  ["TYORA Reviews", communityIdeas.filter((idea) => idea.review).length],
                  ["Projects Started", communityIdeas.filter((idea) => ["Project Started", "Manufacturing", "Shipping", "Completed"].includes(idea.status)).length],
                  ["Products Delivered", communityIdeas.filter((idea) => idea.status === "Completed").length],
                  ["Countries", new Set(communityIdeas.map((idea) => idea.country).filter(Boolean)).size]
                ].map(([label, value]) => (
                  <div key={label} className="min-w-[132px] rounded-2xl border border-[#eef1f4] bg-[#fbfbfc] p-3 sm:min-w-[150px] xl:min-w-0">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs font-medium text-[#69707d]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
              {["Trending", "Newest", "Most Discussed", "Latest TYORA Reply", "Recently Uploaded"].map((item, index) => (
                <Link key={item} href="/ask" className={cn("whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold", index === 0 ? "bg-[#101216] text-white" : "border border-[#dfe3e8] bg-white text-[#59616e]")}>{item}</Link>
              ))}
            </div>

            <div className="mt-3 grid gap-3">
              {communityIdeas.length === 0 ? (
                <Link href="/ask/new" className="rounded-[22px] border border-dashed border-[#cfd5dc] bg-white p-8 text-center">
                  <p className="mx-auto max-w-[280px] text-lg font-semibold">Be the first product creator to start a discussion.</p>
                  <p className="mx-auto mt-2 max-w-[280px] text-sm text-[#69707d]">No fake activity. Real uploads and replies will appear here.</p>
                </Link>
              ) : communityIdeas.slice(0, 5).map((idea) => (
                <Link key={idea.id} href={`/ask/${idea.slug}`} className="grid gap-3 rounded-[18px] border border-[#e8ebef] bg-white p-4 shadow-sm shadow-[#101216]/4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/8 sm:grid-cols-[132px_1fr]">
                  <div className="flex min-h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e9f7f3] via-white to-[#efe9ff] text-xl font-semibold">
                    {idea.imageUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={idea.imageUrls[0]} alt={idea.title} loading="lazy" className="size-full rounded-2xl object-cover" />
                    ) : idea.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs text-[#69707d]">
                      <span>{idea.country}</span><span>{idea.author.name}</span><span>{idea.status}</span>
                    </div>
                    <h2 className="mt-2 line-clamp-1 text-xl font-semibold">{idea.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#59616e]">{idea.description}</p>
                    <div className="mt-3 flex gap-4 text-xs font-medium text-[#69707d]">
                      <span className="inline-flex items-center gap-1"><Heart size={14} /> {idea.likeCount}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {idea.comments.length}</span>
                      <span className="inline-flex items-center gap-1"><Eye size={14} /> {Math.max(idea.likeCount + idea.comments.length + idea.interestedCount, 1) * 17}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="hidden space-y-4 xl:block">
            <section className="rounded-[22px] border border-[#e8ebef] bg-white p-5 shadow-sm shadow-[#101216]/4">
              <h2 className="text-lg font-semibold">Live Activity</h2>
              <div className="mt-4 space-y-3">
                {communityIdeas.length === 0 ? <p className="text-sm leading-6 text-[#69707d]">Real uploads, TYORA replies, comments and likes will appear here.</p> : null}
                {communityIdeas.slice(0, 4).map((idea) => <p key={idea.id} className="rounded-2xl bg-[#f7f8fa] p-3 text-sm text-[#59616e]">{idea.author.name} uploaded {idea.title}</p>)}
              </div>
            </section>
            <section className="rounded-[22px] border border-[#e8ebef] bg-[#101216] p-5 text-white">
              <h2 className="text-lg font-semibold">Journey of the Week</h2>
              <div className="mt-4 grid gap-2 text-sm text-white/72">
                {["Idea", "TYORA Review", "Prototype", "Manufacturing", "Delivered"].map((step) => <span key={step} className="rounded-full bg-white/8 px-3 py-2">{step}</span>)}
              </div>
              <Link href="/ask" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#101216]">View Full Journey</Link>
            </section>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#eef1f4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.58fr_0.42fr] lg:items-center lg:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col justify-center"
          >
            <p className="mb-5 w-fit rounded-full border border-[#e5e8ec] bg-[#fbfbfc] px-3 py-1 text-xs font-medium text-[#69707d] lg:text-sm">
              TYORA Brand Film v2.0
            </p>
            <h2 className="max-w-3xl text-[2.2rem] font-semibold leading-tight tracking-normal sm:text-[3rem] lg:text-[3.4rem]">
              See how product ideas become real.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#59616e] sm:text-lg sm:leading-8">
              The service story is still here, but the community now leads TYORA. Watch the brand film, then explore the ideas founders are discussing.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <Button onClick={openWizard} className="min-h-12 px-5">
                Start Your Project <ArrowRight size={16} />
              </Button>
              <Button variant="outline" className="min-h-12 px-5" onClick={() => setVideoModalOpen(true)}>
                <Play size={16} /> Watch Our Story
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-[#69707d]">
              {["Independent review", "Factory fit", "Production clarity"].map((item) => (
                <span key={item} className="rounded-full border border-[#e8ebef] bg-white px-3 py-2">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="flex items-center"
          >
            <Card className="w-full overflow-hidden rounded-2xl border-[#e6e9ee] bg-white p-2 shadow-2xl shadow-[#101216]/10 transition hover:-translate-y-0.5 hover:shadow-[#101216]/15">
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
                <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#101216] shadow-xl transition group-hover:scale-105">
                  <Play size={24} fill="currentColor" />
                </span>
                <span className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="block text-sm text-white/75">TYORA Brand Film</span>
                  <span className="mt-1 block text-xl font-semibold">A calmer path from idea to production.</span>
                </span>
              </button>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-[#eef1f4] bg-[#fbfbfc]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {heroFeatureCards.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <Card className="h-full rounded-xl p-6 shadow-sm shadow-[#101216]/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-[#101216] text-white">
                    <Icon size={18} />
                  </span>
                  <h2 className="mt-6 text-lg font-semibold">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#59616e]">{description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#eef1f4] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium text-[#69707d]">How It Works</p>
            <h2 className="mt-3 text-[2.25rem] font-semibold leading-tight lg:text-[3rem]">
              Five simple steps from idea to production.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-5">
            {heroSteps.map(([step, Icon], index) => (
              <div key={step} className="relative">
                <Card className="flex h-full min-h-36 flex-col items-center justify-center rounded-xl p-5 text-center shadow-sm shadow-[#101216]/5">
                  <Icon size={22} className="text-[#101216]" />
                  <h3 className="mt-4 font-semibold">{step}</h3>
                </Card>
                {index < heroSteps.length - 1 ? (
                  <span className="hidden md:block absolute right-[-1.05rem] top-1/2 z-10 -translate-y-1/2 text-[#b2bac5]">
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#eef1f4] bg-[#fbfbfc]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-medium text-[#69707d]">Why TYORA</p>
              <h2 className="mt-3 text-[2.25rem] font-semibold leading-tight lg:text-[3rem]">
                Better decisions before manufacturing gets expensive.
              </h2>
            </div>
            <p className="text-base leading-7 text-[#59616e] lg:text-lg lg:leading-8">
              TYORA helps founders understand tradeoffs, compare options, and stay in control before committing to production.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {whyTyoraCards.map(([title, description, Icon]) => (
              <Card key={title} className="rounded-xl bg-white p-6 shadow-sm shadow-[#101216]/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/6">
                <Icon size={22} className="text-[#101216]" />
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[2.25rem] font-semibold leading-tight">{t.caseStudies}</h2>
            <p className="mt-2 text-[#59616e]">{t.seeEditable}</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {visibleCases.map((story, index) => (
            <Card key={story.name} className={cn(
              "p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5",
              index >= 3 && !showAllMobileCases ? "hidden lg:block" : ""
            )}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold">{story.name}</h3>
                <span className="rounded-full bg-[#e6f7f4] px-2.5 py-1 text-xs font-medium text-[#0f766e]">
                  {story.status}
                </span>
              </div>
              <div className="grid gap-4">
                {[
                  { label: story.concept, image: story.conceptImage, stage: "concept" },
                  { label: story.prototype, image: story.prototypeImage, stage: "prototype" },
                  { label: story.final, image: story.finalImage, stage: "final" }
                ].map(({ label, image, stage }, itemIndex) => (
                  <div key={label} className="space-y-2">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg bg-[#f7f8fa] text-center text-sm font-medium text-[#69707d] ring-1 ring-[#e8ebef]",
                      stage === "final"
                        ? "h-52 sm:h-56 lg:h-60"
                        : stage === "prototype"
                          ? "h-40 sm:h-44 lg:h-48"
                          : "h-44 sm:h-48 lg:h-52"
                    )}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={label}
                        className="h-[94%] w-[94%] max-w-none rounded-md object-contain"
                      />
                    ) : (
                      label
                    )}
                  </div>
                  {itemIndex < 2 ? (
                    <div className="text-center text-sm leading-none text-[#b2bac5]">↓</div>
                  ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        {visibleCases.length > 3 ? (
          <Button
            variant="outline"
            className="mt-4 min-h-12 w-full lg:hidden"
            onClick={() => setShowAllMobileCases((current) => !current)}
          >
            {showAllMobileCases ? "Show Fewer Projects" : "View More Projects"}
          </Button>
        ) : null}
      </section>

      <section className="border-y border-[#eef1f4] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="text-[2rem] font-semibold leading-tight lg:text-[2.25rem]">{t.trustTitle}</h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-4">
            {t.trustCards.map(([title, description]) => (
              <Card key={title} className="p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-[#eef1f4] bg-[#fbfbfc]">
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
                <Button onClick={openWizard} className="mt-6 min-h-11 w-full">
                  {plan.ctaText} <ArrowRight size={16} />
                </Button>
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

      <section className="border-y border-[#eef1f4] bg-white">
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

      <section id="faq" className="border-y border-[#eef1f4] bg-[#fbfbfc]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-medium text-[#69707d]">FAQ</p>
            <h2 className="mt-4 text-[2rem] font-semibold leading-tight lg:text-[2.6rem]">
              Questions founders ask before building with TYORA
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.question} className="rounded-xl p-6 shadow-sm shadow-[#101216]/5">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-[#59616e]">{item.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#eef1f4] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[2.5rem] font-semibold leading-tight tracking-normal lg:text-[4rem]">
            Ready to build your product?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#59616e] lg:text-lg lg:leading-8">
            Start your manufacturing journey with confidence.
          </p>
          <Button onClick={openWizard} className="mt-8 min-h-12 px-6">
            Start Your Project <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#eef1f4] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
        className="fixed inset-x-4 bottom-3 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0f766e] px-4 text-sm font-medium text-white shadow-2xl shadow-[#0f766e]/20 transition hover:scale-[1.02] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:px-5"
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
