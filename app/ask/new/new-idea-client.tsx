"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, ImagePlus, Loader2 } from "lucide-react";
import { communityQuestions, CommunityQuestion } from "@/lib/community";

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
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-[#101216]">
        <section className="max-w-xl rounded-[8px] border border-[#e8ebef] p-8 text-center">
          <p className="text-sm font-semibold text-[#69707d]">Google Login Required</p>
          <h1 className="mt-3 text-4xl font-semibold">Post your idea with Google.</h1>
          <p className="mt-4 leading-7 text-[#59616e]">Browsing and reading are open. Posting, commenting, interested, and continue project require Google login only.</p>
          <a href="/api/community/auth/google" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#101216] px-6 text-sm font-semibold text-white">
            Continue with Google <ArrowRight size={16} />
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#101216] sm:px-6 lg:px-8">
      <form onSubmit={submit} className="mx-auto max-w-3xl rounded-[8px] border border-[#e8ebef] bg-[#fbfbfc] p-5 sm:p-8">
        <p className="text-sm font-semibold text-[#69707d]">{usedText}</p>
        <h1 className="mt-2 text-4xl font-semibold">Upload My Idea</h1>
        <p className="mt-3 text-sm text-[#59616e]">Community discussion is unlimited. TYORA only reviews manufacturing, not market demand.</p>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">Product Title
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="h-11 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
          </label>
          <label className="grid gap-2 text-sm font-medium">Description
            <textarea required rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="resize-none rounded-[6px] border border-[#dfe3e8] bg-white p-3 outline-none focus:border-[#101216]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Category
              <input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-11 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
            </label>
            <label className="grid gap-2 text-sm font-medium">Country
              <input required value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="h-11 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
            </label>
          </div>
          <label className="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-[6px] border border-dashed border-[#cfd5dc] bg-white px-4 text-sm text-[#69707d]">
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
                  <input type="checkbox" checked={form.questions.includes(question)} onChange={() => toggleQuestion(question)} className="size-4 accent-[#101216]" />
                  {question}
                </label>
              ))}
            </div>
          </div>
          {form.questions.includes("Other") ? (
            <input value={form.otherQuestion} onChange={(event) => setForm({ ...form, otherQuestion: event.target.value })} placeholder="Other question" className="h-11 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]" />
          ) : null}
          <label className="grid gap-2 text-sm font-medium">Public / Private
            <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })} className="h-11 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]">
              <option>Public</option>
              <option>Private</option>
            </select>
          </label>
        </div>

        <button disabled={submitting} className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null} Submit
        </button>
        {message ? <p className="mt-4 text-sm text-[#8a5a00]">{message}</p> : null}
      </form>
    </main>
  );
}
