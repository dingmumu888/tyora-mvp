"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  MessageCircle,
  PackageCheck,
  Play,
  SearchCheck,
  Sparkles,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import CommunityUserMenu from "@/components/community-user-menu";
import { defaultContent, loadContent, SiteContent } from "@/lib/storage";
import { normalizeWhatsAppUrl } from "@/lib/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";

const brandFilmUrl = "/videos/TYORA_Brand_Film_v1.1_Final_v2.mp4";
const brandFilmPoster = "/videos/TYORA_Brand_Film_v1.1_Poster.jpg";
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] hover:shadow-md hover:shadow-[#2563eb]/25";

const buildSupportCards = [
  ["Manufacturing review", "Understand feasibility, materials, MOQ and cost before paying for samples.", ClipboardCheck],
  ["Factory path", "When a discussion is ready, TYORA can help identify the right manufacturing route.", SearchCheck],
  ["Project support", "Move from community feedback into samples, QC, production and shipping when needed.", PackageCheck]
] as const;

const buildSteps = [
  ["1", "Initial assessment", "TYORA reviews the idea, rough cost range, MOQ range, materials, process direction and risk points."],
  ["2", "Factory fit", "If the founder wants to continue, TYORA can introduce a suitable factory or manage the project directly."],
  ["3", "Sample and QC", "TYORA supports sample communication, negotiation, quality checks and production follow-up when needed."],
  ["4", "Ship and repeat", "The goal is not one quote. The goal is a repeatable path from idea to physical product."]
] as const;

const faqItems = [
  ["Is TYORA a factory?", "No. TYORA is a product development and manufacturing support partner."],
  ["Can TYORA introduce factories directly?", "Yes. One model is a factory introduction service when the founder wants to manage communication themselves."],
  ["Can TYORA manage the factory process?", "Yes. TYORA can manage communication, samples, quality checks, production, and handoff to your nominated freight forwarder in China."],
  ["Should I start from Build or Community?", "Start from Community if you want an initial assessment first. Use Build when you are ready to move toward a real supplier path."]
] as const;

export default function BuildClient() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  const whatsappUrl = useMemo(() => normalizeWhatsAppUrl(content.whatsappLink), [content.whatsappLink]);
  const moduleVisibility = content.moduleVisibility;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f5f7fb_34%,#f7f5f0_76%,#eef2f8_100%)] pb-28 text-[#101216] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#eef1f4]/80 bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {content.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.logoImage} alt={content.brandName} className="size-8 rounded-lg object-cover" />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#101216] text-white">
                <Sparkles size={16} />
              </span>
            )}
            <span className="leading-tight">
              {content.brandName}
              <span className="block text-[10px] font-medium uppercase tracking-normal text-[#69707d]">Build</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            <Link href="/" className="rounded-full px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f5f6f8]">Community</Link>
            <Link href="/source" className="rounded-full px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f5f6f8]">Source</Link>
            <Link href="/build" className="rounded-full bg-[#2563eb] px-3 py-2 text-sm font-medium text-white">Build</Link>
            <Link href="/#pricing" className="rounded-full px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f5f6f8]">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <CommunityUserMenu loginClassName="inline-flex h-10 items-center rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#101216] shadow-sm transition hover:bg-[#f6f7fb]" />
            </div>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${primaryButton}`}>
              Start Building
            </a>
          </div>
        </div>
      </header>

      <section className="border-b border-[#dfe6ef]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 md:py-10 lg:grid-cols-[1fr_420px] lg:items-center lg:px-8">
          <div>
            <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#315fbd] shadow-sm shadow-[#101216]/5">
              TYORA Build
            </p>
            <h1 className="mt-4 max-w-3xl text-[2.25rem] font-semibold leading-[1.05] tracking-normal sm:text-5xl">
              Turn your product idea into factory-ready production.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#59616e]">
              TYORA helps with supplier fit, samples, QC, shipping and factory communication.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#69707d]">
              {["Factory introduction", "Managed sourcing", "Sample support", "QC and shipping"].map((item) => (
                <span key={item} className="rounded-full border border-[#e3e8ef] bg-white px-3 py-2">{item}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")} className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ${primaryButton}`}>
                Talk to TYORA <ArrowRight size={16} />
              </a>
              <Link href="/ask/new" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-5 text-sm font-semibold">
                Start from a discussion
              </Link>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#59616e]">
              Choose factory introduction or managed sourcing when you are ready to continue.
            </p>
          </div>

          <Card className="overflow-hidden rounded-3xl border-[#e1e7f0] bg-white p-2 shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
            <button type="button" onClick={() => setVideoModalOpen(true)} className="group relative block w-full overflow-hidden rounded-2xl bg-[#101216] text-left" aria-label="Watch TYORA brand film">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandFilmPoster} alt="TYORA brand film poster" className="aspect-[4/5] w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.015] group-hover:opacity-100 sm:aspect-[9/10] lg:aspect-[9/12]" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#101216]/55 via-transparent to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#101216] backdrop-blur">30 second story</span>
              <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#101216] shadow-xl transition group-hover:scale-105">
                <Play size={24} fill="currentColor" />
              </span>
              <span className="absolute bottom-5 left-5 right-5 text-white">
                <span className="block text-sm text-white/75">TYORA Brand Film</span>
                <span className="mt-1 block text-xl font-semibold">A calmer path from idea to production.</span>
              </span>
            </button>
          </Card>
        </div>
      </section>

      {moduleVisibility.build ? (
        <section className="border-b border-[#dfe6ef] bg-white/88">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-sm font-medium text-[#69707d]">When you are ready to build</p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight">The work after an idea gets serious.</h2>
              </div>
              <p className="text-sm leading-6 text-[#59616e]">
                This is the commercial side of TYORA: factory introduction when the founder wants direct contact, or managed sourcing when they want TYORA to handle communication and quality control.
              </p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {buildSupportCards.map(([title, description, Icon]) => (
                <Card key={title} className="rounded-[18px] bg-white p-4 shadow-sm shadow-[#101216]/5 transition duration-[180ms] hover:-translate-y-1 hover:border-[#93c5fd] hover:shadow-[0_18px_44px_rgba(37,99,235,0.12)]">
                  <Icon size={21} className="text-[#101216]" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#59616e]">{description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-[#dfe6ef] bg-[#f6f7fb]/82">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {buildSteps.map(([step, title, body]) => (
              <Card key={title} className="rounded-[18px] border-[#e1e7f0] bg-white p-4 shadow-sm shadow-[#101216]/5">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#101216] text-sm font-semibold text-white">{step}</span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#59616e]">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {moduleVisibility.pricing ? (
        <section id="pricing" className="border-b border-[#dfe6ef] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
            <div className="mb-5">
              <p className="text-sm font-medium text-[#69707d]">Pricing</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">{content.pricingTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[#59616e]">{content.pricingSubtitle}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {content.pricing.filter((plan) => plan.visible).map((plan) => (
                <Card key={plan.name} className="rounded-[18px] bg-white p-5 shadow-sm shadow-[#101216]/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      {plan.subtitle ? <p className="mt-1 text-sm text-[#69707d]">{plan.subtitle}</p> : null}
                    </div>
                    {plan.badge ? <span className="rounded-full bg-[#0f766e] px-2.5 py-1 text-xs font-semibold text-white">{plan.badge}</span> : null}
                  </div>
                  <div className="mt-5 border-y border-[#eef1f4] py-4">
                    {plan.priceLabel ? <p className="text-sm font-medium text-[#69707d]">{plan.priceLabel}</p> : null}
                    <p className="mt-1 text-2xl font-semibold">{plan.price}</p>
                    {plan.priceSuffix ? <p className="mt-2 whitespace-pre-line text-sm font-semibold">{plan.priceSuffix}</p> : null}
                  </div>
                  {plan.description ? <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#59616e]">{plan.description}</p> : null}
                  <ul className="mt-4 space-y-2 text-sm text-[#59616e]">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex gap-2"><Check className="mt-0.5 shrink-0 text-[#0f766e]" size={16} />{feature}</li>
                    ))}
                  </ul>
                  <Link href="/ask/new" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
                    {plan.ctaText} <ArrowRight size={16} />
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {moduleVisibility.faq ? (
        <section className="bg-[#fbfbfc]">
          <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
            <p className="text-sm font-medium text-[#69707d]">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight">Before you move into production</h2>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {faqItems.map(([question, answer]) => (
                <details key={question} className="group rounded-[16px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                    {question}
                    <span className="text-[#8b93a1] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-[#59616e]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {moduleVisibility.finalCta ? (
        <section className="bg-white px-4 py-12 text-center sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-3xl text-[2.15rem] font-semibold leading-tight tracking-normal sm:text-5xl">Ready to build your product?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#59616e]">Start with a discussion, then move into a practical factory path when the idea is ready.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent("whatsapp_click")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#101216] px-6 text-sm font-semibold text-white">
              Talk to TYORA <ArrowRight size={16} />
            </a>
            <Link href="/ask/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-6 text-sm font-semibold">
              Start from a discussion
            </Link>
          </div>
        </section>
      ) : null}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackAnalyticsEvent("whatsapp_click")}
        className="fixed bottom-5 right-5 z-40 hidden min-h-12 items-center justify-center gap-2 rounded-full bg-[#0f766e] px-5 text-sm font-medium text-white shadow-2xl shadow-[#0f766e]/20 transition hover:scale-[1.02] sm:inline-flex"
      >
        <MessageCircle size={18} />
        Talk to TYORA
      </a>

      <AnimatePresence>
        {videoModalOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" aria-label="Close video" className="absolute inset-0" onClick={() => setVideoModalOpen(false)} />
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-black shadow-2xl">
              <button type="button" onClick={() => setVideoModalOpen(false)} className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#101216] shadow-lg" aria-label="Close video">
                <X size={18} />
              </button>
              <video src={brandFilmUrl} poster={brandFilmPoster} controls autoPlay playsInline className="aspect-[9/16] w-full bg-black object-cover" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
