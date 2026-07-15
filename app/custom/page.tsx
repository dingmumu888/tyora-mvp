import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL, WHATSAPP_URL } from "@/lib/whatsapp";

export const metadata = {
  title: "Custom Product Development | TYORA",
  description: "Send a private custom product project to TYORA for manufacturability, MOQ, mold, sample, and budget review."
};

const reviewItems = [
  "Can this product be made?",
  "Confirmed MOQ from factory feedback",
  "Mold requirement and mold cost range",
  "Sample possibility before production",
  "Estimated budget range before design or material changes",
  "Main risks and suggested next step"
] as const;

const pricing = [
  {
    title: "Initial Custom Review",
    price: "Free",
    body: "TYORA reviews whether the idea can be made, MOQ, mold need, mold cost range, sample possibility, and estimated budget range."
  },
  {
    title: "Factory Introduction",
    price: "5% of estimated first order value, minimum $499",
    body: "For customers who want verified factory contact and prefer to work directly with the factory."
  },
  {
    title: "Managed Custom Production",
    price: "15% of first order value, minimum $999",
    body: "TYORA compares factory options, follows samples and molds, manages production, quality checks, and coordination with the customer’s nominated freight forwarder in China."
  },
  {
    title: "Repeat Order Management",
    price: "10% of repeat order value, minimum $399",
    body: "For the same product, same specs, and same factory. TYORA uses the approved reference sample for repeat-order quality checks."
  }
] as const;

const process = [
  ["Private request", "Send AI designs, sketches, reference products, and target quantity."],
  ["Factory feedback", "TYORA checks whether factories can make it and confirms MOQ, molds, samples, and budget range."],
  ["Choose path", "Work directly with the factory or let TYORA manage sampling, production, QC, and freight-forwarder coordination."],
  ["Repeat orders", "For the same product, TYORA keeps the approved reference sample and manages future batches at the reorder rate."]
] as const;

const valueCards = [
  ["Factory comparison", "Compare price, MOQ, mold cost, sample ability, communication, and risk.", Factory],
  ["Small-order reality", "Some factories avoid small or early projects. TYORA helps find practical options.", ClipboardCheck],
  ["Reference sample", "TYORA keeps an approved reference sample for future repeat-order checks.", PackageCheck]
] as const;

export default function CustomPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_42%,#f7f5f0_100%)] pb-16 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e4e8ef]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold">TYORA</Link>
          <nav className="hidden items-center gap-1 text-sm font-semibold text-[#59616e] md:flex">
            <Link href="/ask" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Ideas</Link>
            <Link href="/source" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Source</Link>
            <Link href="/custom" className="rounded-full bg-[#101216] px-3 py-2 text-white">Custom</Link>
          </nav>
          <a href={WHATSAPP_URL} className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white">
            WhatsApp
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-10">
        <div className="rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
            <Sparkles size={14} /> Private Custom Project
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Develop a custom product with TYORA
          </h1>
          <p className="mt-4 text-base leading-7 text-[#59616e]">
            Built for small brands and first-time founders turning AI designs, sketches, or product ideas into real products without getting lost in factory communication.
          </p>
          <div className="mt-5 rounded-3xl border border-[#cfe7df] bg-[#f2fbf7] p-4">
            <p className="text-sm font-semibold text-[#0f766e]">No hidden product markup.</p>
            <p className="mt-2 text-sm leading-6 text-[#315f56]">
              You see the factory quotation and pay a clearly agreed TYORA service fee. Supporting factory quotations and payment records may be provided when applicable, with sensitive information redacted where necessary.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-7">
          <p className="text-sm font-semibold text-[#315fbd]">Initial Custom Review</p>
          <h2 className="mt-2 text-2xl font-semibold">Know what is realistic before you spend money.</h2>
          <div className="mt-4 grid gap-2">
            {reviewItems.map((item) => (
              <p key={item} className="flex items-center gap-2 rounded-2xl bg-[#f8fafc] px-3 py-2 text-sm font-semibold text-[#101216]">
                <CheckCircle2 size={16} className="shrink-0 text-[#0f766e]" />
                {item}
              </p>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-[#fff7ed] p-3 text-sm leading-6 text-[#9a3412]">
            Budget ranges are based on the current design and factory feedback. If design, material, structure, packaging, compliance, or quantity changes, cost may change.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-sm shadow-[#101216]/5 sm:p-7">
          <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-[#315fbd]">Why TYORA helps</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">The right factory choice can save more than the service fee.</h2>
              <p className="mt-3 text-sm leading-6 text-[#59616e]">
                TYORA negotiates competitive factory pricing based on the confirmed product requirements, quantity, and available supplier options.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {valueCards.map(([title, body, Icon]) => (
                <div key={title} className="rounded-3xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
                  <Icon size={18} className="text-[#2563eb]" />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#69707d]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-sm shadow-[#101216]/5 sm:p-7">
          <div className="flex items-center gap-2">
            <ShieldCheck size={19} />
            <h2 className="text-2xl font-semibold">Custom pricing</h2>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {pricing.map((item) => (
              <div key={item.title} className="rounded-3xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
                <p className="text-sm font-semibold text-[#315fbd]">{item.title}</p>
                <p className="mt-2 text-xl font-semibold">{item.price}</p>
                <p className="mt-2 text-sm leading-6 text-[#69707d]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-[#f8fafc] p-3 text-sm leading-6 text-[#59616e]">
            Repeat order pricing applies only when product design, material, size, packaging, supplier, and quality standard remain the same.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-sm shadow-[#101216]/5 sm:p-7">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {process.map(([title, body], index) => (
              <div key={title} className="rounded-3xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-[#101216] text-sm font-semibold text-white">{index + 1}</span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#69707d]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white">
              Start Private Review on WhatsApp <MessageCircle size={15} />
            </a>
            <Link href="/ask/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-5 text-sm font-semibold">
              Post a public idea <ArrowRight size={15} />
            </Link>
            <a href="mailto:support@tyora.io?subject=Private%20Custom%20Review" className="inline-flex h-11 items-center justify-center rounded-full px-3 text-sm font-semibold text-[#59616e] underline decoration-[#c8ced8] underline-offset-4">
              Prefer email? support@tyora.io
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
