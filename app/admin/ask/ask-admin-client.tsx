"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { ASK_STATUSES, AskIdea, AskStatus } from "@/lib/ask";

export default function AskAdminClient() {
  const [ideas, setIdeas] = useState<AskIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<AskStatus>("Waiting");
  const [savingSlug, setSavingSlug] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/ask", { cache: "no-store" });
        const payload = await response.json();
        if (payload.success) setIdeas(payload.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const counts = useMemo(() => {
    return ASK_STATUSES.reduce<Record<AskStatus, number>>((acc, status) => {
      acc[status] = ideas.filter((idea) => idea.status === status).length;
      return acc;
    }, { Waiting: 0, Answered: 0, "Project Started": 0, Completed: 0 });
  }, [ideas]);

  const filtered = ideas.filter((idea) => idea.status === activeStatus);

  async function updateIdea(idea: AskIdea, status: AskStatus, expertReview: string) {
    setSavingSlug(idea.slug);
    try {
      const response = await fetch(`/api/ask/${idea.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, expertReview })
      });
      const payload = await response.json();
      if (payload.success) {
        setIdeas((current) => current.map((item) => item.slug === idea.slug ? payload.data : item));
      }
    } finally {
      setSavingSlug("");
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-[#101216] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#edf0f3] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#69707d]">TYORA Admin</p>
            <h1 className="mt-2 text-3xl font-semibold">Ask TYORA</h1>
          </div>
          <Link href="/ask" className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-[#dfe3e8] px-4 text-sm font-semibold">
            Public page <ExternalLink size={15} />
          </Link>
        </header>

        <div className="mt-6 grid gap-2 sm:grid-cols-4">
          {ASK_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`rounded-[8px] border px-4 py-3 text-left transition ${activeStatus === status ? "border-[#101216] bg-[#101216] text-white" : "border-[#e8ebef] bg-white text-[#101216]"}`}
            >
              <span className="block text-sm font-semibold">{status}</span>
              <span className={activeStatus === status ? "text-sm text-white/70" : "text-sm text-[#69707d]"}>{counts[status]} ideas</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.length === 0 && <p className="rounded-[8px] border border-[#e8ebef] p-6 text-sm text-[#69707d]">No Ask TYORA submissions in this status.</p>}
            {filtered.map((idea) => (
              <article key={idea.id} className="rounded-[8px] border border-[#e8ebef] bg-[#fbfbfc] p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#69707d]">
                      <span>{idea.id}</span>
                      <span>{new Date(idea.createdAt).toLocaleString()}</span>
                      <span>{idea.visibility}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">{idea.productName}</h2>
                    <p className="mt-2 text-sm text-[#69707d]">{idea.category} · {idea.country}</p>
                    <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[#505762]">{idea.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#69707d]">
                      {idea.questions.map((question) => <span key={question} className="rounded-full bg-white px-3 py-1 ring-1 ring-[#e8ebef]">{question}</span>)}
                    </div>
                    <div className="mt-4 text-sm text-[#69707d]">
                      <p>{idea.email}</p>
                      {idea.whatsapp && <p>{idea.whatsapp}</p>}
                    </div>
                  </div>

                  <form action={async (formData) => {
                    await updateIdea(
                      idea,
                      formData.get("status") as AskStatus,
                      String(formData.get("expertReview") || "")
                    );
                  }} className="grid gap-3">
                    <label className="grid gap-2 text-sm font-medium">Status
                      <select name="status" defaultValue={idea.status} className="h-11 rounded-[6px] border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#101216]">
                        {ASK_STATUSES.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">TYORA Expert Review
                      <textarea name="expertReview" defaultValue={idea.expertReview || ""} rows={8} className="resize-none rounded-[6px] border border-[#dfe3e8] bg-white p-3 outline-none focus:border-[#101216]" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button disabled={savingSlug === idea.slug} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white disabled:opacity-60">
                        {savingSlug === idea.slug ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Save
                      </button>
                      <Link href={`/ask/${idea.slug}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe3e8] px-4 text-sm font-semibold">
                        View <ExternalLink size={15} />
                      </Link>
                    </div>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
