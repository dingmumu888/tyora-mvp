"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2, MessageCircle, Send } from "lucide-react";
import { AskDiscussionItem, AskIdea, normalizeAskIdea } from "@/lib/ask";
import { WHATSAPP_URL } from "@/lib/whatsapp";

function localIdeas() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem("tyora-ask-ideas");
  return raw ? JSON.parse(raw) as Record<string, AskIdea> : {};
}

function saveLocalIdea(idea: AskIdea) {
  const ideas = localIdeas();
  ideas[idea.slug] = idea;
  window.localStorage.setItem("tyora-ask-ideas", JSON.stringify(ideas));
}

function projectWhatsAppUrl(idea: AskIdea) {
  const url = typeof window === "undefined" ? `/ask/${idea.slug}` : window.location.href;
  const text = [
    "Hi TYORA, I want to continue this project.",
    `Idea ID: ${idea.id}`,
    `Idea URL: ${url}`,
    `Product Name: ${idea.productName}`
  ].join("\n");
  const base = WHATSAPP_URL.split("?")[0];
  return `${base}?text=${encodeURIComponent(text)}`;
}

export default function IdeaClient({ slug }: { slug: string }) {
  const [idea, setIdea] = useState<AskIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentName, setCommentName] = useState("");
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch(`/api/ask/${slug}`);
        const payload = await response.json();
        if (payload.success && mounted) {
          setIdea(payload.data);
          saveLocalIdea(payload.data);
          return;
        }
      } catch {
      }

      const local = localIdeas()[slug];
      if (mounted && local) {
        setIdea(normalizeAskIdea(local));
      }
      if (mounted) setLoading(false);
    }
    load().finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [slug]);

  const whatsappUrl = useMemo(() => idea ? projectWhatsAppUrl(idea) : "#", [idea]);

  function addDiscussion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!idea || !commentBody.trim()) return;
    const item: AskDiscussionItem = {
      id: `DISC-${Date.now().toString(36).toUpperCase()}`,
      name: commentName.trim() || "Founder",
      body: commentBody.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = { ...idea, discussion: [item, ...idea.discussion], updatedAt: new Date().toISOString() };
    setIdea(updated);
    saveLocalIdea(updated);
    setCommentBody("");
    setCommentName("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-[#101216]">
        <Loader2 className="animate-spin" />
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 text-[#101216]">
        <p className="text-sm font-semibold text-[#69707d]">Ask TYORA</p>
        <h1 className="mt-3 text-4xl font-semibold">Idea not found.</h1>
        <Link href="/ask" className="mt-8 inline-flex h-11 w-fit items-center rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">Start a new review</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#101216]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/ask" className="text-sm font-semibold">Ask TYORA</Link>
        <span className="rounded-full border border-[#e8ebef] px-3 py-1 text-xs text-[#69707d]">{idea.status}</span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-8">
        <div className="border-y border-[#edf0f3] py-10 sm:py-14">
          <p className="text-sm font-medium text-[#69707d]">{idea.id}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">{idea.productName}</h1>
          <div className="mt-6 flex flex-wrap gap-2 text-sm text-[#69707d]">
            {[idea.category, idea.country, idea.visibility].map((item) => (
              <span key={item} className="rounded-full border border-[#e8ebef] px-3 py-1">{item}</span>
            ))}
          </div>
        </div>

        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="rounded-[8px] border border-[#e8ebef] p-6">
              <h2 className="text-xl font-semibold">Idea</h2>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-[#505762]">{idea.description}</p>
              {idea.imageNames.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#69707d]">
                  {idea.imageNames.map((name) => <span key={name} className="rounded-full bg-[#f5f6f8] px-3 py-1">{name}</span>)}
                </div>
              )}
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {idea.questions.map((question) => (
                  <div key={question} className="rounded-[6px] bg-[#f5f6f8] px-3 py-3 text-sm">{question}</div>
                ))}
              </div>
              {idea.otherQuestion && <p className="mt-4 text-sm text-[#69707d]">{idea.otherQuestion}</p>}
            </section>

            <section className="rounded-[8px] border border-[#e8ebef] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Community Discussion</h2>
                  <p className="mt-1 text-sm text-[#69707d]">Idea-specific discussion is unlimited.</p>
                </div>
              </div>
              <form onSubmit={addDiscussion} className="mt-5 grid gap-3">
                <input value={commentName} onChange={(event) => setCommentName(event.target.value)} placeholder="Name" className="h-11 rounded-[6px] border border-[#dfe3e8] px-3 outline-none focus:border-[#101216]" />
                <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Add a practical manufacturing note or question" rows={4} className="resize-none rounded-[6px] border border-[#dfe3e8] p-3 outline-none focus:border-[#101216]" />
                <button className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">
                  <Send size={16} /> Add discussion
                </button>
              </form>
              <div className="mt-6 space-y-3">
                {idea.discussion.length === 0 && <p className="text-sm text-[#69707d]">No discussion yet.</p>}
                {idea.discussion.map((item) => (
                  <article key={item.id} className="rounded-[6px] bg-[#f8f9fa] p-4">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#505762]">{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[8px] border border-[#e8ebef] p-5">
              <h2 className="text-lg font-semibold">TYORA Expert Review</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#505762]">
                {idea.expertReview || "Waiting. TYORA will review manufacturability, likely cost drivers, material path, MOQ, and factory fit within 8 working hours."}
              </p>
            </section>

            <section className="rounded-[8px] bg-[#101216] p-5 text-white">
              <h2 className="text-lg font-semibold">Ready to Build</h2>
              <p className="mt-3 text-sm leading-6 text-white/72">Continue this project with TYORA on WhatsApp. The message includes Idea ID, Idea URL, and Product Name automatically.</p>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#101216]">
                <MessageCircle size={16} /> Continue This Project <ArrowUpRight size={15} />
              </a>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
