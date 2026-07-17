"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, MessageCircle, Share2, Smartphone, X } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { communityActionHeaders } from "@/lib/client/community-action";

type SharePlatform = "facebook" | "x" | "linkedin" | "whatsapp" | "copy" | "native";

type IdeaSharePanelProps = {
  open: boolean;
  ideaId: string;
  ideaSlug: string;
  ideaTitle: string;
  onClose: () => void;
};

function sharePath(ideaSlug: string, platform: SharePlatform) {
  return `/ask/${ideaSlug}?share=${platform}`;
}

function isShareCancellation(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && (error as { name?: unknown }).name === "AbortError";
}

export default function IdeaSharePanel({ open, ideaId, ideaSlug, ideaTitle, onClose }: IdeaSharePanelProps) {
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function manageDialogKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === firstElement || !dialogRef.current.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !dialogRef.current.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", manageDialogKeyboard);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", manageDialogKeyboard);
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  const ideaUrl = new URL(`/ask/${ideaSlug}`, window.location.origin).toString();
  const encodedUrl = encodeURIComponent(ideaUrl);
  const encodedTitle = encodeURIComponent(ideaTitle);
  const platforms = [
    {
      id: "facebook" as const,
      label: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      mark: "f"
    },
    {
      id: "x" as const,
      label: "X",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      mark: "X"
    },
    {
      id: "linkedin" as const,
      label: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      mark: "in"
    },
    {
      id: "whatsapp" as const,
      label: "WhatsApp",
      url: `https://wa.me/?text=${encodeURIComponent(`${ideaTitle} ${ideaUrl}`)}`,
      mark: "WA"
    }
  ];

  function recordShare(platform: SharePlatform) {
    trackAnalyticsEvent("idea_share", sharePath(ideaSlug, platform));
    void fetch(`/api/community/ideas/${ideaSlug}/share`, {
      method: "POST",
      headers: communityActionHeaders(`share:${ideaId}:${platform}`),
      body: JSON.stringify({ channel: platform })
    }).catch(() => undefined);
  }

  function openPlatform(platform: (typeof platforms)[number]) {
    recordShare(platform.id);
    window.open(platform.url, "_blank", "noopener,noreferrer");
  }

  async function copyIdeaLink(record = true) {
    if (record) recordShare("copy");
    try {
      await navigator.clipboard.writeText(ideaUrl);
      setMessage("Link copied");
    } catch {
      const input = document.createElement("textarea");
      try {
        input.value = ideaUrl;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        setMessage(copied ? "Link copied" : "Copy this link from your browser address bar.");
      } catch {
        setMessage("Copy this link from your browser address bar.");
      } finally {
        input.remove();
      }
    }
  }

  async function openNativeShare() {
    recordShare("native");
    if (!navigator.share) {
      await copyIdeaLink(false);
      return;
    }
    try {
      await navigator.share({ title: ideaTitle, url: ideaUrl });
      setMessage("Shared");
    } catch (error) {
      if (isShareCancellation(error)) return;
      await copyIdeaLink(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-[#101216]/50 px-3 backdrop-blur-sm sm:items-center sm:justify-center"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-share-title"
        className="w-full rounded-t-[24px] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-[24px] sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-[#2563eb]">Share this idea</p>
            <h2 id="idea-share-title" className="mt-1 line-clamp-2 text-xl font-semibold text-[#101216]">{ideaTitle}</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close share options" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dfe3e8] text-[#59616e] transition hover:bg-[#f5f6f8]">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {platforms.map((platform) => (
            <button key={platform.id} type="button" onClick={() => openPlatform(platform)} className="flex h-12 items-center gap-3 rounded-xl border border-[#dfe3e8] px-3 text-sm font-semibold text-[#101216] transition hover:border-[#93c5fd] hover:bg-[#f4f8ff]">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#101216] text-[11px] font-bold text-white">{platform.mark}</span>
              <span>{platform.label}</span>
              <ExternalLink size={14} className="ml-auto text-[#8b93a1]" />
            </button>
          ))}
          <button type="button" onClick={() => void copyIdeaLink()} className="flex h-12 items-center gap-3 rounded-xl border border-[#dfe3e8] px-3 text-sm font-semibold text-[#101216] transition hover:border-[#93c5fd] hover:bg-[#f4f8ff]">
            <Copy size={18} className="text-[#2563eb]" /> Copy link
          </button>
          <button type="button" onClick={() => void openNativeShare()} className="flex h-12 items-center gap-3 rounded-xl border border-[#dfe3e8] px-3 text-sm font-semibold text-[#101216] transition hover:border-[#93c5fd] hover:bg-[#f4f8ff]">
            <Smartphone size={18} className="text-[#0f766e]" /> More apps
          </button>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#f4f6f8] px-3 py-2.5 text-xs leading-5 text-[#59616e]">
          <MessageCircle size={15} className="mt-0.5 shrink-0" />
          <p>Use More apps to share through Instagram or another installed app when your device supports it.</p>
        </div>
        {message ? <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e]"><Share2 size={15} /> {message}</p> : null}
      </section>
    </div>
  );
}
