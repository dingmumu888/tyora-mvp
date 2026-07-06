"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react";
import { communityQuestions, CommunityQuestion } from "@/lib/community";
import EmailLogin from "@/components/email-login";
import { cn } from "@/lib/utils";

type SessionUser = { id: string; name: string; email: string; username: string };
type Step = 0 | 1 | 2 | 3;
type ImagePreview = { name: string; url: string };

const steps = ["Idea", "Images", "Details", "Publish"] as const;
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition duration-[180ms] hover:-translate-y-0.5 hover:bg-[#1d4ed8] hover:shadow-md hover:shadow-[#2563eb]/25";

export default function NewIdeaClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [oneSentence, setOneSentence] = useState("");
  const [message, setMessage] = useState("");
  const [loginPrompt, setLoginPrompt] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const imagePreviewsRef = useRef<ImagePreview[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    country: "",
    imageUrls: [] as string[],
    questions: [] as CommunityQuestion[],
    otherQuestion: "",
    visibility: "Public"
  });

  useEffect(() => {
    function refreshSession() {
      fetch("/api/community/session")
        .then((response) => response.json())
        .then((data) => setUser(data.user || null))
        .catch(() => setUser(null))
        .finally(() => setCheckingSession(false));
    }

    refreshSession();
    window.addEventListener("tyora:community-login", refreshSession);
    return () => window.removeEventListener("tyora:community-login", refreshSession);
  }, []);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => imagePreviewsRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);

  const usedText = useMemo(() => "Today's FREE Expert Reviews: 0 / 3 Used", []);
  const inputClass = "h-12 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm outline-none transition duration-[180ms] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
  const panelClass = "rounded-[22px] border border-[#e1e7f0] bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)]";

  function toggleQuestion(question: CommunityQuestion) {
    setForm((current) => ({
      ...current,
      questions: current.questions.includes(question)
        ? current.questions.filter((item) => item !== question)
        : [...current.questions, question]
    }));
  }

  function setImages(files: FileList | File[]) {
    const selected = Array.from(files).slice(0, 5 - imagePreviews.length);
    if (selected.length === 0) return;
    const nextPreviews = selected.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setImagePreviews((current) => [...current, ...nextPreviews].slice(0, 5));
    setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, ...selected.map((file) => file.name)].slice(0, 5) }));
    if (Array.from(files).length + imagePreviews.length > 5) {
      setMessage("Maximum 5 images. Only the first 5 were attached.");
    }
  }

  function removeImage(name: string) {
    setImagePreviews((current) => {
      const image = current.find((item) => item.name === name);
      if (image) URL.revokeObjectURL(image.url);
      return current.filter((item) => item.name !== name);
    });
    setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((item) => item !== name) }));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setImages(event.dataTransfer.files);
  }

  function validateStep(target = step) {
    setMessage("");
    if (target === 0) {
      if (!form.title.trim()) return setMessage("Please add a product name."), false;
      if (!oneSentence.trim()) return setMessage("Please describe your idea in one sentence."), false;
    }
    if (target === 2) {
      if (!form.description.trim()) return setMessage("Please add a short description for TYORA."), false;
      if (!form.category.trim()) return setMessage("Please choose a category."), false;
      if (!form.country.trim()) return setMessage("Please add your country."), false;
      if (form.questions.length === 0) return setMessage("Please choose at least one question for TYORA."), false;
    }
    return true;
  }

  function continueStep() {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, 3) as Step);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    if (!user) {
      setMessage("Log in with email to publish your discussion. Your draft will stay here.");
      setLoginPrompt((current) => current + 1);
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/ideas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: form.description.trim() || oneSentence.trim()
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to submit idea.");
      setMessage("Your idea is live.");
      window.setTimeout(() => {
        window.location.href = `/ask/${payload.data.slug}`;
      }, 650);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit idea.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]"><Loader2 className="animate-spin text-[#2563eb]" /></div>;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_34%,#f7f5f0_100%)] pb-12 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e8ebef]/90 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1560px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/ask" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#101216] text-white"><Sparkles size={15} /></span>
            TYORA Community
          </Link>
          <div className="flex items-center gap-2">
            {!user ? (
              <EmailLogin
                openSignal={loginPrompt}
                onSuccess={() => setMessage("Logged in successfully. Your draft is still here.")}
                className="inline-flex h-10 shrink-0 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-sm font-semibold text-[#59616e] transition duration-[180ms] hover:bg-[#f6f7fb] sm:px-4"
              >
                Email Login
              </EmailLogin>
            ) : <span className="hidden rounded-full bg-[#ecfdf5] px-3 py-2 text-sm font-semibold text-[#0f766e] sm:inline-flex">{user.name}</span>}
            <Link href="/ask" className="inline-flex h-10 shrink-0 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-sm font-semibold text-[#59616e] sm:px-4">Browse Ideas</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1560px] gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[250px_minmax(0,1fr)_330px] lg:px-6">
        <aside className="hidden self-start rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-[0_14px_44px_rgba(15,23,42,0.08)] lg:sticky lg:top-20 lg:block">
          <p className="text-xs font-semibold uppercase text-[#8b93a1]">Create idea</p>
          <h1 className="mt-2 text-xl font-semibold">Start a Discussion</h1>
          <p className="mt-2 text-sm leading-6 text-[#69707d]">Share the product clearly. TYORA and founders can help shape the manufacturing path.</p>
          <div className="mt-5 grid gap-2">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => setStep(index as Step)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition duration-[180ms]",
                  step === index ? "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20" : "bg-[#f7f8fa] text-[#59616e] hover:bg-[#eef3ff]"
                )}
              >
                <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", step === index ? "bg-white/18 text-white" : "bg-white text-[#69707d]")}>
                  {index + 1}
                </span>
                {item}
              </button>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-[#e9f7f3] p-3 text-sm font-semibold text-[#0f766e]">FREE expert review within 8 working hours.</p>
        </aside>

        <form onSubmit={submit} className={`${panelClass} min-w-0 p-4 sm:p-6 lg:p-7`}>
          <div className="mb-5 lg:hidden">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#69707d]">
              {steps.map((item, index) => (
                <button key={item} type="button" onClick={() => setStep(index as Step)} className={cn("rounded-full px-3 py-2", step === index ? "bg-[#2563eb] text-white" : "bg-white ring-1 ring-[#e4e8ef]")}>{item}</button>
              ))}
            </div>
          </div>

          <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]"><Sparkles size={14} /> {usedText}</p>

          {step === 0 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">What are you building?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">A rough product thought is enough. Start with the simplest version of the idea.</p>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">Product name
                  <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Magnetic phone stand" className={inputClass} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">One-sentence idea
                  <input value={oneSentence} onChange={(event) => setOneSentence(event.target.value)} placeholder="Magnetic phone stand for desk and travel" className={inputClass} />
                </label>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Show us your idea</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">Sketches, screenshots, reference products, or AI images are all okay.</p>
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
                className="mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[#b8c9f5] bg-[#f8fbff] px-4 text-center transition duration-[180ms] hover:border-[#93c5fd] hover:bg-[#eef6ff]"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm"><ImagePlus size={22} /></span>
                <span className="text-sm font-semibold">Upload or drag images here</span>
                <span className="text-xs text-[#69707d]">Maximum 5 images</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setImages(event.target.files || [])} />
              </label>
              {imagePreviews.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {imagePreviews.map((image) => (
                    <div key={image.name} className="group relative overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.name} className="aspect-[4/3] w-full object-cover" />
                      <button type="button" onClick={() => removeImage(image.name)} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/92 text-[#59616e] shadow-sm transition hover:bg-[#fff1f2] hover:text-[#be123c]" aria-label={`Remove ${image.name}`}>
                        <Trash2 size={15} />
                      </button>
                      <p className="truncate px-3 py-2 text-xs font-medium text-[#69707d]">{image.name}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Help TYORA understand your idea</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">Add the manufacturing context TYORA needs to review feasibility, cost, materials and factory fit.</p>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">Description
                  <textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What does it do, who is it for, and what should TYORA pay attention to?" className="resize-none rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm outline-none transition duration-[180ms] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">Category
                    <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Phone accessories" className={inputClass} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">Country
                    <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} placeholder="United States" className={inputClass} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold">Question type</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {communityQuestions.map((question) => (
                      <label key={question} className={cn("flex cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-3 text-sm transition duration-[180ms]", form.questions.includes(question) ? "border-[#bfdbfe] bg-[#f2f7ff] text-[#1d4ed8]" : "border-[#e8ebef] bg-white text-[#59616e] hover:border-[#cbd5e1]")}>
                        <input type="checkbox" checked={form.questions.includes(question)} onChange={() => toggleQuestion(question)} className="size-4 accent-[#2563eb]" />
                        {question}
                      </label>
                    ))}
                  </div>
                </div>
                {form.questions.includes("Other") ? (
                  <input value={form.otherQuestion} onChange={(event) => setForm({ ...form, otherQuestion: event.target.value })} placeholder="What else should TYORA review?" className={inputClass} />
                ) : null}
                <label className="grid gap-2 text-sm font-semibold">Public or Private
                  <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })} className={inputClass}>
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Ready to start the discussion?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">Review the public preview before publishing. You can continue the project later when ready.</p>
              <div className="mt-6 rounded-[20px] border border-[#e4e8ef] bg-[#fbfcff] p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#69707d]">
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-[#e8ebef]">{form.category || "Category"}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-[#e8ebef]">{form.visibility}</span>
                  <span className="rounded-full bg-[#e9f7f3] px-2.5 py-1 text-[#0f766e]">FREE review</span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold">{form.title || "Product name"}</h3>
                <p className="mt-2 text-sm leading-6 text-[#59616e]">{form.description || oneSentence || "Your idea summary will appear here."}</p>
                {imagePreviews.length > 0 ? (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {imagePreviews.map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={image.name} src={image.url} alt={image.name} className="h-24 w-28 shrink-0 rounded-2xl object-cover" />
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {form.questions.length > 0 ? form.questions.map((question) => (
                    <span key={question} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#59616e] ring-1 ring-[#e8ebef]">{question}</span>
                  )) : <span className="text-sm text-[#8b93a1]">No question selected yet.</span>}
                </div>
              </div>
            </section>
          ) : null}

          {message ? (
            <p className={cn("mt-5 rounded-2xl px-4 py-3 text-sm leading-6", message === "Your idea is live." || message.startsWith("Logged in") ? "bg-[#ecfdf5] text-[#0f766e]" : "bg-[#fff7ed] text-[#9a3412]")}>
              {message}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0) as Step)} className="h-11 rounded-full border border-[#dfe3e8] bg-white px-5 text-sm font-semibold text-[#59616e] transition duration-[180ms] hover:bg-[#f6f7fb]" disabled={step === 0}>
              Back
            </button>
            {step < 3 ? (
              <button type="button" onClick={continueStep} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold ${primaryButton}`}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button disabled={submitting} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60 ${primaryButton}`}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {submitting ? "Publishing..." : "Start Discussion"}
              </button>
            )}
          </div>
        </form>

        <aside className="hidden space-y-3 self-start xl:sticky xl:top-20 xl:block">
          <section className="rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-[0_14px_44px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold">What happens next?</h2>
            <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
              {[
                "Your idea becomes public.",
                "Founders can discuss it.",
                "TYORA gives a manufacturing review.",
                "You can continue the project when ready."
              ].map((item, index) => (
                <p key={item} className="flex gap-3 rounded-2xl bg-[#f7f8fa] p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#2563eb] ring-1 ring-[#e4e8ef]">{index + 1}</span>
                  {item}
                </p>
              ))}
            </div>
          </section>
          <section className="rounded-[22px] border border-[#dbeafe] bg-[#eff6ff] p-4 shadow-sm shadow-[#2563eb]/8">
            <h2 className="text-lg font-semibold text-[#1d4ed8]">FREE expert review within 8 working hours.</h2>
            <p className="mt-3 text-sm leading-6 text-[#315fbd]">Community discussion is unlimited. TYORA expert reviews are limited to 3 per account per day.</p>
          </section>
          <section className="rounded-[22px] border border-[#e4e8ef] bg-white p-4">
            <h2 className="text-lg font-semibold">Helpful tips</h2>
            <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
              {["Use plain language.", "Add reference images if you have them.", "Ask about cost, material, MOQ or factory fit."].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-2xl bg-[#f7f8fa] p-3"><CheckCircle2 size={15} className="text-[#2563eb]" /> {item}</span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
