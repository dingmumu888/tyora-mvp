"use client";

import { useEffect } from "react";
import {
  COMMUNITY_SESSION_SYNC_KEY,
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

    function onStorage(event: StorageEvent) {
      if (event.key === COMMUNITY_SESSION_SYNC_KEY) void revalidateSession();
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
    void revalidateSession();

    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onPageShow);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
