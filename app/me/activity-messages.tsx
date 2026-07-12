"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bell, Heart, Loader2, MessageCircle, PackageCheck, Reply, Send, Star, X } from "lucide-react";

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
};

const filters: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "comment", label: "Comments" },
  { value: "like", label: "Likes" },
  { value: "interested", label: "Interested" },
  { value: "review", label: "TYORA" }
];

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 6e4));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
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

export default function ActivityMessages({ notifications, unreadCount }: { notifications: ActivityMessage[]; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [activeReply, setActiveReply] = useState<ReplyTarget | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const unread = unreadText(localUnreadCount);
  const counts = useMemo(() => ({
    comment: notifications.filter((item) => item.type === "comment").length,
    like: notifications.filter((item) => item.type === "like").length,
    interested: notifications.filter((item) => item.type === "interested").length,
    review: notifications.filter((item) => item.type === "review").length
  }), [notifications]);
  const visibleMessages = notifications.filter((item) => activeFilter === "all" || item.type === activeFilter);

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
      setMessage("Open the idea page to reply to this message.");
      return;
    }
    setActiveReply({
      id: item.id,
      label: item.type === "review" ? "Replying to TYORA review" : `Replying to ${item.title}`,
      body: item.body,
      slug,
      parentId: item.parentId
    });
    setReplyBody("");
    setMessage("");
  }

  async function postReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeReply || !replyBody.trim()) return;
    const slug = activeReply.slug;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${slug}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: replyBody, parentId: activeReply.parentId })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to reply.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="messages" className="mt-4 scroll-mt-24">
      <button type="button" onClick={() => void openMessages()} className={`relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${unread ? "bg-[#ff385c] text-white shadow-sm shadow-[#ff385c]/25" : "border border-[#dfe3e8] bg-white text-[#101216] hover:bg-[#f7f8fa]"}`}>
        <Bell size={16} />
        Messages
        {unread ? <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold leading-none text-[#ff385c]">{unread}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-[#101216]/35 p-3 backdrop-blur-sm sm:p-5">
          <section className="mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-[#dfe6ef] bg-white shadow-2xl shadow-[#101216]/24">
            <header className="border-b border-[#edf0f4] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#315fbd]">My TYORA</p>
                  <h2 className="mt-1 text-2xl font-semibold">Messages</h2>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-[#dfe3e8] text-[#69707d] transition hover:bg-[#f7f8fa]" aria-label="Close messages">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-1 rounded-2xl bg-[#f5f7fb] p-1">
                {filters.map((filter) => (
                  <button key={filter.value} type="button" onClick={() => setActiveFilter(filter.value)} className={`min-h-10 rounded-xl px-1 text-[11px] font-semibold transition ${activeFilter === filter.value ? "bg-white text-[#101216] shadow-sm shadow-[#101216]/5" : "text-[#69707d]"}`}>
                    {filter.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-[#69707d]">
                <span className="rounded-2xl bg-[#f7f8fa] p-2">{counts.comment} comments</span>
                <span className="rounded-2xl bg-[#f7f8fa] p-2">{counts.like} likes</span>
                <span className="rounded-2xl bg-[#f7f8fa] p-2">{counts.interested} buy</span>
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
                          <p className="text-sm font-semibold text-[#101216]">{item.title}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-[#59616e]">{item.body}</p>
                          <p className="mt-1 text-xs text-[#8b93a1]">{timeAgo(item.createdAt)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {canReply ? (
                              <button type="button" onClick={() => startReply(item)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#101216] px-3 text-xs font-semibold text-white">
                                <Reply size={13} /> Reply
                              </button>
                            ) : null}
                            <a href={item.href} className="inline-flex h-8 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-xs font-semibold text-[#59616e]">
                              Open
                            </a>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }) : (
                  <p className="rounded-[18px] border border-dashed border-[#cfd8e6] bg-white/80 p-5 text-sm font-semibold text-[#69707d]">No messages in this view.</p>
                )}
              </div>
            </div>

            {activeReply ? (
              <form onSubmit={postReply} className="border-t border-[#edf0f4] bg-[#f8fbff] p-4">
                <div className="rounded-2xl bg-white px-3 py-2 text-xs leading-5 text-[#69707d]">
                  <span className="font-semibold text-[#315fbd]">{activeReply.label}</span>
                  <span className="mt-1 line-clamp-2 block">{activeReply.body}</span>
                </div>
                <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} rows={3} placeholder="Write a reply" className="mt-3 w-full resize-none rounded-2xl border border-[#dfe3e8] bg-white p-3 text-sm outline-none focus:border-[#2563eb]" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setActiveReply(null)} className="h-9 rounded-full border border-[#dfe3e8] bg-white px-4 text-xs font-semibold text-[#59616e]">Cancel</button>
                  <button disabled={busy || !replyBody.trim()} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#101216] px-4 text-xs font-semibold text-white disabled:opacity-60">
                    {busy ? <Loader2 className="animate-spin" size={13} /> : <Reply size={13} />} Reply
                  </button>
                </div>
                {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
