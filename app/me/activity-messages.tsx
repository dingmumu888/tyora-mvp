"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, Loader2, PackageCheck, Reply, Send, Star, X } from "lucide-react";
import { translateCommunityText } from "@/components/community-text";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateMyTyora, type MyTyoraKey } from "@/lib/my-tyora-i18n";
import type { PublicLanguage } from "@/lib/public-i18n";
import { communityActionHeaders } from "@/lib/client/community-action";

type ActivityFilter = "all" | "comment" | "like" | "interested" | "review";

type ActivityMessage = {
  id: string;
  type: "comment" | "like" | "interested" | "review" | "status";
  title: string;
  body: string;
  href: string;
  createdAt: string;
  ideaSlug?: string;
  parentId?: string;
};

type ReplyTarget = {
  id: string;
  label: string;
  body: string;
  slug: string;
  parentId?: string;
  private: boolean;
};

type PrivateFollowUp = {
  id: string;
  ideaId: string;
  ideaSlug: string;
  ideaTitle: string;
  body: string;
  createdAt: string;
};

const filters: { value: ActivityFilter; label: MyTyoraKey }[] = [
  { value: "all", label: "all" },
  { value: "comment", label: "comments" },
  { value: "like", label: "likes" },
  { value: "interested", label: "interestedFilter" },
  { value: "review", label: "tyora" }
];

function timeAgo(value: string, language: PublicLanguage) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 6e4));
  if (minutes < 60) return translateMyTyora(language, "minutesAgo", { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return translateMyTyora(language, "hoursAgo", { count: hours });
  return translateMyTyora(language, "daysAgo", { count: Math.round(hours / 24) });
}

function iconFor(type: ActivityMessage["type"]) {
  if (type === "comment") return Send;
  if (type === "like") return Heart;
  if (type === "interested") return Star;
  if (type === "review") return PackageCheck;
  return Bell;
}

function slugFromHref(href: string) {
  const match = href.match(/^\/ask\/([^#?]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function unreadText(value: number) {
  if (value <= 0) return "";
  return value > 99 ? "99+" : String(value);
}

export default function ActivityMessages({
  notifications,
  unreadCount,
  privateFollowUps
}: {
  notifications: ActivityMessage[];
  unreadCount: number;
  privateFollowUps: PrivateFollowUp[];
}) {
  const router = useRouter();
  const { language } = usePublicLanguage();
  const t = (key: MyTyoraKey, values?: Record<string, string | number>) => translateMyTyora(language, key, values);
  const [open, setOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [activeReply, setActiveReply] = useState<ReplyTarget | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [localPrivateFollowUps, setLocalPrivateFollowUps] = useState(privateFollowUps);
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);
  const submittingRef = useRef(false);
  const unread = unreadText(localUnreadCount);
  const counts = useMemo(() => ({
    comment: notifications.filter((item) => item.type === "comment").length,
    like: notifications.filter((item) => item.type === "like").length,
    interested: notifications.filter((item) => item.type === "interested").length,
    review: notifications.filter((item) => item.type === "review" || item.type === "status").length
  }), [notifications]);
  const visibleMessages = notifications.filter((item) => activeFilter === "all" || item.type === activeFilter || (activeFilter === "review" && item.type === "status"));
  const activePrivateFollowUps = activeReply?.private
    ? localPrivateFollowUps.filter((item) => item.ideaSlug === activeReply.slug)
    : [];

  useEffect(() => setLocalUnreadCount(unreadCount), [unreadCount]);
  useEffect(() => setLocalPrivateFollowUps(privateFollowUps), [privateFollowUps]);

  function notificationTitle(item: ActivityMessage) {
    if (item.type === "comment") {
      return t("commentedOnIdea", { name: item.title.replace(/ commented on your idea$/, "") });
    }
    if (item.type === "interested") {
      return t("interestedInIdea", { name: item.title.replace(/ is interested in$/, "") });
    }
    if (item.type === "like") {
      return t("foundHelpful", { name: item.title.replace(/ found your idea helpful$/, "") });
    }
    if (item.type === "review") return t("reviewedYourIdea");
    if (item.title === "TYORA returned your idea for changes") return t("returnedYourIdea");
    if (item.title === "TYORA removed your idea") return t("removedYourIdea");
    const status = item.title.replace(/^Your idea status is /, "");
    return t("ideaStatus", { status: translateCommunityText(language, status) });
  }

  function notificationActor(item: ActivityMessage) {
    if (item.type === "comment") return item.title.replace(/ commented on your idea$/, "");
    if (item.type === "interested") return item.title.replace(/ is interested in$/, "");
    if (item.type === "like") return item.title.replace(/ found your idea helpful$/, "");
    return "TYORA";
  }

  async function openMessages() {
    setOpen(true);
    if (localUnreadCount <= 0) return;
    try {
      const response = await fetch("/api/community/notifications/read", { method: "POST" });
      if (!response.ok) return;
      setLocalUnreadCount(0);
      window.dispatchEvent(new CustomEvent("tyora:community-notifications-read"));
    } catch {
      // Keep unread indicators visible so reopening Messages can retry.
    }
  }

  function startReply(item: ActivityMessage) {
    const slug = item.ideaSlug || slugFromHref(item.href);
    if (!slug) {
      setMessage(t("openIdeaToReply"));
      return;
    }
    setActiveReply({
      id: item.id,
      label: item.type === "review" ? t("replyToReview") : t("replyToPerson", { name: notificationActor(item) }),
      body: item.body,
      slug,
      parentId: item.parentId,
      private: item.type === "review"
    });
    setReplyBody("");
    setMessage("");
  }

  async function postReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeReply || !replyBody.trim() || submittingRef.current) return;
    const slug = activeReply.slug;
    const body = replyBody.trim();
    const signature = `${activeReply.private ? "private" : "comment"}:${slug}:${activeReply.parentId || "root"}:${body}`;
    if (idempotencyRef.current?.signature !== signature) {
      idempotencyRef.current = { signature, key: `${activeReply.private ? "private-followup" : "comment"}:${crypto.randomUUID()}` };
    }
    submittingRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(activeReply.private
        ? `/api/community/ideas/${slug}/private-followups`
        : `/api/community/ideas/${slug}/comments`, {
        method: "POST",
        headers: communityActionHeaders(activeReply.private ? `private-followup:${slug}` : `comment:${slug}`, idempotencyRef.current.key),
        body: JSON.stringify(activeReply.private ? { body } : { body, parentId: activeReply.parentId })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error("reply-failed");
      if (activeReply.private && Array.isArray(payload.data?.messages)) {
        setLocalPrivateFollowUps((current) => [
          ...current.filter((item) => item.ideaSlug !== slug),
          ...payload.data.messages.map((item: { id: string; body: string; createdAt: string }) => ({
            ...item,
            ideaId: "",
            ideaSlug: slug,
            ideaTitle: ""
          }))
        ]);
      }
      setReplyBody("");
      idempotencyRef.current = null;
      setMessage(activeReply.private ? t("privateFollowUpSent") : "");
      router.refresh();
    } catch {
      setMessage(activeReply.private ? t("unableSendPrivateFollowUp") : t("unableReply"));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div id="messages" className="mt-4 scroll-mt-24">
      <button type="button" onClick={() => void openMessages()} className={`relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${unread ? "bg-[#ff385c] text-white shadow-sm shadow-[#ff385c]/25" : "border border-[#dfe3e8] bg-white text-[#101216] hover:bg-[#f7f8fa]"}`}>
        <Bell size={16} />
        {t("messages")}
        {unread ? <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold leading-none text-[#ff385c]">{unread}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-[#101216]/35 p-3 backdrop-blur-sm sm:p-5">
          <section className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-[#dfe6ef] bg-white shadow-2xl shadow-[#101216]/24">
            <header className="border-b border-[#edf0f4] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#315fbd]">My TYORA</p>
                  <h2 className="mt-1 text-2xl font-semibold">{t("messages")}</h2>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-[#dfe3e8] text-[#69707d] transition hover:bg-[#f7f8fa]" aria-label={t("closeMessages")}>
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-1 rounded-2xl bg-[#f5f7fb] p-1">
                {filters.map((filter) => (
                  <button key={filter.value} type="button" onClick={() => setActiveFilter(filter.value)} className={`min-h-10 rounded-xl px-1 text-[11px] font-semibold transition ${activeFilter === filter.value ? "bg-white text-[#101216] shadow-sm shadow-[#101216]/5" : "text-[#69707d]"}`}>
                    {t(filter.label)}
                  </button>
                ))}
              </div>
            </header>

            {activeReply ? (
              <form onSubmit={postReply} className="border-b border-[#edf0f4] bg-[#f8fbff] p-4">
                <div className="rounded-2xl bg-white px-3 py-2 text-xs leading-5 text-[#69707d]">
                  <span className="font-semibold text-[#315fbd]">{activeReply.label}</span>
                  <span className="mt-1 line-clamp-2 block">{activeReply.body}</span>
                </div>
                {activeReply.private ? (
                  <p className="mt-2 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs leading-5 text-[#1d4ed8]">
                    {t("privateFollowUpNotice")}
                  </p>
                ) : null}
                {activePrivateFollowUps.length ? (
                  <div className="mt-3 max-h-28 overflow-y-auto rounded-2xl border border-[#e4e8ef] bg-white p-3">
                    <p className="text-xs font-semibold text-[#101216]">{t("privateFollowUpHistory")}</p>
                    <div className="mt-2 space-y-2">
                      {activePrivateFollowUps.map((followUp) => (
                        <div key={followUp.id} className="rounded-xl bg-[#f7f8fa] px-3 py-2 text-xs leading-5 text-[#59616e]">
                          <p className="whitespace-pre-wrap">{followUp.body}</p>
                          <p className="mt-1 text-[11px] text-[#8b93a1]">{timeAgo(followUp.createdAt, language)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <textarea value={replyBody} onChange={(event) => { setReplyBody(event.target.value); setMessage(""); }} rows={3} placeholder={t("writeReply")} className="mt-3 w-full resize-none rounded-2xl border border-[#dfe3e8] bg-white p-3 text-sm outline-none focus:border-[#2563eb]" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => { setActiveReply(null); setReplyBody(""); setMessage(""); idempotencyRef.current = null; }} className="h-9 rounded-full border border-[#dfe3e8] bg-white px-4 text-xs font-semibold text-[#59616e]">{t("cancel")}</button>
                  <button disabled={busy || !replyBody.trim()} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#101216] px-4 text-xs font-semibold text-white disabled:opacity-60">
                    {busy ? <Loader2 className="animate-spin" size={13} /> : <Reply size={13} />} {t("reply")}
                  </button>
                </div>
                {message ? <p className={`mt-3 rounded-2xl px-4 py-3 text-sm ${message === t("privateFollowUpSent") ? "bg-[#ecfdf3] text-[#027a48]" : "bg-[#fff7ed] text-[#9a3412]"}`}>{message}</p> : null}
              </form>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-[#69707d]">
                <span className="rounded-2xl bg-[#f7f8fa] p-2">{t("commentCount", { count: counts.comment })}</span>
                <span className="rounded-2xl bg-[#f7f8fa] p-2">{t("likeCount", { count: counts.like })}</span>
                <span className="rounded-2xl bg-[#f7f8fa] p-2">{t("buyCount", { count: counts.interested })}</span>
                <span className="rounded-2xl bg-[#f7f8fa] p-2">{counts.review} TYORA</span>
              </div>
              <div className="mt-3 space-y-2">
                {visibleMessages.length ? visibleMessages.map((item) => {
                  const Icon = iconFor(item.type);
                  const canReply = item.type === "comment" || item.type === "review";
                  return (
                    <article key={item.id} className="rounded-[18px] border border-[#e4e8ef] bg-[#fbfcfe] p-4">
                      <div className="flex gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f2f7ff] text-[#315fbd]">
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#101216]">{notificationTitle(item)}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#59616e]">{translateCommunityText(language, item.body)}</p>
                          <p className="mt-1 text-xs text-[#8b93a1]">{timeAgo(item.createdAt, language)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {canReply ? (
                              <button type="button" onClick={() => startReply(item)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#101216] px-3 text-xs font-semibold text-white">
                                <Reply size={13} /> {t("reply")}
                              </button>
                            ) : null}
                            <a href={item.href} className="inline-flex h-8 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-xs font-semibold text-[#59616e]">
                              {t("open")}
                            </a>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }) : (
                  <p className="rounded-[18px] border border-dashed border-[#cfd8e6] bg-white/80 p-5 text-sm font-semibold text-[#69707d]">{t("noMessages")}</p>
                )}
              </div>
            </div>

          </section>
        </div>
      ) : null}
    </div>
  );
}
