"use client";

import { useEffect } from "react";
import {
  COMMUNITY_SESSION_CHANNEL,
  COMMUNITY_SESSION_SYNC_KEY,
  type CommunitySessionSignal,
  emitCommunitySessionChange
} from "@/lib/client/community-session-sync";

export default function CommunitySessionSync() {
  useEffect(() => {
    let active = true;

    async function revalidateSession() {
      try {
        const response = await fetch("/api/community/session", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (!active) return;
        if (payload.user) {
          emitCommunitySessionChange("login", payload.user);
        } else {
          emitCommunitySessionChange("logout");
        }
      } catch {
        // A temporary network failure must not pretend that a valid session ended.
      }
    }

    function applySignal(signal: CommunitySessionSignal | null) {
      if (signal?.type === "logout") emitCommunitySessionChange("logout");
      void revalidateSession();
    }
    function onStorage(event: StorageEvent) {
      if (event.key !== COMMUNITY_SESSION_SYNC_KEY) return;
      try {
        applySignal(event.newValue ? JSON.parse(event.newValue) as CommunitySessionSignal : null);
      } catch {
        applySignal(null);
      }
    }
    function onPageShow() {
      void revalidateSession();
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") void revalidateSession();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onPageShow);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const channel = "BroadcastChannel" in window
      ? new BroadcastChannel(COMMUNITY_SESSION_CHANNEL)
      : null;
    if (channel) {
      channel.onmessage = (event: MessageEvent<CommunitySessionSignal>) => applySignal(event.data);
    }
    void revalidateSession();

    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onPageShow);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      channel?.close();
    };
  }, []);

  return null;
}
