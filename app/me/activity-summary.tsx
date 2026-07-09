"use client";

import { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Pencil, Trash2, X } from "lucide-react";
import CommunityImage from "@/components/community-image";
import { CommunityIdea } from "@/lib/community";

type ActivityView = "posts" | "comments" | "likes" | "interested" | "reviews";

type UserComment = {
  id: string;
  body: string;
  createdAt: string;
  idea: CommunityIdea;
};

type IdeaReaction = {
  id: string;
  createdAt: string;
  idea: CommunityIdea;
};

type SummaryItem = {
  view: ActivityView;
  label: string;
  value: number;
};

type EditForm = {
  title: string;
  category: string;
  description: string;
};

const emptyText: Record<ActivityView, string> = {
  posts: "You haven't started a discussion yet.",
  comments: "You haven't commented on any ideas yet.",
  likes: "Ideas you love will appear here.",
  interested: "Ideas you marked as something you'd buy will appear here.",
  reviews: "TYORA reviews will appear here."
};

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 6e4));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function IdeaCard({
  idea,
  meta,
  children
}: {
  idea: CommunityIdea;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-[18px] border border-[#e3e9f1] bg-white p-3 shadow-sm shadow-[#101216]/4 transition hover:border-[#93c5fd]">
      <Link href={`/ask/${idea.slug}`} className="block">
        <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#e9f7f3] via-white to-[#eff4ff]">
          <CommunityImage src={idea.imageUrls[0]} alt={idea.title} className="absolute inset-0 size-full object-contain" fallbackClassName="absolute inset-0 p-4" />
        </div>
        <div className="mt-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#69707d]">
            <span className="rounded-full bg-[#f4f6f8] px-2 py-1">{idea.category}</span>
            <span>{idea.status}</span>
            <span>{meta || timeAgo(idea.updatedAt || idea.createdAt)}</span>
          </div>
          <h3 className="mt-2 line-clamp-1 text-base font-semibold text-[#101216]">{idea.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#59616e]">{idea.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-[#69707d]">
            <span>{idea.likeCount} Love</span>
            <span>{idea.comments.length} Comments</span>
            <span>{idea.interestedCount} I'd Buy</span>
          </div>
        </div>
      </Link>
      {children ? <div className="mt-3 flex flex-wrap gap-2 border-t border-[#edf0f4] pt-3">{children}</div> : null}
    </article>
  );
}

function CommentCard({ comment }: { comment: UserComment }) {
  return (
    <Link href={`/ask/${comment.idea.slug}`} className="block rounded-[18px] border border-[#e4e8ef] bg-[#fbfcfe] p-4 transition hover:border-[#93c5fd]">
      <p className="text-sm leading-6 text-[#59616e]">"{comment.body}"</p>
      <p className="mt-2 text-sm font-semibold text-[#101216]">{comment.idea.title}</p>
      <p className="mt-1 text-xs text-[#8b93a1]">{timeAgo(comment.createdAt)}</p>
    </Link>
  );
}

function ReviewCard({ idea }: { idea: CommunityIdea }) {
  const reviewText = idea.review?.additionalNotes || idea.review?.manufacturingFeasible || "TYORA review is available.";
  return (
    <div className="rounded-[18px] border border-[#c7f0e8] bg-[#f8fffd] p-3">
      <IdeaCard idea={idea} meta={`Reviewed ${timeAgo(idea.review?.updatedAt || idea.updatedAt)}`} />
      <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm leading-6 text-[#0f766e]">{reviewText}</p>
    </div>
  );
}

export default function ActivitySummary({
  items,
  ideas,
  comments,
  likedIdeas,
  interestedIdeas
}: {
  items: readonly SummaryItem[];
  ideas: CommunityIdea[];
  comments: UserComment[];
  likedIdeas: IdeaReaction[];
  interestedIdeas: IdeaReaction[];
}) {
  const [activeView, setActiveView] = useState<ActivityView | null>(null);
  const [editingIdea, setEditingIdea] = useState<CommunityIdea | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", category: "", description: "" });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const reviewedIdeas = useMemo(() => ideas.filter((idea) => idea.review), [ideas]);
  const activeItem = items.find((item) => item.view === activeView);

  function openEdit(idea: CommunityIdea) {
    setEditingIdea(idea);
    setEditForm({
      title: idea.title,
      category: idea.category,
      description: idea.description
    });
    setMessage("");
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingIdea) return;
    setBusy(`edit-${editingIdea.slug}`);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${editingIdea.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to edit post.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to edit post.");
    } finally {
      setBusy("");
    }
  }

  async function deleteIdea(idea: CommunityIdea) {
    const confirmed = window.confirm(`Delete "${idea.title}"?\n\nThis removes it from your public discussions.`);
    if (!confirmed) return;
    setBusy(`delete-${idea.slug}`);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to delete post.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete post.");
    } finally {
      setBusy("");
    }
  }

  async function cancelLike(idea: CommunityIdea) {
    setBusy(`like-${idea.slug}`);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}/reaction`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "Like" })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to cancel like.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel like.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-5 gap-1 rounded-[18px] bg-[#f7f8fa] p-2">
        {items.map(({ label, value, view }) => (
          <button key={view} type="button" onClick={() => setActiveView(view)} className="rounded-2xl bg-white px-2 py-2 text-center shadow-sm shadow-[#101216]/3 transition hover:-translate-y-0.5 hover:text-[#315fbd] hover:shadow-md">
            <span className="block text-base font-semibold">{value}</span>
            <span className="mt-0.5 block text-[10px] font-medium text-[#69707d]">{label}</span>
          </button>
        ))}
      </div>

      {activeView ? (
        <div className="fixed inset-0 z-50 bg-[#101216]/35 p-3 backdrop-blur-sm sm:p-5">
          <section className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-[#dfe6ef] bg-white shadow-2xl shadow-[#101216]/24">
            <header className="flex items-center justify-between gap-3 border-b border-[#edf0f4] p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#315fbd]">My TYORA</p>
                <h2 className="mt-1 text-2xl font-semibold">{activeItem?.label}</h2>
              </div>
              <button type="button" onClick={() => setActiveView(null)} className="flex size-10 items-center justify-center rounded-full border border-[#dfe3e8] text-[#69707d] transition hover:bg-[#f7f8fa]" aria-label="Close activity panel">
                <X size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {activeView === "posts" && ideas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea}>
                    <button type="button" onClick={() => openEdit(idea)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dfe3e8] bg-white px-3 text-xs font-semibold text-[#101216] transition hover:bg-[#f7f8fa]">
                      <Pencil size={13} /> Edit
                    </button>
                    <button type="button" disabled={busy === `delete-${idea.slug}`} onClick={() => void deleteIdea(idea)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#fee2e2] bg-[#fff1f2] px-3 text-xs font-semibold text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60">
                      {busy === `delete-${idea.slug}` ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />} Delete
                    </button>
                  </IdeaCard>
                ))}
                {activeView === "comments" && comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)}
                {activeView === "likes" && likedIdeas.map((item) => (
                  <IdeaCard key={item.id} idea={item.idea} meta={`Liked ${timeAgo(item.createdAt)}`}>
                    <button type="button" disabled={busy === `like-${item.idea.slug}`} onClick={() => void cancelLike(item.idea)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#fecdd3] bg-[#fff1f2] px-3 text-xs font-semibold text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60">
                      {busy === `like-${item.idea.slug}` ? <Loader2 className="animate-spin" size={13} /> : null} Cancel like
                    </button>
                  </IdeaCard>
                ))}
                {activeView === "interested" && interestedIdeas.map((item) => <IdeaCard key={item.id} idea={item.idea} meta={`I'd Buy ${timeAgo(item.createdAt)}`} />)}
                {activeView === "reviews" && reviewedIdeas.map((idea) => <ReviewCard key={idea.id} idea={idea} />)}
              </div>
              {activeItem?.value === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#cfd8e6] bg-white/80 p-5 text-sm text-[#69707d]">
                  <p className="font-semibold text-[#101216]">{emptyText[activeView]}</p>
                  {activeView === "posts" ? <Link href="/ask/new" className="mt-3 inline-flex rounded-full bg-[#101216] px-4 py-2 text-xs font-semibold text-white">Start a Discussion</Link> : null}
                </div>
              ) : null}
              {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
            </div>
            <footer className="border-t border-[#edf0f4] p-4 text-xs text-[#69707d]">
              <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> Tap any item to open the full discussion.</span>
            </footer>
          </section>
        </div>
      ) : null}

      {editingIdea ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#101216]/45 px-4 backdrop-blur-sm">
          <form onSubmit={saveEdit} className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl shadow-[#101216]/25">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b93a1]">Edit post</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#101216]">Update your idea</h2>
              </div>
              <button type="button" onClick={() => setEditingIdea(null)} className="flex size-10 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#69707d]" aria-label="Close edit post">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-semibold text-[#101216]">
                Product name
                <input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#101216]">
                Category
                <input value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#101216]">
                Description
                <textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows={7} className="min-h-36 resize-none rounded-2xl border border-[#dfe3e8] p-3 text-sm leading-6 outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
              </label>
            </div>
            {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditingIdea(null)} className="h-11 rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold text-[#59616e]">Cancel</button>
              <button disabled={busy === `edit-${editingIdea.slug}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white disabled:opacity-60">
                {busy === `edit-${editingIdea.slug}` ? <Loader2 className="animate-spin" size={15} /> : <Pencil size={15} />} Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
