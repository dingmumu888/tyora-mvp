"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, CheckCircle2, Loader2, X } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";

export type CommunitySessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  profileCompleted?: boolean;
};

type CommunityProfileModalProps = {
  open: boolean;
  user: CommunitySessionUser | null;
  mode?: "setup" | "edit";
  onClose: () => void;
  onSaved?: (user: CommunitySessionUser) => void;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read avatar."));
    reader.readAsDataURL(file);
  });
}

export default function CommunityProfileModal({ open, user, mode = "setup", onClose, onSaved }: CommunityProfileModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const titleId = useMemo(() => `tyora-profile-${mode}`, [mode]);

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name || "");
    setUsername(user.username || "");
    setBio(user.bio || "");
    setAvatar(user.avatar || "");
    setMessage("");
    window.setTimeout(() => nameRef.current?.focus(), 80);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onClose, open]);

  async function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file.");
      return;
    }
    setAvatar(await fileToDataUrl(file));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/session", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, username, bio, avatar })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to save profile.");
      window.dispatchEvent(new CustomEvent("tyora:community-profile-updated", { detail: { user: payload.user } }));
      onSaved?.(payload.user);
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !user) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] grid min-h-dvh place-items-center overflow-y-auto bg-[#101216]/42 p-4 text-[#101216] backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      role="presentation"
    >
      <section className="relative w-[calc(100vw-32px)] max-w-[520px] rounded-[30px] border border-white/70 bg-white p-6 shadow-[0_24px_90px_rgba(16,18,22,0.24)] ring-1 ring-[#101216]/5 sm:p-7" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" onClick={onClose} disabled={busy} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#59616e] transition hover:bg-[#f6f7fb]" aria-label="Close profile setup">
          <X size={17} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101216] text-sm font-semibold text-white">TY</div>
          <div>
            <p className="text-sm font-semibold">TYORA</p>
            <p className="text-xs font-medium text-[#8b93a1]">Product creator community</p>
          </div>
        </div>

        <div className="mt-7">
          <h2 id={titleId} className="text-3xl font-semibold tracking-normal">Set up your TYORA profile</h2>
          <p className="mt-3 text-sm leading-6 text-[#59616e]">Help other founders know who they&apos;re talking to.</p>
        </div>

        <form onSubmit={saveProfile} className="mt-6 grid gap-4">
          <div className="flex items-center gap-4">
            <CommunityAvatar name={name || user.email} src={avatar} className="size-16 text-lg" />
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#59616e] transition hover:bg-[#f6f7fb]">
              <Camera size={16} /> Upload avatar
              <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Display name
            <input ref={nameRef} required value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-2xl border border-[#dfe3e8] bg-white px-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" placeholder="Adam Chen" />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Username
            <input required value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 rounded-2xl border border-[#dfe3e8] bg-white px-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" placeholder="adam-founder" />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Short bio <span className="font-normal text-[#8b93a1]">optional</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} maxLength={180} className="resize-none rounded-2xl border border-[#dfe3e8] bg-white px-3 py-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" placeholder="Building travel-friendly accessories." />
          </label>

          {message ? <p className="rounded-2xl bg-[#fff7ed] px-3 py-2 text-sm text-[#9a3412]">{message}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {mode === "setup" ? (
              <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-full px-4 text-sm font-semibold text-[#69707d] transition hover:bg-[#f6f7fb]">Maybe later</button>
            ) : <span />}
            <button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white shadow-sm shadow-[#101216]/20 transition hover:bg-[#1f2329] disabled:opacity-60">
              {busy ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Save profile
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
