"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { CommunityComment } from "@/lib/community";
import CommunityAvatar from "@/components/community-avatar";

type SessionUser = { id: string; name: string; email: string; username: string };

function timeLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function IdeaComments({ slug, comments }: { slug: string; comments: CommunityComment[] }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    function refreshSession() {
      fetch("/api/community/session")
        .then((response) => response.json())
        .then((data) => setUser(data.user || null))
        .catch(() => setUser(null));
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

  return (
    <section id="community-discussion" className="rounded-[18px] border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Community Discussion</h2>
        <span className="inline-flex items-center gap-1 text-sm text-[#69707d]"><MessageCircle size={15} /> {comments.length}</span>
      </div>
      <div className="mt-5 space-y-3">
        {comments.length === 0 ? <p className="rounded-2xl bg-[#f7f8fa] p-4 text-sm text-[#69707d]">No public comments yet.</p> : null}
        {comments.map((comment) => {
          const canDelete = user?.id === comment.author.id;
          return (
            <article key={comment.id} className={`rounded-2xl border border-[#eef1f4] bg-[#fbfbfc] p-4 ${comment.parentId ? "ml-6" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold"><CommunityAvatar name={comment.author.name} src={comment.author.avatar} className="size-7 border-0 text-[10px]" /> {comment.author.name}</p>
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
              <p className="mt-3 text-xs text-[#69707d]">{comment.likeCount} likes</p>
            </article>
          );
        })}
      </div>
      {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
    </section>
  );
}
