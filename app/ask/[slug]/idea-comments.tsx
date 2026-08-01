"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Loader2,
  MessageCircle,
  Pin,
  Reply,
  Send,
  Sparkles,
  ThumbsUp,
  Trash2
} from "lucide-react";
import { CommunityComment, TyoraReview } from "@/lib/community";
import CommunityAvatar from "@/components/community-avatar";
import EmailLogin from "@/components/email-login";
import { communityActionHeaders } from "@/lib/client/community-action";
import { IdeaRelativeTime, useIdeaDetailText } from "./idea-detail-text";

type SessionUser = { id: string; name: string; email: string; username: string };
type SortMode = "helpful" | "latest" | "tyora";

export default function IdeaComments({
  slug,
  comments,
  review,
  reviewDetails,
  reviewAction
}: {
  slug: string;
  comments: CommunityComment[];
  review?: TyoraReview;
  reviewDetails: Array<{ label: string; value: string }>;
  reviewAction?: { href: string; label: string };
}) {
  const t = useIdeaDetailText();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [likingId, setLikingId] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommunityComment | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState<SortMode>("helpful");

  const repliesByParent = useMemo(() => comments.reduce<Record<string, CommunityComment[]>>((groups, comment) => {
    if (!comment.parentId) return groups;
    groups[comment.parentId] = [...(groups[comment.parentId] || []), comment]
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    return groups;
  }, {}), [comments]);

  const sortedComments = useMemo(() => {
    const topLevel = comments.filter((comment) => !comment.parentId);
    const filtered = sort === "tyora" ? topLevel.filter((comment) => comment.author.expertVerified) : topLevel;
    return [...filtered].sort((left, right) => {
      if (sort === "latest" || sort === "tyora") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
      return right.helpfulCount - left.helpfulCount ||
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [comments, sort]);

  const visibleComments = expanded ? sortedComments : sortedComments.slice(0, 5);

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
    if (!window.confirm(`${t("delete")}?\n\nThis cannot be undone.`)) return;
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

  async function markCommentHelpful(comment: CommunityComment) {
    if (!sessionChecked) return;
    if (!user) {
      setMessage(t("loginToComment"));
      return;
    }
    setLikingId(comment.id);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${slug}/comments/${comment.id}`, {
        method: "PATCH",
        headers: communityActionHeaders(`comment-reaction:${comment.id}`)
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to update helpful vote.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update helpful vote.");
    } finally {
      setLikingId("");
    }
  }

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionChecked || !body.trim()) return;
    if (!user) {
      setMessage(t("loginToComment"));
      return;
    }
    setBusy("comment");
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${slug}/comments`, {
        method: "POST",
        headers: communityActionHeaders(`comment:${slug}`),
        body: JSON.stringify({ body })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to comment.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to comment.");
    } finally {
      setBusy("");
    }
  }

  async function postReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionChecked || !replyingTo || !replyBody.trim()) return;
    if (!user) {
      setMessage(t("loginToComment"));
      return;
    }
    setBusy("reply");
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${slug}/comments`, {
        method: "POST",
        headers: communityActionHeaders(`reply:${replyingTo.id}`),
        body: JSON.stringify({ body: replyBody, parentId: replyingTo.parentId || replyingTo.id })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to reply.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reply.");
    } finally {
      setBusy("");
    }
  }

  function CommentCard({ comment, isReply = false }: { comment: CommunityComment; isReply?: boolean }) {
    const canDelete = user?.id === comment.author.id;
    return (
      <article className={`relative py-4 ${isReply ? "ml-8 border-l-2 border-[#dbeafe] pl-4 sm:ml-12" : "border-b border-[#e8edf4]"}`}>
        <div className="flex gap-3">
          <Link href={`/creator/${encodeURIComponent(comment.author.id)}`} className="shrink-0 rounded-full outline-none transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#155eef]/20" aria-label={`View ${comment.author.name}'s profile`}>
            <CommunityAvatar name={comment.author.name} src={comment.author.avatar} className="size-9 border-0 text-[11px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/creator/${encodeURIComponent(comment.author.id)}`} className="truncate text-sm font-bold text-[#0b1426] underline-offset-4 hover:text-[#155eef] hover:underline">{comment.author.name}</Link>
              {comment.author.expertVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f4] px-2 py-0.5 text-[10px] font-bold text-[#06756f]">
                  <BadgeCheck size={11} /> {comment.author.expertRole || t("verified")}
                </span>
              ) : null}
              <span className="text-xs text-[#8b93a1]">· <IdeaRelativeTime value={comment.createdAt} /></span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#475467]">{comment.body}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs font-semibold text-[#667085]">
              {!sessionChecked ? (
                <button disabled className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 opacity-60">
                  <Loader2 className="animate-spin" size={13} /> {t("checking")}
                </button>
              ) : user ? (
                <button type="button" onClick={() => void markCommentHelpful(comment)} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition ${comment.viewerHelpful || comment.viewerLiked ? "bg-[#e8f0ff] text-[#155eef]" : "hover:bg-[#eef2f7]"}`}>
                  {likingId === comment.id ? <Loader2 className="animate-spin" size={13} /> : <ThumbsUp size={13} />} {comment.helpfulCount} {t("helpful")}
                </button>
              ) : (
                <EmailLogin className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition hover:bg-[#eef2f7]">
                  <ThumbsUp size={13} /> {comment.helpfulCount} {t("helpful")}
                </EmailLogin>
              )}
              <button type="button" onClick={() => {
                setReplyingTo(comment);
                setReplyBody("");
              }} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 transition hover:bg-[#eef2f7]">
                <Reply size={13} /> {t("reply")}
              </button>
              {canDelete ? (
                <button type="button" disabled={deletingId === comment.id} onClick={() => void deleteComment(comment)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[#be123c] transition hover:bg-[#fff1f2] disabled:opacity-60">
                  {deletingId === comment.id ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />} {t("delete")}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {replyingTo?.id === comment.id ? (
          <form onSubmit={postReply} className="ml-12 mt-3 rounded-2xl border border-[#d8dee8] bg-white p-3">
            <textarea
              autoFocus
              required
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={3}
              placeholder={t("replyPlaceholder")}
              className="w-full resize-none bg-transparent text-sm leading-6 outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setReplyingTo(null)} className="h-9 rounded-full px-4 text-xs font-semibold text-[#667085]">{t("cancel")}</button>
              <button disabled={busy === "reply"} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#0b1426] px-4 text-xs font-semibold text-white disabled:opacity-60">
                {busy === "reply" ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />} {t("postReply")}
              </button>
            </div>
          </form>
        ) : null}
      </article>
    );
  }

  return (
    <section id="discussion" className="overflow-hidden rounded-[22px] border border-[#d8dee8] bg-white shadow-sm shadow-[#0b1426]/5">
      <form id="discussion-composer" onSubmit={postComment} className="border-b border-[#d8dee8] p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-[#155eef]" />
          <h2 className="text-lg font-bold text-[#0b1426]">{t("joinDiscussion")}</h2>
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[#d8dee8] bg-[#fbfcfe] p-3 focus-within:border-[#93b4f8] focus-within:ring-4 focus-within:ring-[#2563eb]/8">
          {user ? <CommunityAvatar name={user.name} className="size-9 shrink-0 border-0 text-[11px]" /> : <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f0ff] text-[#155eef]"><MessageCircle size={16} /></span>}
          <textarea
            ref={composerRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder={user ? t("joinPlaceholder") : t("loginToComment")}
            className="min-h-20 min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 outline-none"
          />
        </div>
        <div className="mt-3 flex justify-end">
          {!sessionChecked ? (
            <button disabled className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b1426] px-5 text-sm font-semibold text-white opacity-60">
              <Loader2 className="animate-spin" size={15} /> {t("checking")}
            </button>
          ) : user ? (
            <button disabled={busy === "comment" || !body.trim()} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1565f9] px-5 text-sm font-semibold text-white transition hover:bg-[#0b55de] disabled:opacity-45">
              {busy === "comment" ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />} {t("publish")}
            </button>
          ) : (
            <EmailLogin className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b1426] px-5 text-sm font-semibold text-white">
              <MessageCircle size={15} /> {t("joinDiscussion")}
            </EmailLogin>
          )}
        </div>
      </form>

      <div className="flex overflow-x-auto border-b border-[#d8dee8] px-3 pt-2 sm:px-5">
        {([
          ["helpful", t("mostHelpful")],
          ["latest", t("latest")],
          ["tyora", t("tyoraReplies")]
        ] as Array<[SortMode, string]>).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setSort(value);
              setExpanded(false);
            }}
            className={`relative whitespace-nowrap px-3 py-3 text-sm font-semibold ${sort === value ? "text-[#155eef] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[#155eef]" : "text-[#667085]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-5">
        <article className="my-4 rounded-[18px] border border-[#79d8ce] bg-[#f0fdfa] p-4 shadow-sm shadow-[#14b8a6]/8">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0f766e] text-white"><Sparkles size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#0b1426]">{t("tyoraTeam")}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#06756f] ring-1 ring-[#bcebe4]"><BadgeCheck size={11} /> {t("verified")}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#d8f3ee] px-2 py-0.5 text-[10px] font-bold text-[#06756f]"><Pin size={10} /> {t("pinned")}</span>
                {review?.publishedAt ? <span className="text-xs text-[#6b817f]">· <IdeaRelativeTime value={review.publishedAt} /></span> : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[#23403d]">
                {review?.additionalNotes || t("expertPending")}
              </p>
              {review && reviewDetails.length > 0 ? (
                <details className="mt-3 rounded-xl border border-[#ccefe9] bg-white/78 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#06756f]">{t("assessmentDetails")}</summary>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    {reviewDetails.map((item) => (
                      <div key={item.label} className="rounded-xl bg-[#f7fbfa] p-3">
                        <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#0f766e]">{item.label}</dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#344054]">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {review.disclaimer ? <p className="mt-3 text-xs leading-5 text-[#7c5a16]">{review.disclaimer}</p> : null}
                  {reviewAction ? <Link href={reviewAction.href} className="mt-3 inline-flex h-10 items-center rounded-full bg-[#0b1426] px-4 text-sm font-semibold text-white">{reviewAction.label}</Link> : null}
                </details>
              ) : null}
            </div>
          </div>
        </article>

        {visibleComments.length > 0 ? (
          visibleComments.map((comment) => (
            <div key={comment.id}>
              <CommentCard comment={comment} />
              {(repliesByParent[comment.id] || []).map((reply) => <CommentCard key={reply.id} comment={reply} isReply />)}
            </div>
          ))
        ) : (
          <p className="border-t border-[#eef1f4] py-8 text-center text-sm text-[#8b93a1]">{t("noComments")}</p>
        )}

        {sortedComments.length > 5 ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="mx-auto my-4 flex h-10 items-center gap-2 rounded-full border border-[#d8dee8] px-4 text-sm font-semibold text-[#475467] transition hover:bg-[#f7f9fc]">
            {expanded ? t("showLess") : t("viewMore")} <ChevronDown size={15} className={expanded ? "rotate-180" : ""} />
          </button>
        ) : null}
        {message ? <p className="mb-4 rounded-xl bg-[#fff7ed] px-3 py-2 text-sm text-[#9a3412]">{message}</p> : null}
      </div>
    </section>
  );
}
