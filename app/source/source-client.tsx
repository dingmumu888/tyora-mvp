"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Factory, ImagePlus, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import { sourceNeedTypes, SourceNeedType } from "@/lib/source";
import { defaultContent, loadContent, SiteContent } from "@/lib/storage";

type FormState = {
  productName: string;
  description: string;
  productLink: string;
  material: string;
  quantity: string;
  targetPrice: string;
  destinationCountry: string;
  email: string;
  whatsapp: string;
  needTypes: SourceNeedType[];
  imageUrl: string;
};

const emptyForm: FormState = {
  productName: "",
  description: "",
  productLink: "",
  material: "",
  quantity: "",
  targetPrice: "",
  destinationCountry: "",
  email: "",
  whatsapp: "",
  needTypes: ["Find supplier"],
  imageUrl: ""
};

const inputClass = "min-h-11 w-full rounded-2xl border border-[#dfe6ef] bg-white px-3 text-sm font-medium text-[#101216] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
const textareaClass = `${inputClass} min-h-28 resize-none py-3 leading-6`;

const supportIcons = [
  Factory,
  ClipboardCheck,
  Truck,
  ShieldCheck
] as const;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

export default function SourceClient() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [sourceRequestCount, setSourceRequestCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const sourceCopy = content.sourcePage;

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  useEffect(() => {
    fetch("/api/source/stats", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setSourceRequestCount(Number(payload.data?.total || 0)))
      .catch(() => setSourceRequestCount(0));
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleNeed(type: SourceNeedType) {
    setForm((current) => {
      const exists = current.needTypes.includes(type);
      const next = exists ? current.needTypes.filter((item) => item !== type) : [...current.needTypes, type];
      return { ...current, needTypes: next };
    });
  }

  async function handleImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Upload a product image file.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    update("imageUrl", dataUrl);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSubmittedId("");
    try {
      const response = await fetch("/api/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message || "Unable to submit source request.");
      setSubmittedId(payload.data.id);
      setForm(emptyForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit source request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_42%,#f7f5f0_100%)] pb-20 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e4e8ef]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold">TYORA</Link>
          <nav className="hidden items-center gap-1 text-sm font-semibold text-[#59616e] md:flex">
            <Link href="/ask" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Discover Ideas</Link>
            <Link href="/source" className="rounded-full bg-[#101216] px-3 py-2 text-white">Source Products</Link>
            <Link href="/ask/new" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Ask TYORA</Link>
          </nav>
          <Link href="/ask/new" className="rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold">Start a Discussion</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="self-start rounded-[28px] border border-[#dfe6ef] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] lg:sticky lg:top-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
            <PackageSearch size={14} /> {sourceCopy.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">{sourceCopy.title}</h1>
          <p className="mt-4 text-base leading-7 text-[#59616e]">
            {sourceCopy.subtitle}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-[#dfe6ef] bg-[#f8fafc] p-3">
              <p className="text-2xl font-semibold">{sourceRequestCount}</p>
              <p className="mt-1 text-xs font-semibold text-[#69707d]">{sourceCopy.statLabel}</p>
            </div>
            <div className="rounded-2xl border border-[#dfe6ef] bg-[#f8fafc] p-3">
              <p className="text-2xl font-semibold">{sourceCopy.secondaryStatValue}</p>
              <p className="mt-1 text-xs font-semibold text-[#69707d]">{sourceCopy.secondaryStatLabel}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {sourceCopy.supportCards.map(({ title, description }, index) => {
              const Icon = supportIcons[index] || Factory;
              return (
              <div key={title} className="flex gap-3 rounded-2xl border border-[#e7edf5] bg-[#fbfcfe] p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#101216] text-white"><Icon size={17} /></span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-sm leading-5 text-[#69707d]">{description}</span>
                </span>
              </div>
            );})}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-[28px] border border-[#dfe6ef] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-6">
          <div className="grid gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-[#cfd8e6] bg-[#f8fafc] text-left transition hover:border-[#93c5fd] hover:bg-[#f2f7ff]">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="Product reference" className="absolute inset-0 size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-3 text-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm"><ImagePlus size={24} /></span>
                  <span className="font-semibold">Upload product image</span>
                  <span className="max-w-sm text-sm text-[#69707d]">Reference photos, screenshots, catalog images or supplier images are acceptable.</span>
                  <span className="text-xs font-semibold text-[#2563eb]">Required</span>
                </span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleImage(event.target.files?.[0])} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Product name">
                <input value={form.productName} onChange={(event) => update("productName", event.target.value)} className={inputClass} placeholder="Portable blender" />
              </Field>
              <Field label="Product link optional">
                <input value={form.productLink} onChange={(event) => update("productLink", event.target.value)} className={inputClass} placeholder="https://..." />
              </Field>
            </div>

            <Field label="Product description">
              <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className={textareaClass} placeholder="Tell us what this product is and what you want to improve or source." />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Material if known">
                <input value={form.material} onChange={(event) => update("material", event.target.value)} className={inputClass} placeholder="Plastic, stainless steel, silicone..." />
              </Field>
              <Field label="Quantity needed">
                <input value={form.quantity} onChange={(event) => update("quantity", event.target.value)} className={inputClass} placeholder="500 pcs, 1,000 pcs..." />
              </Field>
              <Field label="Target price optional">
                <input value={form.targetPrice} onChange={(event) => update("targetPrice", event.target.value)} className={inputClass} placeholder="$2.50 / unit" />
              </Field>
              <Field label="Destination country">
                <input value={form.destinationCountry} onChange={(event) => update("destinationCountry", event.target.value)} className={inputClass} placeholder="United States" />
              </Field>
              <Field label="Email">
                <input value={form.email} onChange={(event) => update("email", event.target.value)} className={inputClass} placeholder="you@example.com" />
              </Field>
              <Field label="WhatsApp">
                <input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} className={inputClass} placeholder="+1..." />
              </Field>
            </div>

            <div>
              <p className="text-sm font-semibold">What do you need?</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {sourceNeedTypes.map((type) => (
                  <button key={type} type="button" onClick={() => toggleNeed(type)} className={`rounded-2xl border p-3 text-left text-sm font-semibold transition ${form.needTypes.includes(type) ? "border-[#2563eb] bg-[#f2f7ff] text-[#1d4ed8]" : "border-[#e1e6ee] bg-white text-[#59616e]"}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {message ? <p className="rounded-2xl bg-[#fff1f2] p-3 text-sm font-semibold text-[#be123c]">{message}</p> : null}
            {submittedId ? (
              <div className="rounded-2xl bg-[#ecfdf5] p-4 text-sm text-[#0f766e]">
                <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} /> {sourceCopy.successTitle}</p>
                <p className="mt-1">{sourceCopy.successBody} Request ID: {submittedId}</p>
              </div>
            ) : null}

            <button disabled={submitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] disabled:opacity-60">
              {submitting ? "Submitting..." : sourceCopy.ctaText} <ArrowRight size={16} />
            </button>
            <p className="text-xs leading-5 text-[#69707d]">{sourceCopy.disclaimer}</p>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[#101216]">
      {label}
      {children}
    </label>
  );
}
