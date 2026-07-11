"use client";

import { FormEvent, useEffect, useState } from "react";
import { Heart, Loader2, MessageCircle, Reply, Trash2 } from "lucide-react";
import { CommunityComment } from "@/lib/community";
import CommunityAvatar from "@/components/community-avatar";
import EmailLogin from "@/components/email-login";

type SessionUser = { id: string; name: string; email: string; username: string };

function timeLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function IdeaComments({ slug, comments }: { slug: string; comments: CommunityComment[] }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [likingId, setLikingId] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommunityComment | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);
  const topLevelComments = comments.filter((comment) => !comment.parentId);
  const repliesByParent = comments.reduce<Record<string, CommunityComment[]>>((groups, comment) => {
    if (!comment.parentId) return groups;
    groups[comment.parentId] = [...(groups[comment.parentId] || []), comment];
    return groups;
  }, {});
  const visibleComments = expanded ? topLevelComments : topLevelComments.slice(0, 5);

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

  async function deleteComment(comment: CommunityComment) {
    const confirmed = window.confirm("Delete this comment?\n\nThis cannot be undone from the public page.");
    if (!confirmed) return;
    setDeletingId(comment.id);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${slug}/comments/${comment.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to delete comment.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete comment.");
    } finally {
      setDeletingId("");
    }
  }

  async function likeComment(comment: CommunityComment) {
    if (!sessionChecked) return;
    if (!user) {
      setMessage("Email login is required to like comments.");
      return;
    }
    setLikingId(comment.id);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${slug}/comments/${comment.id}`, { method: "PATCH" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to like comment.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to like comment.");
    } finally {
      setLikingId("");
    }
  }

  async function postReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionChecked) return;
    if (!user || !replyingTo) {
      setMessage("Email login is required to reply.");
      return;
    }
    setReplyBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${slug}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: replyBody, parentId: replyingTo.parentId || replyingTo.id })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to reply.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reply.");
    } finally {
      setReplyBusy(false);
    }
  }

  function CommentCard({ comment, isReply = false }: { comment: CommunityComment; isReply?: boolean }) {
    const canDelete = user?.id === comment.author.id;
    return (
      <article className={`rounded-2xl border border-[#eef1f4] bg-[#fbfbfc] p-3 ${isReply ? "ml-7 border-l-2 border-l-[#bfdbfe]" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
            <CommunityAvatar name={comment.author.name} src={comment.author.avatar} className="size-7 border-0 text-[10px]" />
            <span className="truncate">{comment.author.name}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b93a1]">{timeLabel(comment.createdAt)}</span>
            {canDelete ? (
              <button type="button" disabled={deletingId === comment.id} onClick={() => void deleteComment(comment)} className="inline-flex size-8 items-center justify-center rounded-full border border-[#fee2e2] bg-[#fff1f2] text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60" aria-label="Delete comment">
                {deletingId === comment.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{comment.body}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#69707d]">
          {!sessionChecked ? (
            <button disabled className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-2.5 opacity-60">
              <Loader2 className="animate-spin" size={13} /> Checking
            </button>
          ) : user ? (
            <button type="button" onClick={() => void likeComment(comment)} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition ${comment.viewerLiked ? "bg-[#fff1f2] text-[#be123c]" : "bg-white hover:bg-[#eef2f7]"}`}>
              {likingId === comment.id ? <Loader2 className="animate-spin" size={13} /> : <Heart size={13} />} {comment.likeCount} Like
            </button>
          ) : (
            <EmailLogin className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-2.5 transition hover:bg-[#eef2f7]">
              <Heart size={13} /> {comment.likeCount} Like
            </EmailLogin>
          )}
          <button type="button" onClick={() => {
            setReplyingTo(comment);
            setReplyBody("");
          }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-2.5 transition hover:bg-[#eef2f7]">
            <Reply size={13} /> Reply
          </button>
        </div>
      </article>
    );
  }

  return (
    <section id="community-discussion" className="rounded-[20px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Community Discussion</h2>
        <span className="inline-flex items-center gap-1 text-sm text-[#69707d]"><MessageCircle size={15} /> {comments.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {comments.length === 0 ? <p className="rounded-2xl bg-[#f7f8fa] p-4 text-sm text-[#69707d]">No public comments yet.</p> : null}
        {visibleComments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <CommentCard comment={comment} />
            {(repliesByParent[comment.id] || []).map((reply) => (
              <CommentCard key={reply.id} comment={reply} isReply />
            ))}
          </div>
        ))}
      </div>
      {replyingTo ? (
        <form onSubmit={postReply} className="mt-4 rounded-2xl border border-[#dfe7f3] bg-[#f8fbff] p-3">
          <div className="rounded-xl bg-white px-3 py-2 text-xs leading-5 text-[#69707d]">
            <span className="font-semibold text-[#315fbd]">Replying to {replyingTo.author.name}</span>
            <span className="mt-1 line-clamp-2 block">“{replyingTo.body}”</span>
          </div>
          <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} rows={3} placeholder="Write a reply..." className="mt-3 w-full resize-none rounded-2xl border border-[#dfe3e8] bg-white p-3 text-sm outline-none focus:border-[#2563eb]" />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setReplyingTo(null)} className="h-9 rounded-full border border-[#dfe3e8] px-4 text-xs font-semibold text-[#59616e]">Cancel</button>
            {!sessionChecked ? (
              <button disabled className="inline-flex h-9 items-center gap-2 rounded-full bg-[#101216] px-4 text-xs font-semibold text-white opacity-60">
                <Loader2 className="animate-spin" size={13} /> Checking
              </button>
            ) : user ? (
              <button disabled={replyBusy || !replyBody.trim()} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#101216] px-4 text-xs font-semibold text-white disabled:opacity-60">
                {replyBusy ? <Loader2 className="animate-spin" size={13} /> : <Reply size={13} />} Reply
              </button>
            ) : (
              <EmailLogin className="inline-flex h-9 items-center gap-2 rounded-full bg-[#101216] px-4 text-xs font-semibold text-white">
                Email Login
              </EmailLogin>
            )}
          </div>
        </form>
      ) : null}
      {!expanded && topLevelComments.length > 5 ? (
        <button type="button" onClick={() => setExpanded(true)} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full border border-[#dfe3e8] bg-white text-sm font-semibold text-[#2563eb]">
          View more comments
        </button>
      ) : null}
      {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
    </section>
  );
}
