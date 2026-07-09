"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Save, Trash2, X } from "lucide-react";
import { CommunityIdea } from "@/lib/community";

type QueueFilter = "needs-reply" | "replied" | "pinned" | "hidden" | "all";

const buckets: Array<[QueueFilter, string]> = [
  ["needs-reply", "Needs Reply"],
  ["replied", "Replied"],
  ["pinned", "Pinned"],
  ["hidden", "Hidden"],
  ["all", "All"]
];

const reviewFields = [
  ["manufacturingFeasible", "Manufacturing feasible"],
  ["estimatedCostRange", "Estimated cost range"],
  ["suggestedMaterial", "Suggested material"],
  ["estimatedMoq", "Estimated MOQ"],
  ["suggestedManufacturing", "Suggested manufacturing process"],
  ["factoriesMatched", "Factories matched"],
  ["additionalNotes", "Additional notes"]
] as const;

function existingReply(idea: CommunityIdea) {
  if (!idea.review) return "";
  if (idea.review.additionalNotes) return idea.review.additionalNotes;
  return reviewFields
    .map(([key, label]) => {
      const value = idea.review?.[key];
      return value ? `${label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export default function CommunityAdminClient() {
  const [ideas, setIdeas] = useState<CommunityIdea[]>([]);
  const [active, setActive] = useState<QueueFilter>("needs-reply");
  const [replyingTo, setReplyingTo] = useState<CommunityIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    fetch("/api/admin/community")
      .then((response) => response.json())
      .then((payload) => setIdeas(payload.data || []))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return {
      "needs-reply": ideas.filter((idea) => !idea.review && !idea.hidden).length,
      replied: ideas.filter((idea) => idea.review && !idea.hidden).length,
      pinned: ideas.filter((idea) => idea.pinned && !idea.hidden).length,
      hidden: ideas.filter((idea) => idea.hidden).length,
      all: ideas.length
    };
  }, [ideas]);

  async function save(event: FormEvent<HTMLFormElement>, idea: CommunityIdea) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(idea.slug);
    const body = {
      status: form.get("status"),
      hidden: form.get("hidden") === "on",
      locked: form.get("locked") === "on",
      pinned: form.get("pinned") === "on",
      review: {
        additionalNotes: form.get("reply")
      }
    };
    try {
      const response = await fetch(`/api/admin/community/${idea.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (payload.success) {
        setIdeas((current) => current.map((item) => item.id === idea.id ? payload.data : item));
        setReplyingTo(null);
      }
    } finally {
      setSaving("");
    }
  }

  async function deleteIdea(idea: CommunityIdea) {
    const confirmed = window.confirm(`Permanently delete "${idea.title}"?\n\nThis cannot be undone.`);
    if (!confirmed) return;
    const secondConfirmation = window.prompt(`Type DELETE to permanently delete "${idea.title}".`);
    if (secondConfirmation !== "DELETE") return;

    setDeleting(idea.slug);
    try {
      const response = await fetch(`/api/admin/community/${idea.slug}`, { method: "DELETE" });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message || "Unable to delete post.");
      setIdeas((current) => current.filter((item) => item.id !== idea.id));
      if (replyingTo?.id === idea.id) setReplyingTo(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete post.");
    } finally {
      setDeleting("");
    }
  }

  const filtered = ideas.filter((idea) => {
    if (active === "needs-reply") return !idea.review && !idea.hidden;
    if (active === "replied") return Boolean(idea.review) && !idea.hidden;
    if (active === "pinned") return idea.pinned && !idea.hidden;
    if (active === "hidden") return idea.hidden;
    return true;
  });

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-[#101216] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[24px] border border-[#e8ebef] bg-white p-6 shadow-sm shadow-[#101216]/4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#69707d]">TYORA OS · Community</p>
            <h1 className="mt-2 text-3xl font-semibold">Ideas Work Queue</h1>
            <p className="mt-2 text-sm text-[#69707d]">Read founder ideas and publish natural TYORA replies. Keep community management simple and conversational.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold">Back to Today</Link>
            <Link href="/ask" className="rounded-full bg-[#101216] px-4 py-2 text-sm font-semibold text-white">View Community</Link>
          </div>
          </div>
        </header>

        <div className="mt-6 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          {buckets.map(([status, label]) => (
            <button key={status} onClick={() => setActive(status)} className={`rounded-2xl border p-3 text-left shadow-sm shadow-[#101216]/4 ${active === status ? "border-[#101216] bg-[#101216] text-white" : "border-[#e8ebef] bg-white"}`}>
              <span className="block text-sm font-semibold">{label}</span>
              <span className="text-xs opacity-70">{counts[status] || 0} posts</span>
            </button>
          ))}
        </div>

        {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div> : (
          <div className="mt-6 space-y-5">
            {filtered.length === 0 ? <p className="rounded-[22px] border border-[#e8ebef] bg-white p-6 text-sm text-[#69707d]">No posts in this section.</p> : null}
            {filtered.map((idea) => (
              <article key={idea.id} className="rounded-[22px] border border-[#e8ebef] bg-white p-5 shadow-sm shadow-[#101216]/4">
                <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
                  <div>
                    <p className="text-xs text-[#69707d]">{idea.id} · {idea.visibility} · {idea.author.name}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{idea.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{idea.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#69707d]">
                      <span>{idea.comments.length} comments</span>
                      <span>{idea.likeCount} likes</span>
                      <span>{idea.interestedCount} interested</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between rounded-[20px] border border-[#eef1f4] bg-[#fbfbfc] p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b93a1]">TYORA Reply</p>
                      {idea.review ? (
                        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{existingReply(idea)}</p>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-[#69707d]">No TYORA reply yet. Open the reply box and write one clear, helpful response.</p>
                      )}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setReplyingTo(idea)} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white transition hover:bg-[#24272d]">
                        <MessageSquare size={15} /> Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteIdea(idea)}
                        disabled={deleting === idea.slug}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#fecdd3] bg-[#fff1f2] px-4 text-sm font-semibold text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60"
                      >
                        {deleting === idea.slug ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                        Delete spam / violation
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {replyingTo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101216]/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form onSubmit={(event) => void save(event, replyingTo)} className="w-full max-w-2xl rounded-[28px] border border-[#e8ebef] bg-white p-5 shadow-2xl shadow-[#101216]/20 sm:p-6">
            <input type="hidden" name="status" value={replyingTo.status} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#69707d]">{replyingTo.id}</p>
                <h2 className="mt-1 text-2xl font-semibold">Reply to {replyingTo.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#69707d]">Write one complete TYORA response. Mention feasibility, cost, material, MOQ, factory fit or next step naturally if useful.</p>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e8ebef] text-[#69707d] transition hover:bg-[#f5f6f8]" aria-label="Close reply dialog">
                <X size={18} />
              </button>
            </div>
            <label className="mt-5 grid gap-2 text-sm font-semibold">
              TYORA Reply
              <textarea name="reply" defaultValue={existingReply(replyingTo)} rows={12} autoFocus className="min-h-[260px] resize-y rounded-[18px] border border-[#dfe3e8] bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" placeholder="Example: Yes, this can be manufactured. I recommend starting with..." />
            </label>
            <div className="mt-4 grid gap-3 rounded-[18px] bg-[#f7f8fa] p-4 text-sm sm:grid-cols-3">
              <label className="flex items-center gap-2"><input name="hidden" type="checkbox" defaultChecked={replyingTo.hidden} /> Hide Post</label>
              <label className="flex items-center gap-2"><input name="locked" type="checkbox" defaultChecked={replyingTo.locked} /> Lock Comments</label>
              <label className="flex items-center gap-2"><input name="pinned" type="checkbox" defaultChecked={replyingTo.pinned} /> Pin Post</label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setReplyingTo(null)} className="inline-flex h-11 items-center justify-center rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold">Cancel</button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">
                {saving === replyingTo.slug ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Publish Reply
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
