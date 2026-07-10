"use client";

import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Globe2,
  ImagePlus,
  Info,
  LockKeyhole,
  Loader2,
  MessageCircle,
  PackageCheck,
  SearchCheck,
  Sparkles,
  Trash2,
  Trophy,
  Upload
} from "lucide-react";
import { communityQuestions, CommunityQuestion } from "@/lib/community";
import CommunityUserMenu from "@/components/community-user-menu";
import { cn } from "@/lib/utils";

type SessionUser = { id: string; name: string; email: string; username: string; avatar?: string; bio?: string; profileCompleted?: boolean };
type Step = 0 | 1 | 2 | 3;
type ImagePreview = { name: string; url: string };

const steps = ["Your Idea", "Show It", "Help TYORA Understand", "Go Live"] as const;
const mobileSteps = ["Idea", "Show", "Understand", "Live"] as const;
const defaultQuestions: CommunityQuestion[] = ["Can this be manufactured?", "Estimated Cost?", "Material Suggestion?"];
const visibilityOptions = [
  {
    value: "Public",
    title: "Community Discussion",
    badge: "Most Popular",
    badgeIcon: Trophy,
    icon: Globe2,
    intro: "Most founders choose this option.",
    description: "Share your idea with the TYORA Community.",
    recommendation: "Recommended if you want more feedback before building.",
    benefits: [
      "More community feedback",
      "More manufacturing suggestions",
      "More discussion",
      "More visibility"
    ]
  },
  {
    value: "Private",
    title: "Private Custom Project",
    badge: "Private Project",
    badgeIcon: undefined,
    icon: LockKeyhole,
    intro: "Only you and TYORA can view this discussion.",
    description: "Only you and TYORA can view this custom project.",
    recommendation: "Maximum privacy.",
    benefits: [
      "Maximum privacy",
      "Only TYORA can review",
      "Continue privately on WhatsApp"
    ]
  }
] as const;
const nextSteps = [
  ["Founders start discussing your idea.", MessageCircle],
  ["TYORA reviews manufacturability.", SearchCheck],
  ["You decide whether to build.", PackageCheck]
] as const;
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition duration-[180ms] hover:-translate-y-0.5 hover:bg-[#1d4ed8] hover:shadow-md hover:shadow-[#2563eb]/25";
const PRODUCT_IMAGE_SIZE = 800;
const PRODUCT_IMAGE_QUALITY = 0.82;
const quickEmojis = ["💡", "🔥", "👍", "❤️", "👀", "🙌"];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image format is not supported by your browser."));
    image.src = src;
  });
}

async function normalizeProductImage(file: File) {
  const source = await fileToDataUrl(file);
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare image.");

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);

  canvas.width = PRODUCT_IMAGE_SIZE;
  canvas.height = PRODUCT_IMAGE_SIZE;
  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE);

  return canvas.toDataURL("image/jpeg", PRODUCT_IMAGE_QUALITY);
}

export default function NewIdeaClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [oneSentence, setOneSentence] = useState("");
  const [message, setMessage] = useState("");
  const [loginPrompt, setLoginPrompt] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [published, setPublished] = useState(false);
  const [visibilityLearnOpen, setVisibilityLearnOpen] = useState(false);
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

  const usedText = useMemo(() => "Every submitted idea gets an initial TYORA manufacturing review.", []);
  const inputClass = "h-12 rounded-[16px] border border-transparent bg-[#f8fafc] px-4 text-sm outline-none transition duration-[180ms] hover:bg-white hover:ring-1 hover:ring-[#e4e8ef] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10";
  const panelClass = "rounded-[26px] border border-[#e1e7f0] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]";

  function toggleQuestion(question: CommunityQuestion) {
    setForm((current) => ({
      ...current,
      questions: current.questions.includes(question)
        ? current.questions.filter((item) => item !== question)
        : [...current.questions, question]
    }));
  }

  function appendDescriptionEmoji(emoji: string) {
    setForm((current) => ({ ...current, description: `${current.description}${current.description ? " " : ""}${emoji}` }));
  }

  async function setImages(files: FileList | File[]) {
    const incoming = Array.from(files);
    const imageFiles = incoming.filter((file) => !file.type || file.type.startsWith("image/"));
    const selected = imageFiles.slice(0, 5 - imagePreviews.length);
    if (selected.length === 0) return;
    try {
      const nextPreviews = await Promise.all(selected.map(async (file) => ({ name: file.name, url: await normalizeProductImage(file) })));
      setImagePreviews((current) => [...current, ...nextPreviews].slice(0, 5));
      setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, ...nextPreviews.map((image) => image.url)].slice(0, 5) }));
      if (incoming.length !== imageFiles.length) {
        setMessage("Some files were skipped because they were not images.");
      } else if (imageFiles.length + imagePreviews.length > 5) {
        setMessage("Maximum 5 images. Only the first 5 were attached.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to prepare image.");
    }
  }

  function onImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    setImages(event.currentTarget.files || []);
    event.currentTarget.value = "";
  }

  function removeImage(name: string) {
    setImagePreviews((current) => {
      const nextImages = current.filter((item) => item.name !== name);
      setForm((formState) => ({ ...formState, imageUrls: nextImages.map((image) => image.url) }));
      return nextImages;
    });
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setImages(event.dataTransfer.files);
  }

  function onPaste(event: ClipboardEvent<HTMLFormElement>) {
    const imageFiles = Array.from(event.clipboardData.files);
    if (imageFiles.length === 0) return;
    event.preventDefault();
    setImages(imageFiles);
    setMessage("Screenshot pasted. You can add up to 5 images.");
    if (step !== 1) setStep(1);
  }

  function validateStep(target = step) {
    setMessage("");
    if (target === 0) {
      if (!form.title.trim()) return setMessage("Please add a product name."), false;
      if (!oneSentence.trim()) return setMessage("Please describe your idea in one sentence."), false;
    }
    if (target === 2) {
      return true;
    }
    return true;
  }

  function continueStep() {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, 3) as Step);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const ideaSummary = form.description.trim() || oneSentence.trim();
    if (!form.title.trim()) return setMessage("Please add a product name.");
    if (!ideaSummary) return setMessage("Please describe your idea.");
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
          description: ideaSummary,
          category: form.category.trim() || "Concept",
          country: form.country.trim() || "Not specified",
          questions: form.questions.length ? form.questions : defaultQuestions
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to submit idea.");
      setPublished(true);
      window.setTimeout(() => {
        window.location.href = `/ask/${payload.data.slug}`;
      }, 1050);
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
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_34%,#f7f5f0_100%)] pb-28 text-[#101216] md:pb-12">
      <header className="hidden border-b border-[#e8ebef]/90 bg-white/86 backdrop-blur-xl md:sticky md:top-0 md:z-40 md:block">
        <div className="mx-auto flex h-16 max-w-[1560px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/ask" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#101216] text-white"><Sparkles size={15} /></span>
            TYORA Community
          </Link>
          <div className="flex items-center gap-2">
            <CommunityUserMenu
              loginOpenSignal={loginPrompt}
              loginOnSuccess={() => setMessage("Logged in successfully. Your draft is still here.")}
              loginClassName="inline-flex h-10 shrink-0 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-sm font-semibold text-[#59616e] transition duration-[180ms] hover:bg-[#f6f7fb] sm:px-4"
            />
            <Link href="/ask" className="inline-flex h-10 shrink-0 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-sm font-semibold text-[#59616e] sm:px-4">
              <span className="sm:hidden">Browse</span>
              <span className="hidden sm:inline">Browse Ideas</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1560px] gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:grid-cols-[250px_minmax(0,1fr)_330px] lg:px-6">
        <aside className="hidden self-start rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-[0_14px_44px_rgba(15,23,42,0.08)] lg:sticky lg:top-20 lg:block">
          <p className="text-xs font-semibold uppercase text-[#8b93a1]">Join the discussion</p>
          <h1 className="mt-2 text-xl font-semibold">Start a Discussion</h1>
          <p className="mt-2 text-sm leading-6 text-[#69707d]">Share the product clearly. TYORA and founders can help shape the manufacturing path.</p>
          <div className="mt-5 grid gap-2">
            {steps.map((item, index) => (
              <div key={item}>
                <button
                  type="button"
                  onClick={() => setStep(index as Step)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition duration-[180ms]",
                    step === index ? "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20" : "bg-[#f7f8fa] text-[#59616e] hover:bg-[#eef3ff]"
                  )}
                >
                  <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", step === index ? "bg-white/18 text-white" : "bg-white text-[#69707d]")}>
                    {index + 1}
                  </span>
                  {item}
                </button>
                {index < steps.length - 1 ? <p className="py-1 text-center text-xs text-[#b0b7c3]">↓</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-[#e9f7f3] p-3 text-sm font-semibold text-[#0f766e]">Every submitted idea gets an initial TYORA manufacturing review.</p>
        </aside>

        <form onSubmit={submit} onPaste={onPaste} className={`${panelClass} min-w-0 p-3.5 sm:p-6 lg:p-7`}>
          {published ? (
            <div className="grid min-h-[560px] place-items-center text-center">
              <div>
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e9f7f3] text-[#0f766e] shadow-sm">
                  <Sparkles size={28} />
                </div>
                <h2 className="mt-5 text-3xl font-semibold leading-tight">Your discussion is now live.</h2>
                <p className="mt-3 text-sm font-medium text-[#69707d]">Redirecting to your discussion...</p>
              </div>
            </div>
          ) : (
          <>
          <section className="lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#101216] shadow-sm ring-1 ring-[#e4e8ef]">
                <Sparkles size={14} className="text-[#2563eb]" />
                Quick post
              </p>
              <p className="text-xs font-semibold text-[#8b93a1]">1 minute</p>
            </div>

            <div className="mb-5">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-[11px] font-semibold text-[#315fbd]"><Sparkles size={14} /> FREE TYORA review</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">Start a Discussion</h2>
              <p className="mt-2 text-sm leading-6 text-[#59616e]">Share the idea quickly. Put details, questions, material, quantity, or target cost in the description.</p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">Product name
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Magnetic phone stand" className={inputClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Category
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Phone accessories" className={inputClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Description
                <textarea
                  rows={8}
                  value={form.description}
                  onChange={(event) => {
                    setForm({ ...form, description: event.target.value });
                    setOneSentence(event.target.value);
                  }}
                  placeholder="What is it? Who is it for? Material, quantity, target price, questions, anything you want TYORA to review."
                  className="min-h-48 resize-none rounded-[18px] border border-transparent bg-[#f8fafc] p-4 text-sm leading-6 outline-none transition duration-[180ms] hover:bg-white hover:ring-1 hover:ring-[#e4e8ef] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {quickEmojis.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => appendDescriptionEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                    {emoji}
                  </button>
                ))}
              </div>
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
                className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#93b4f8] bg-[linear-gradient(135deg,#f8fbff,#fff,#f3f8ff)] px-4 text-center shadow-inner shadow-[#2563eb]/5 transition duration-[180ms] active:scale-[0.99]"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm"><ImagePlus size={21} /></span>
                <span className="text-sm font-semibold">Upload product images</span>
                <span className="text-xs text-[#8b93a1]">Select up to 5 images at once · auto-cropped to 800 x 800</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={onImageInputChange} />
              </label>
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((image, index) => (
                    <div key={image.name} className="group relative overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white">
                      <span className="absolute left-1.5 top-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-white/92 text-[11px] font-semibold text-[#2563eb] shadow-sm">{index + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.name} className="aspect-square w-full object-cover" />
                      <button type="button" onClick={() => removeImage(image.name)} className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-white/92 text-[#59616e] shadow-sm" aria-label={`Remove ${image.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {message ? (
              <p className={cn("mt-5 rounded-2xl px-4 py-3 text-sm leading-6", message === "Your idea is live." || message.startsWith("Logged in") ? "bg-[#ecfdf5] text-[#0f766e]" : "bg-[#fff7ed] text-[#9a3412]")}>
                {message}
              </p>
            ) : null}

            <button disabled={submitting} className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60 ${primaryButton}`}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {submitting ? "Publishing..." : "Start Discussion"}
            </button>
          </section>

          <div className="hidden lg:block">
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#101216] shadow-sm ring-1 ring-[#e4e8ef]">
              <Sparkles size={14} className="text-[#2563eb]" />
              Publish idea
            </p>
          </div>

          <div className="mb-3 lg:hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-[#69707d]">
              <span>Step {step + 1} of {steps.length}</span>
              <span className="text-[#315fbd]">{mobileSteps[step]}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8edf5]">
              <div className="h-full rounded-full bg-[#2563eb] transition-all duration-[180ms]" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-[11px] font-semibold text-[#315fbd] sm:text-xs"><Sparkles size={14} /> {usedText}</p>

          {step === 0 ? (
            <section className="mt-4 sm:mt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold leading-tight sm:text-4xl">Start a Discussion</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59616e] sm:mt-3 sm:text-base sm:leading-7">
                    Share an idea. Get free manufacturing feedback.
                  </p>
                </div>
                <p className="w-fit whitespace-nowrap rounded-2xl bg-[#f7f8fa] px-3 py-2 text-xs font-semibold text-[#59616e]">
                  Estimated time <span className="ml-1 text-[#101216]">1 minute</span>
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:mt-7 sm:gap-4">
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
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">Add images if you have them. Sketches, screenshots, reference products, or AI images are all okay.</p>
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
                className="mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[#93b4f8] bg-[linear-gradient(135deg,#f8fbff,#fff,#f3f8ff)] px-4 text-center shadow-inner shadow-[#2563eb]/5 transition duration-[180ms] hover:-translate-y-0.5 hover:border-[#2563eb] hover:bg-[#eef6ff] hover:shadow-[0_18px_50px_rgba(37,99,235,0.12)]"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm"><ImagePlus size={22} /></span>
                <span className="text-base font-semibold">Drag images here</span>
                <span className="text-sm text-[#69707d]">or paste screenshots</span>
                <span className="text-xs text-[#8b93a1]">Select up to 5 images at once · auto-cropped to 800 x 800</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={onImageInputChange} />
              </label>
              {imagePreviews.length > 0 ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {imagePreviews.map((image, index) => (
                    <div key={image.name} className="group relative overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white">
                      <span className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/92 text-xs font-semibold text-[#2563eb] shadow-sm">{index + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.name} className="aspect-square w-full object-cover" />
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
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">Add details if you have them. TYORA can still review a rough idea.</p>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">Description <span className="font-normal text-[#8b93a1]">optional</span>
                  <textarea rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What inspired it? Who is it for? What should founders and TYORA pay attention to?" className="min-h-44 resize-none rounded-[18px] border border-transparent bg-[#f8fafc] p-4 text-sm leading-6 outline-none transition duration-[180ms] hover:bg-white hover:ring-1 hover:ring-[#e4e8ef] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickEmojis.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => appendDescriptionEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">Category <span className="font-normal text-[#8b93a1]">optional</span>
                    <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Phone accessories" className={inputClass} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">Country <span className="font-normal text-[#8b93a1]">optional</span>
                    <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} placeholder="United States" className={inputClass} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-semibold">Question type <span className="font-normal text-[#8b93a1]">optional</span></p>
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
                <section className="grid gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Who can see this discussion?</h3>
                    <p className="mt-1 text-sm leading-6 text-[#69707d]">Choose the discussion type that best fits your product idea.</p>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {visibilityOptions.map((option) => {
                      const selected = form.visibility === option.value;
                      const Icon = option.icon;
                      const BadgeIcon = option.badgeIcon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setForm({ ...form, visibility: option.value })}
                          className={cn(
                            "group relative flex h-full flex-col rounded-[22px] border bg-white p-4 text-left shadow-sm transition duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,0.09)]",
                            selected
                              ? "border-[#2563eb] shadow-[0_18px_50px_rgba(37,99,235,0.14)] ring-4 ring-[#2563eb]/10"
                              : "border-[#e4e8ef] hover:border-[#c7d2fe]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className={cn("flex size-11 items-center justify-center rounded-2xl", selected ? "bg-[#2563eb] text-white" : "bg-[#f7f8fa] text-[#2563eb]")}>
                              <Icon size={20} />
                            </span>
                            {selected ? (
                              <span className="flex size-7 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-sm">
                                <CheckCircle2 size={17} />
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold">{option.title}</h4>
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", option.value === "Public" ? "bg-[#fff7ed] text-[#c2410c]" : "bg-[#f4f6f8] text-[#59616e]")}>
                              {BadgeIcon ? <BadgeIcon size={12} /> : null}
                              {option.badge}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[#101216]">{option.intro}</p>
                          <p className="mt-2 text-sm leading-6 text-[#59616e]">{option.description}</p>
                          <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
                            {option.benefits.map((benefit) => (
                              <span key={benefit} className="inline-flex items-center gap-2">
                                <CheckCircle2 size={15} className="shrink-0 text-[#0f766e]" />
                                {benefit}
                              </span>
                            ))}
                          </div>
                          <p className="mt-4 rounded-2xl bg-[#f8fafc] p-3 text-sm leading-6 text-[#59616e]">{option.recommendation}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-[20px] border border-[#dbeafe] bg-[#eff6ff] p-4 text-sm leading-6 text-[#315fbd]">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb]">
                        <Info size={15} />
                      </span>
                      <div>
                        <h4 className="font-semibold text-[#1d4ed8]">Choosing the right discussion type</h4>
                        <p className="mt-1">Community Discussions are visible to everyone and usually receive much more discussion and manufacturing feedback.</p>
                        <p className="mt-1">Private Custom Projects are only visible to you and TYORA.</p>
                        <p className="mt-1">Choose whichever best fits your project.</p>
                        <button
                          type="button"
                          onClick={() => setVisibilityLearnOpen((current) => !current)}
                          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb] shadow-sm transition duration-[180ms] hover:-translate-y-0.5"
                        >
                          Learn more
                          <ChevronDown size={14} className={cn("transition duration-[180ms]", visibilityLearnOpen ? "rotate-180" : "")} />
                        </button>
                        <div className={cn("grid overflow-hidden transition-[grid-template-rows] duration-[180ms]", visibilityLearnOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                          <div className="min-h-0">
                            <div className="mt-4 grid gap-4 rounded-2xl bg-white/72 p-4 text-[#59616e]">
                              <div>
                                <h5 className="font-semibold text-[#101216]">Why choose Community Discussion?</h5>
                                <p className="mt-1">Community discussions receive more comments, suggestions and manufacturing feedback from other founders.</p>
                                <p className="mt-1">This is the recommended option for most creators.</p>
                              </div>
                              <div>
                                <h5 className="font-semibold text-[#101216]">Why choose Private Custom Project?</h5>
                                <p className="mt-1">Private custom projects are only visible to you and TYORA.</p>
                                <p className="mt-1">If your project contains confidential technology or ideas you are not ready to share publicly, private custom review may be a better choice.</p>
                                <p className="mt-1">TYORA cannot provide legal advice regarding patents or intellectual property.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Ready to go live?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">This is your first version. Publish it, let founders react, and let TYORA help clarify the manufacturing path.</p>
              <div className="mt-6 rounded-[20px] border border-[#e4e8ef] bg-[#fbfcff] p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#69707d]">
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-[#e8ebef]">{form.category || "Concept"}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-[#e8ebef]">{form.visibility}</span>
                  <span className="rounded-full bg-[#e9f7f3] px-2.5 py-1 text-[#0f766e]">FREE review</span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold">{form.title || "Product name"}</h3>
                <p className="mt-2 text-sm leading-6 text-[#59616e]">{form.description || oneSentence || "Your idea summary will appear here."}</p>
                {imagePreviews.length > 0 ? (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {imagePreviews.map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={image.name} src={image.url} alt={image.name} className="size-24 shrink-0 rounded-2xl object-cover" />
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(form.questions.length ? form.questions : defaultQuestions).map((question) => (
                    <span key={question} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#59616e] ring-1 ring-[#e8ebef]">{question}</span>
                  ))}
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
            {step > 0 ? (
              <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0) as Step)} className="h-11 rounded-full border border-[#dfe3e8] bg-white px-5 text-sm font-semibold text-[#59616e] transition duration-[180ms] hover:bg-[#f6f7fb]">
                Back
              </button>
            ) : <span className="hidden sm:block" />}
            {step < 3 ? (
              <button type="button" onClick={continueStep} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold ${primaryButton}`}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button disabled={submitting} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60 ${primaryButton}`}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {submitting ? "Publishing..." : "Start Discussion"}
              </button>
            )}
          </div>
          </div>
          </>
          )}
        </form>

        <aside className="hidden space-y-3 self-start xl:sticky xl:top-20 xl:block">
          <section className="rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-[0_14px_44px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold">After you publish</h2>
            <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
              {nextSteps.map(([item, Icon]) => (
                <p key={item} className="flex gap-3 rounded-2xl bg-[#f7f8fa] p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb] ring-1 ring-[#e4e8ef]"><Icon size={15} /></span>
                  {item}
                </p>
              ))}
            </div>
          </section>
          <section className="rounded-[22px] border border-[#dbeafe] bg-[#eff6ff] p-4 shadow-sm shadow-[#2563eb]/8">
            <h2 className="text-lg font-semibold text-[#1d4ed8]">Every submitted idea gets an initial TYORA manufacturing review.</h2>
            <p className="mt-3 text-sm leading-6 text-[#315fbd]">Public ideas help the community and SEO. Private Custom Projects stay between you and TYORA.</p>
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
