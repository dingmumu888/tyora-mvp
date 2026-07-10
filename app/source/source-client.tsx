"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Factory, ImagePlus, PackageSearch, ShieldCheck } from "lucide-react";
import { sourceNeedTypes, SourceNeedType } from "@/lib/source";
import { defaultContent, loadContent, SiteContent } from "@/lib/storage";

type FormState = {
  category: string;
  productName: string;
  description: string;
  productLink: string;
  material: string;
  quantity: string;
  targetPrice: string;
  destinationCountry: string;
  contact: string;
  needTypes: SourceNeedType[];
  imageUrl: string;
};

const emptyForm: FormState = {
  category: "",
  productName: "",
  description: "",
  productLink: "",
  material: "",
  quantity: "",
  targetPrice: "",
  destinationCountry: "",
  contact: "",
  needTypes: ["Find supplier"],
  imageUrl: ""
};

const inputClass = "min-h-11 w-full rounded-2xl border border-[#dfe6ef] bg-white px-3 text-sm font-medium text-[#101216] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
const textareaClass = `${inputClass} min-h-28 resize-none py-3 leading-6`;

const ctaText = "Get Free Product Match";

const pricingOptions = [
  {
    title: "Free Product Match & Quote",
    price: "Free",
    description: "We check product match, supplier options, and estimated China factory pricing."
  },
  {
    title: "Supplier Introduction",
    price: "3%-5% of estimated order value, minimum $199",
    mobilePrice: "3%-5%",
    mobileMinimum: "Minimum $199",
    mobileDescription: "Based on estimated order value.",
    description: "Get verified supplier contact and deal directly with the factory.",
    processHref: "/source/how-it-works#supplier-introduction"
  },
  {
    title: "Managed Sourcing",
    price: "10%-15% of order value, minimum $499",
    mobilePrice: "10%-15%",
    mobileMinimum: "Minimum $499",
    mobileDescription: "For negotiation, purchasing, inspection, and shipping coordination.",
    description: "TYORA helps negotiate, purchase, inspect, and coordinate shipping.",
    processHref: "/source/how-it-works#managed-sourcing"
  }
];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function mapContactToPayload(contact: string) {
  const trimmed = contact.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed, whatsapp: "" };
  }
  return { email: "", whatsapp: trimmed };
}

export default function SourceClient() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [trustToast, setTrustToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const sourceCopy = content.sourcePage;

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  useEffect(() => {
    if (!sourceCopy.trustToastEnabled || sourceCopy.trustToastMessages.length === 0) return;
    let active = true;
    let timer: number;
    const min = Math.max(5, sourceCopy.trustToastMinSeconds);
    const max = Math.max(min, sourceCopy.trustToastMaxSeconds);
    const schedule = () => {
      const delay = (min + Math.random() * (max - min)) * 1000;
      timer = window.setTimeout(() => {
        if (!active) return;
        const messageIndex = Math.floor(Math.random() * sourceCopy.trustToastMessages.length);
        setTrustToast(sourceCopy.trustToastMessages[messageIndex]);
        window.setTimeout(() => active && setTrustToast(""), 5200);
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [sourceCopy.trustToastEnabled, sourceCopy.trustToastMaxSeconds, sourceCopy.trustToastMessages, sourceCopy.trustToastMinSeconds]);

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

  function buildSourcePayload() {
    const contactPayload = mapContactToPayload(form.contact);
    const { contact: _contact, ...sourceFields } = form;
    const descriptionParts = [
      `Category: ${form.category}`,
      `Description: ${form.description || "Not provided"}`,
      form.productName ? `Product name: ${form.productName}` : "",
      form.productLink ? `Product link: ${form.productLink}` : "",
      form.material ? `Material: ${form.material}` : "",
      form.targetPrice ? `Target price: ${form.targetPrice}` : "",
      form.destinationCountry ? `Destination country: ${form.destinationCountry}` : "",
      form.needTypes.length > 0 ? `Other details: ${form.needTypes.join(", ")}` : ""
    ].filter(Boolean).join("\n");

    return {
      ...sourceFields,
      ...contactPayload,
      productName: form.productName || `${form.category} product reference`,
      description: descriptionParts,
      destinationCountry: form.destinationCountry || "Not specified",
      needTypes: form.needTypes.length > 0 ? form.needTypes : ["Find supplier"]
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setSubmittedId("");
    try {
      if (!form.imageUrl) throw new Error("Please upload a product image.");
      if (!form.category.trim()) throw new Error("Please add a category.");
      if (!form.quantity.trim()) throw new Error("Please add the quantity needed.");
      if (!form.contact.trim()) throw new Error("Please add Email or WhatsApp.");
      const response = await fetch("/api/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildSourcePayload())
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
          <Link href="#source-form" className="rounded-full border border-[#dfe3e8] px-3 py-2 text-sm font-semibold sm:px-4">
            <span className="sm:hidden">Free Match</span>
            <span className="hidden sm:inline">{ctaText}</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-3 sm:gap-5 sm:px-6 sm:py-5 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
        <div className="self-start rounded-[28px] border border-[#dfe6ef] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-5 lg:sticky lg:top-24 lg:p-6">
          <p className="hidden items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd] sm:inline-flex">
            <PackageSearch size={14} /> {sourceCopy.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:mt-4 sm:text-5xl">
            <span className="hidden sm:inline">Found a product?<br />Let TYORA find China supplier options.</span>
            <span className="sm:hidden">Found a product?<br />Get a free China supplier quote.</span>
          </h1>
          <p className="mt-4 hidden text-base leading-7 text-[#59616e] sm:block">
            Free product match and factory-price quote first. Pay only if you want supplier contact or managed sourcing.
          </p>
          <p className="mt-3 text-base leading-7 text-[#59616e] sm:hidden">
            Upload a product photo, category, and quantity. We’ll check product match and factory pricing for free.
          </p>
          <p className="mt-2 rounded-2xl bg-[#f2fbf7] px-4 py-2.5 text-sm font-semibold text-[#0f766e] sm:hidden">
            Factory price. No hidden markup. Service fee only if you continue.
          </p>
          <div className="mt-4 hidden rounded-3xl border border-[#cfe7df] bg-[#f2fbf7] p-4 sm:block">
            <p className="text-sm font-semibold text-[#0f766e]">No hidden product markup. Service fee only.</p>
            <h2 className="mt-1 text-xl font-semibold leading-tight">Send a product photo. Get a free factory-price quote.</h2>
            <p className="mt-2 text-sm leading-6 text-[#315f56]">
              We check supplier options, factory pricing, samples, and sourcing support after you submit the product.
            </p>
          </div>
        </div>

        <form id="source-form" onSubmit={submit} className="scroll-mt-24 rounded-[28px] border border-[#dfe6ef] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-6">
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
              <Field label="Category">
                <input value={form.category} onChange={(event) => update("category", event.target.value)} className={inputClass} placeholder="Kitchen, phone accessories, pet..." />
              </Field>
              <Field label="Quantity needed">
                <input value={form.quantity} onChange={(event) => update("quantity", event.target.value)} className={inputClass} placeholder="500 pcs, 1,000 pcs..." />
              </Field>
            </div>

            <Field label="Email or WhatsApp">
              <input value={form.contact} onChange={(event) => update("contact", event.target.value)} className={inputClass} placeholder="you@example.com or +1..." />
            </Field>

            <details className="rounded-3xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
              <summary className="cursor-pointer text-sm font-semibold">More details (optional)</summary>
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Product name">
                    <input value={form.productName} onChange={(event) => update("productName", event.target.value)} className={inputClass} placeholder="Portable blender" />
                  </Field>
                  <Field label="Product link">
                    <input value={form.productLink} onChange={(event) => update("productLink", event.target.value)} className={inputClass} placeholder="https://..." />
                  </Field>
                </div>
                <Field label="Product description">
                  <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className={textareaClass} placeholder="Tell us what this product is and what you want to improve or source." />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Material">
                    <input value={form.material} onChange={(event) => update("material", event.target.value)} className={inputClass} placeholder="Plastic, stainless steel, silicone..." />
                  </Field>
                  <Field label="Target price">
                    <input value={form.targetPrice} onChange={(event) => update("targetPrice", event.target.value)} className={inputClass} placeholder="$2.50 / unit" />
                  </Field>
                  <Field label="Destination country">
                    <input value={form.destinationCountry} onChange={(event) => update("destinationCountry", event.target.value)} className={inputClass} placeholder="United States" />
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
              </div>
            </details>

            {message ? <p className="rounded-2xl bg-[#fff1f2] p-3 text-sm font-semibold text-[#be123c]">{message}</p> : null}
            {submittedId ? (
              <div className="rounded-2xl bg-[#ecfdf5] p-4 text-sm text-[#0f766e]">
                <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} /> {sourceCopy.successTitle}</p>
                <p className="mt-1">{sourceCopy.successBody} Request ID: {submittedId}</p>
              </div>
            ) : null}

            <button disabled={submitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] disabled:opacity-60">
              {submitting ? "Submitting..." : ctaText} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#cfe7df] bg-white p-5 shadow-sm shadow-[#101216]/5">
          <p className="text-sm font-semibold text-[#0f766e]">Factory price transparency</p>
          <h2 className="mt-1 text-2xl font-semibold">We do not mark up product costs.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59616e]">
            You pay the factory price plus a clear service fee only if you continue after the free quote.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-sm shadow-[#101216]/5">
          <div className="flex items-center gap-2">
            <Factory size={18} />
            <h2 className="text-2xl font-semibold">How TYORA charges if you continue</h2>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {pricingOptions.map((option) => (
              <div key={option.title} className="rounded-3xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
                <p className="text-sm font-semibold text-[#315fbd]">{option.title}</p>
                {option.mobilePrice ? (
                  <>
                    <p className="mt-2 hidden text-xl font-semibold sm:block">{option.price}</p>
                    <div className="mt-2 sm:hidden">
                      <p className="text-2xl font-semibold">{option.mobilePrice}</p>
                      <p className="mt-1 text-sm font-semibold text-[#101216]">{option.mobileMinimum}</p>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-xl font-semibold">{option.price}</p>
                )}
                <p className="mt-2 text-sm leading-6 text-[#69707d]">
                  <span className="sm:hidden">{option.mobileDescription || option.description}</span>
                  <span className="hidden sm:inline">{option.description}</span>
                </p>
                {option.processHref ? (
                  <Link href={option.processHref} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
                    View full process <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-[#f8fafc] p-3 text-sm leading-6 text-[#59616e]">
            We can help with samples. You only pay sample cost and shipping.
          </p>
          <p className="mt-2 text-xs leading-5 text-[#69707d]">Final price depends on supplier confirmation.</p>
        </div>

        <div className="rounded-[28px] border border-[#e7edf5] bg-white p-5 shadow-sm shadow-[#101216]/5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} />
            <h2 className="text-2xl font-semibold">Service protection</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#59616e]">
            Supplier Introduction fees are non-refundable after supplier contact is released, but we help find one free replacement if the supplier becomes unavailable shortly after release.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#59616e]">
            Managed Sourcing refunds depend on order status and costs already paid to suppliers or third parties.
          </p>
        </div>
      </section>
      {trustToast ? (
        <div className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[9985] mx-auto max-w-sm rounded-2xl border border-[#dfe6ef] bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl md:inset-x-auto md:bottom-5 md:right-5">
          <p className="flex items-start gap-2 text-sm font-semibold text-[#101216]">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-[#14b8a6] shadow-[0_0_0_4px_rgba(20,184,166,0.14)]" />
            <span>{trustToast}</span>
          </p>
          <p className="mt-1 pl-4 text-xs text-[#69707d]">Supplier check activity</p>
        </div>
      ) : null}
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
