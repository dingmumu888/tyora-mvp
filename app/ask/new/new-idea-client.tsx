"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";
import { communityQuestions, CommunityQuestion } from "@/lib/community";
import EmailLogin from "@/components/email-login";

type SessionUser = { id: string; name: string; email: string; username: string };

export default function NewIdeaClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
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
    fetch("/api/community/session")
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .finally(() => setCheckingSession(false));
  }, []);

  const usedText = useMemo(() => "Today's FREE Expert Reviews: 0 / 3 Used", []);
  const fieldClass = "h-11 rounded-[10px] border border-[#dfe3e8] bg-white px-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
  const panelClass = "rounded-[18px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4";

  function toggleQuestion(question: CommunityQuestion) {
    setForm((current) => ({
      ...current,
      questions: current.questions.includes(question)
        ? current.questions.filter((item) => item !== question)
        : [...current.questions, question]
    }));
  }

  function handleImages(files: FileList | null) {
    const names = Array.from(files || []).slice(0, 5).map((file) => file.name);
    setForm((current) => ({ ...current, imageUrls: names }));
    if ((files?.length || 0) > 5) {
      setMessage("Maximum 5 images. Only the first 5 were attached.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/ideas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to submit idea.");
      window.location.href = `/ask/${payload.data.slug}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit idea.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]"><Loader2 className="animate-spin text-[#2563eb]" /></div>;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f6f7fb_36%,#f7f5f0_100%)] px-6 text-[#101216]">
        <section className="max-w-xl rounded-[20px] border border-[#e4e8ef] bg-white p-8 text-center shadow-sm shadow-[#101216]/5">
          <p className="text-sm font-semibold text-[#69707d]">Email Login Required</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">Join the product creator community.</h1>
          <p className="mt-4 leading-7 text-[#59616e]">Browsing and reading are open. Posting, commenting, interested, and continue project require email login only.</p>
          <EmailLogin className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#2563eb] px-6 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8]">
            Email Login
          </EmailLogin>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f6f7fb_36%,#f7f5f0_100%)] pb-20 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e8ebef]/90 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1520px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/ask" className="text-sm font-semibold">TYORA Community</Link>
          <Link href="/ask" className="rounded-full border border-[#dfe3e8] bg-white px-4 py-2 text-sm font-semibold text-[#59616e]">Browse Ideas</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1520px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:px-8">
        <aside className="hidden space-y-3 self-start lg:sticky lg:top-20 lg:block">
          <section className={panelClass}>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#2563eb] text-white"><Upload size={18} /></div>
            <h2 className="mt-3 text-lg font-semibold">Upload Idea</h2>
            <p className="mt-2 text-sm leading-6 text-[#69707d]">Share a rough product concept and start a manufacturing discussion.</p>
            <p className="mt-3 rounded-2xl bg-[#e9f7f3] p-3 text-sm font-semibold text-[#0f766e]">3 FREE Expert Reviews per day</p>
          </section>
          <section className={panelClass}>
            <h2 className="text-sm font-semibold uppercase text-[#8b93a1]">Workflow</h2>
            <div className="mt-3 grid gap-2 text-sm text-[#59616e]">
              {["Idea", "Discussion", "TYORA Review", "Project", "Manufacturing", "Delivered"].map((step) => (
                <span key={step} className="rounded-2xl bg-[#f7f8fa] px-3 py-2">{step}</span>
              ))}
            </div>
          </section>
        </aside>

        <form onSubmit={submit} className="min-w-0 rounded-[20px] border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4 sm:p-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]"><Sparkles size={14} /> {usedText}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Start a Discussion</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">Community discussion is unlimited. TYORA reviews manufacturing feasibility, cost, materials, MOQ and factory fit.</p>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">Product Name
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} />
          </label>
          <label className="grid gap-2 text-sm font-medium">Description
            <textarea required rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="resize-none rounded-[10px] border border-[#dfe3e8] bg-white p-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Category
              <input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={fieldClass} />
            </label>
            <label className="grid gap-2 text-sm font-medium">Country
              <input required value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className={fieldClass} />
            </label>
          </div>
          <label className="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-[12px] border border-dashed border-[#bfd0f5] bg-[#f8fbff] px-4 text-sm text-[#59616e] transition hover:bg-[#eef6ff]">
            <ImagePlus size={18} /> Upload Images <span className="text-[#9aa1ab]">Maximum 5</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => handleImages(event.target.files)} />
          </label>
          {form.imageUrls.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs text-[#69707d]">
              {form.imageUrls.map((name) => <span key={name} className="rounded-full bg-white px-3 py-1 ring-1 ring-[#e8ebef]">{name}</span>)}
            </div>
          ) : null}
          <div>
            <p className="text-sm font-medium">Questions For TYORA</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {communityQuestions.map((question) => (
                <label key={question} className="flex items-center gap-3 rounded-[6px] border border-[#e8ebef] bg-white px-3 py-3 text-sm">
                  <input type="checkbox" checked={form.questions.includes(question)} onChange={() => toggleQuestion(question)} className="size-4 accent-[#2563eb]" />
                  {question}
                </label>
              ))}
            </div>
          </div>
          {form.questions.includes("Other") ? (
            <input value={form.otherQuestion} onChange={(event) => setForm({ ...form, otherQuestion: event.target.value })} placeholder="Other question" className={fieldClass} />
          ) : null}
          <label className="grid gap-2 text-sm font-medium">Public / Private
            <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })} className={fieldClass}>
              <option>Public</option>
              <option>Private</option>
            </select>
          </label>
        </div>

        <button disabled={submitting} className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] disabled:opacity-60">
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null} Submit FREE
        </button>
        {message ? <p className="mt-4 text-sm text-[#8a5a00]">{message}</p> : null}
        </form>

        <aside className="hidden space-y-3 self-start xl:sticky xl:top-20 xl:block">
          <section className={panelClass}>
            <h2 className="text-lg font-semibold">Live Activity</h2>
            <div className="mt-4 space-y-3">
              {["Founders share ideas", "Community discusses factory fit", "TYORA experts reply"].map((item) => (
                <p key={item} className="rounded-2xl bg-[#f7f8fa] p-3 text-sm text-[#59616e]">{item}</p>
              ))}
            </div>
          </section>
          <section className={panelClass}>
            <h2 className="text-lg font-semibold">What To Include</h2>
            <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
              {["Product use case", "Target material", "Reference images", "Questions for TYORA"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-2xl bg-[#f7f8fa] p-3"><CheckCircle2 size={15} className="text-[#2563eb]" /> {item}</span>
              ))}
            </div>
          </section>
          <section className="rounded-[18px] border border-[#dbeafe] bg-[#eff6ff] p-4">
            <h2 className="text-lg font-semibold text-[#1d4ed8]">Community First</h2>
            <p className="mt-3 text-sm leading-6 text-[#315fbd]">Your post becomes a discussion, then a TYORA review, then a project when you are ready to build.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
