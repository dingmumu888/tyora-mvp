"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Heart, Loader2, MessageCircle, Pencil, Share2, Star, Trash2, X } from "lucide-react";
import { CommunityIdea } from "@/lib/community";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import EmailLogin from "@/components/email-login";

type SessionUser = { id: string; name: string; email: string; username: string };
type IdeaActionMode = "bar" | "comment" | "ready";
const quickEmojis = ["💡", "🔥", "👍", "❤️", "👀", "🙌"];

export default function IdeaActions({ idea, mode = "bar", compact = false }: { idea: CommunityIdea; mode?: IdeaActionMode; compact?: boolean }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [body, setBody] = useState("");
  const [reactionState, setReactionState] = useState({ liked: false, interested: false });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: idea.title,
    category: idea.category,
    description: idea.description
  });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const isOwner = Boolean(user && user.id === idea.author.id);

  useEffect(() => {
    function refreshSession() {
      fetch("/api/community/session")
        .then((response) => response.json())
        .then((data) => setUser(data.user || null))
        .catch(() => setUser(null))
        .finally(() => setSessionChecked(true));
    }

    refreshSession();
    window.addEventListener("tyora:community-login", refreshSession);
    return () => window.removeEventListener("tyora:community-login", refreshSession);
  }, []);

  useEffect(() => {
    fetch(`/api/community/ideas/${idea.slug}/reaction`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setReactionState(data.data);
      })
      .catch(() => setReactionState({ liked: false, interested: false }));
  }, [idea.slug, user?.id]);

  const whatsappUrl = useMemo(() => {
    const text = [
      "Hi TYORA, I want to continue this project.",
      `Idea ID: ${idea.id}`,
      `Idea URL: ${typeof window === "undefined" ? `/ask/${idea.slug}` : window.location.href}`,
      `Title: ${idea.title}`,
      `Customer Name: ${user?.name || ""}`
    ].join("\n");
    return `${WHATSAPP_URL.split("?")[0]}?text=${encodeURIComponent(text)}`;
  }, [idea.id, idea.slug, idea.title, user?.name]);

  function appendCommentEmoji(emoji: string) {
    setBody((current) => `${current}${current ? " " : ""}${emoji}`);
    window.setTimeout(() => commentRef.current?.focus(), 0);
  }

  function appendEditEmoji(emoji: string) {
    setEditForm((current) => ({ ...current, description: `${current.description}${current.description ? " " : ""}${emoji}` }));
  }

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionChecked) return;
    if (!user) {
      setMessage("Email login is required to comment.");
      return;
    }
    setBusy("comment");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body })
      });
      if (!response.ok) throw new Error("Unable to comment.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to comment.");
    } finally {
      setBusy("");
    }
  }

  async function react(type: "Like" | "Interested") {
    if (!sessionChecked) return;
    if (!user) {
      setMessage("Email login is required.");
      return;
    }
    setBusy(type);
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}/reaction`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (!response.ok) throw new Error("Unable to update.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update.");
    } finally {
      setBusy("");
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isOwner) return;
    setBusy("edit");
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to edit discussion.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to edit discussion.");
    } finally {
      setBusy("");
    }
  }

  async function withdrawIdea() {
    if (!isOwner) return;
    const confirmed = window.confirm("Withdraw this discussion?\n\nIt will no longer appear publicly. This is not reversible from the public page.");
    if (!confirmed) return;
    setBusy("withdraw");
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to withdraw discussion.");
      window.location.href = "/ask";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to withdraw discussion.");
    } finally {
      setBusy("");
    }
  }

  if (mode === "comment") {
    return (
      <form onSubmit={postComment} className="rounded-[20px] border border-[#e8ebef] bg-white p-4 shadow-sm shadow-[#101216]/4">
        <p className="text-sm font-semibold">Leave a reply</p>
        <textarea
          ref={commentRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder={user ? "Add a manufacturing question, answer, or practical note." : "Email login required to comment."}
          className="mt-3 w-full resize-none rounded-2xl border border-[#dfe3e8] p-3 outline-none focus:border-[#101216]"
        />
        {user ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {quickEmojis.map((emoji) => (
              <button key={emoji} type="button" onClick={() => appendCommentEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        {!sessionChecked ? (
          <button disabled className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white opacity-60">
            <Loader2 className="animate-spin" size={15} /> Checking login
          </button>
        ) : user ? (
          <button className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
            {busy === "comment" ? <Loader2 className="animate-spin" size={15} /> : <MessageCircle size={15} />} Comment
          </button>
        ) : (
          <EmailLogin className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
            <MessageCircle size={15} /> Email Login to Comment
          </EmailLogin>
        )}
        {message ? <p className="mt-2 text-sm text-[#8a5a00]">{message}</p> : null}
      </form>
    );
  }

  if (mode === "ready") {
    return (
      <section id="continue" className="rounded-[24px] bg-[#101216] p-6 text-white shadow-xl shadow-[#101216]/15">
        <h2 className="text-2xl font-semibold">Ready to build?</h2>
        <p className="mt-3 text-sm leading-6 text-white/72">Continue This Project sends TYORA the Idea ID, Idea URL, Title, and Customer Name.</p>
        {!sessionChecked ? (
          <button disabled className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#101216] opacity-70">
            <Loader2 className="animate-spin" size={15} /> Checking login
          </button>
        ) : user ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#101216]">
            Continue This Project →
          </a>
        ) : (
          <EmailLogin className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#101216]">
            Email Login to Continue
          </EmailLogin>
        )}
      </section>
    );
  }

  if (compact) {
    return (
      <div data-testid="compact-action-bar" className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#edf0f4] pt-3 text-sm font-semibold text-[#59616e]">
        {isOwner ? (
          <>
            <button type="button" onClick={() => setEditOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dfe3e8] bg-white px-3 text-xs transition hover:bg-[#f7f8fa]">
              <Pencil size={14} /> Edit
            </button>
            <button type="button" disabled={busy === "withdraw"} onClick={() => void withdrawIdea()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#fee2e2] bg-[#fff8f9] px-3 text-xs text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60">
              {busy === "withdraw" ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} Withdraw
            </button>
          </>
        ) : null}
        {!sessionChecked ? (
          <button disabled className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs opacity-60">
            <Loader2 className="animate-spin" size={14} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Like")} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${reactionState.liked ? "bg-[#fff1f2] text-[#be123c]" : "bg-[#f6f7fb] hover:bg-[#eef2f7]"}`}>
            {busy === "Like" ? <Loader2 className="animate-spin" size={14} /> : <Heart size={14} />} {idea.likeCount} Like
          </button>
        ) : (
          <EmailLogin className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs transition hover:bg-[#eef2f7]">
            <Heart size={14} /> {idea.likeCount} Like
          </EmailLogin>
        )}
        {!sessionChecked ? (
          <button disabled className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs opacity-60">
            <Loader2 className="animate-spin" size={14} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Interested")} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${reactionState.interested ? "bg-[#eff6ff] text-[#1d4ed8]" : "bg-[#f6f7fb] hover:bg-[#eef2f7]"}`}>
            {busy === "Interested" ? <Loader2 className="animate-spin" size={14} /> : <Star size={14} />} {idea.interestedCount} Interested
          </button>
        ) : (
          <EmailLogin className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs transition hover:bg-[#eef2f7]">
            <Star size={14} /> {idea.interestedCount} Interested
          </EmailLogin>
        )}
        <button onClick={() => navigator.share?.({ title: idea.title, url: window.location.href })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs transition hover:bg-[#eef2f7]">
          <Share2 size={14} /> Share
        </button>

        {editOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#101216]/45 px-4 backdrop-blur-sm">
            <form onSubmit={saveEdit} className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl shadow-[#101216]/25">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b93a1]">Edit discussion</p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#101216]">Update your idea</h2>
                </div>
                <button type="button" onClick={() => setEditOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#69707d]">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                <label className="grid gap-2 text-sm font-semibold text-[#101216]">Product name
                  <input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#101216]">Category
                  <input value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#101216]">Description
                  <textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows={7} className="min-h-36 resize-none rounded-2xl border border-[#dfe3e8] p-3 text-sm leading-6 outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickEmojis.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => appendEditEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setEditOpen(false)} className="h-11 rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold text-[#59616e]">Cancel</button>
                <button disabled={busy === "edit"} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white disabled:opacity-60">
                  {busy === "edit" ? <Loader2 className="animate-spin" size={15} /> : <Pencil size={15} />} Save
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isOwner ? (
        <section className="rounded-[24px] border border-[#e8ebef] bg-white p-4 shadow-sm shadow-[#101216]/4">
          <p className="text-sm font-semibold">Your discussion</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setEditOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
              <Pencil size={15} /> Edit
            </button>
            <button type="button" disabled={busy === "withdraw"} onClick={() => void withdrawIdea()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#fee2e2] bg-[#fff1f2] px-4 text-sm font-semibold text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60">
              {busy === "withdraw" ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />} Withdraw
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        {!sessionChecked ? (
          <button disabled className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold opacity-60">
            <Loader2 className="animate-spin" size={16} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Like")} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${reactionState.liked ? "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]" : "border-[#dfe3e8] bg-white hover:bg-[#f7f8fa]"}`}>
            {busy === "Like" ? <Loader2 className="animate-spin" size={16} /> : <Heart size={16} />} {reactionState.liked ? "Liked" : "Like"}
          </button>
        ) : (
          <EmailLogin className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
            <Heart size={16} /> Like
          </EmailLogin>
        )}
        {!sessionChecked ? (
          <button disabled className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold opacity-60">
            <Loader2 className="animate-spin" size={16} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Interested")} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${reactionState.interested ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#dfe3e8] bg-white hover:bg-[#f7f8fa]"}`}>
            {busy === "Interested" ? <Loader2 className="animate-spin" size={16} /> : <Star size={16} />} {reactionState.interested ? "Interested" : "Interested"}
          </button>
        ) : (
          <EmailLogin className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
            <Star size={16} /> Interested
          </EmailLogin>
        )}
        <button onClick={() => navigator.share?.({ title: idea.title, url: window.location.href })} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
          <Share2 size={16} /> Share
        </button>
      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#101216]/45 px-4 backdrop-blur-sm">
          <form onSubmit={saveEdit} className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl shadow-[#101216]/25">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b93a1]">Edit discussion</p>
                <h2 className="mt-1 text-2xl font-semibold">Update your idea</h2>
              </div>
              <button type="button" onClick={() => setEditOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#69707d]">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-semibold">Product name
                <input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Category
                <input value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">Description
                <textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows={7} className="min-h-36 resize-none rounded-2xl border border-[#dfe3e8] p-3 text-sm leading-6 outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
              </label>
              <div className="flex flex-wrap gap-2">
                {quickEmojis.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => appendEditEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setEditOpen(false)} className="h-11 rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold text-[#59616e]">Cancel</button>
              <button disabled={busy === "edit"} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white disabled:opacity-60">
                {busy === "edit" ? <Loader2 className="animate-spin" size={15} /> : <Pencil size={15} />} Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
