"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Heart, Loader2, MessageCircle, Share2, Star } from "lucide-react";
import { CommunityIdea } from "@/lib/community";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import EmailLogin from "@/components/email-login";

type SessionUser = { id: string; name: string; email: string; username: string };

export default function IdeaActions({ idea }: { idea: CommunityIdea }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/community/session")
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

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

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  return (
    <div id="continue" className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-3">
        {user ? (
          <button onClick={() => void react("Like")} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
            {busy === "Like" ? <Loader2 className="animate-spin" size={16} /> : <Heart size={16} />} Like
          </button>
        ) : (
          <EmailLogin className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
            <Heart size={16} /> Like
          </EmailLogin>
        )}
        {user ? (
          <button onClick={() => void react("Interested")} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
            {busy === "Interested" ? <Loader2 className="animate-spin" size={16} /> : <Star size={16} />} Interested
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

      <form onSubmit={postComment} className="rounded-[24px] border border-[#e8ebef] bg-white p-5 shadow-sm shadow-[#101216]/4">
        <p className="text-sm font-semibold">Community Discussion</p>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder={user ? "Add a manufacturing question, answer, or practical note." : "Email login required to comment."}
          className="mt-3 w-full resize-none rounded-2xl border border-[#dfe3e8] p-3 outline-none focus:border-[#101216]"
        />
        {user ? (
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

      <section className="rounded-[24px] bg-[#101216] p-6 text-white shadow-xl shadow-[#101216]/15">
        <h2 className="text-2xl font-semibold">Ready to build?</h2>
        <p className="mt-3 text-sm leading-6 text-white/72">Continue This Project sends TYORA the Idea ID, Idea URL, Title, and Customer Name.</p>
        {user ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#101216]">
            Continue This Project →
          </a>
        ) : (
          <EmailLogin className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#101216]">
            Email Login to Continue
          </EmailLogin>
        )}
      </section>
    </div>
  );
}
