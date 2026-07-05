"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, ImagePlus, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { AskIdea, askQuestionOptions, AskQuestion, makeAskId, slugifyIdea } from "@/lib/ask";

const dailyKey = "tyora-ask-review-usage";

type FormState = {
  productName: string;
  category: string;
  country: string;
  description: string;
  imageNames: string[];
  questions: AskQuestion[];
  otherQuestion: string;
  email: string;
  whatsapp: string;
  visibility: "Public" | "Private";
};

const initialForm: FormState = {
  productName: "",
  category: "",
  country: "",
  description: "",
  imageNames: [],
  questions: [],
  otherQuestion: "",
  email: "",
  whatsapp: "",
  visibility: "Public"
};

function todayKey(email: string) {
  return `${new Date().toISOString().slice(0, 10)}:${email.trim().toLowerCase()}`;
}

function localUsage(email: string) {
  if (typeof window === "undefined" || !email) return 0;
  const raw = window.localStorage.getItem(dailyKey);
  const parsed = raw ? JSON.parse(raw) as Record<string, number> : {};
  return parsed[todayKey(email)] || 0;
}

function incrementLocalUsage(email: string) {
  const raw = window.localStorage.getItem(dailyKey);
  const parsed = raw ? JSON.parse(raw) as Record<string, number> : {};
  const key = todayKey(email);
  parsed[key] = (parsed[key] || 0) + 1;
  window.localStorage.setItem(dailyKey, JSON.stringify(parsed));
}

function storeLocalIdea(idea: AskIdea) {
  const raw = window.localStorage.getItem("tyora-ask-ideas");
  const parsed = raw ? JSON.parse(raw) as Record<string, AskIdea> : {};
  parsed[idea.slug] = idea;
  window.localStorage.setItem("tyora-ask-ideas", JSON.stringify(parsed));
}

export default function AskClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [createdIdea, setCreatedIdea] = useState<AskIdea | null>(null);

  const remaining = useMemo(() => Math.max(0, 3 - localUsage(form.email)), [form.email]);

  function toggleQuestion(question: AskQuestion) {
    setForm((current) => ({
      ...current,
      questions: current.questions.includes(question)
        ? current.questions.filter((item) => item !== question)
        : [...current.questions, question]
    }));
  }

  function handleImages(files: FileList | null) {
    const names = Array.from(files || []).slice(0, 5).map((file) => file.name);
    setForm((current) => ({ ...current, imageNames: names }));
    if ((files?.length || 0) > 5) {
      setMessage("Maximum 5 images. Only the first 5 were attached.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setCreatedIdea(null);

    if (localUsage(form.email) >= 3) {
      setMessage("You have used 3 TYORA Expert Reviews today. Community discussion remains unlimited.");
      return;
    }

    setSubmitting(true);
    const id = makeAskId();
    const idea: AskIdea = {
      id,
      slug: slugifyIdea(form.productName, id),
      productName: form.productName.trim(),
      category: form.category.trim(),
      country: form.country.trim(),
      description: form.description.trim(),
      imageNames: form.imageNames,
      questions: form.questions,
      otherQuestion: form.otherQuestion.trim() || undefined,
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim() || undefined,
      visibility: form.visibility,
      status: "Waiting",
      discussion: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idea)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to submit Ask TYORA request.");
      }
      storeLocalIdea(payload.data);
      incrementLocalUsage(form.email);
      setCreatedIdea(payload.data);
      setForm(initialForm);
    } catch (error) {
      storeLocalIdea(idea);
      incrementLocalUsage(form.email);
      setCreatedIdea(idea);
      setMessage(error instanceof Error ? `${error.message} Saved locally for this device.` : "Saved locally for this device.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-[#101216]">
      <section className="mx-auto grid w-full max-w-6xl min-w-0 gap-12 overflow-hidden px-4 py-8 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:py-14">
        <div className="flex min-h-[520px] w-full min-w-0 max-w-full flex-col justify-between">
          <header className="flex min-w-0 items-center justify-between gap-4 overflow-hidden">
            <Link href="/" className="text-sm font-semibold tracking-normal">TYORA</Link>
            <span className="rounded-full border border-[#e8ebef] px-3 py-1 text-xs text-[#69707d]">Ask v1.0</span>
          </header>

          <div className="py-16 lg:py-20">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfe3e8] px-3 py-1 text-sm text-[#505762]">
              <ShieldCheck size={15} /> Free manufacturing review
            </p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl">
              <span className="break-words">Upload your product idea.</span>
            </h1>
            <p className="mt-6 max-w-lg text-xl leading-8 text-[#555d69]">
              Get a FREE manufacturing review within 8 working hours.
            </p>
            <a
              href="#ask-form"
              className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-[#101216] px-6 text-sm font-semibold text-white transition hover:bg-[#2b2f36]"
            >
              Ask TYORA FREE <ArrowRight size={17} />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-[#edf0f3] pt-5 text-sm text-[#69707d] sm:grid-cols-3">
            <span>3 expert reviews per day</span>
            <span>Community discussion unlimited</span>
            <span>No payment required</span>
          </div>
        </div>

        <form id="ask-form" onSubmit={submit} className="w-full min-w-0 max-w-full overflow-hidden rounded-[8px] border border-[#e8ebef] bg-[#fbfbfc] p-4 shadow-[0_24px_80px_rgba(16,18,22,0.06)] sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Ask TYORA FREE</h2>
              <p className="mt-1 text-sm text-[#69707d]">{remaining} expert reviews left today for this email.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#69707d] ring-1 ring-[#e8ebef]">FREE</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Product Name
              <input required value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} className="h-11 w-full min-w-0 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
            </label>
            <label className="grid gap-2 text-sm font-medium">Category
              <input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-11 w-full min-w-0 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
            </label>
            <label className="grid gap-2 text-sm font-medium">Country
              <input required value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="h-11 w-full min-w-0 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
            </label>
            <label className="grid gap-2 text-sm font-medium">Email
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11 w-full min-w-0 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-medium">Description
            <textarea required rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full min-w-0 resize-none rounded-[6px] border border-[#dfe3e8] bg-white p-3 outline-none focus:border-[#101216]" />
          </label>

          <label className="mt-4 flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-[6px] border border-dashed border-[#cfd5dc] bg-white px-4 text-sm text-[#69707d]">
            <ImagePlus size={18} /> Upload Images <span className="text-[#9aa1ab]">Maximum 5</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => handleImages(event.target.files)} />
          </label>
          {form.imageNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#69707d]">
              {form.imageNames.map((name) => <span key={name} className="rounded-full bg-white px-3 py-1 ring-1 ring-[#e8ebef]">{name}</span>)}
            </div>
          )}

          <div className="mt-5">
            <p className="text-sm font-medium">Questions</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {askQuestionOptions.map((question) => (
                <label key={question} className="flex items-center gap-3 rounded-[6px] border border-[#e8ebef] bg-white px-3 py-3 text-sm">
                  <input type="checkbox" checked={form.questions.includes(question)} onChange={() => toggleQuestion(question)} className="size-4 accent-[#101216]" />
                  {question}
                </label>
              ))}
            </div>
          </div>

          {form.questions.includes("Other") && (
            <input value={form.otherQuestion} onChange={(event) => setForm({ ...form, otherQuestion: event.target.value })} placeholder="Other question" className="mt-3 h-11 w-full rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">WhatsApp
              <input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} className="h-11 w-full min-w-0 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
            </label>
            <label className="grid gap-2 text-sm font-medium">Public or Private
              <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as "Public" | "Private" })} className="h-11 w-full min-w-0 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]">
                <option>Public</option>
                <option>Private</option>
              </select>
            </label>
          </div>

          <button disabled={submitting} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white transition hover:bg-[#2b2f36] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />} Submit FREE
          </button>

          {message && <p className="mt-4 text-sm text-[#8a5a00]">{message}</p>}
          {createdIdea && (
            <div className="mt-4 rounded-[6px] border border-[#d9eadf] bg-white p-4 text-sm">
              <p className="font-semibold">Idea submitted: {createdIdea.id}</p>
              <Link className="mt-2 inline-flex items-center gap-2 text-[#101216] underline" href={`/ask/${createdIdea.slug}`}>
                Open idea page <MessageCircle size={15} />
              </Link>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
