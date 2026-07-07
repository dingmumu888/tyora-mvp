"use client";

import { useCallback, useEffect, useState } from "react";
import CommunityProfileModal, { CommunitySessionUser } from "@/components/community-profile-modal";

const SKIP_PREFIX = "tyora_profile_setup_skipped_";

function skippedKey(userId: string) {
  return `${SKIP_PREFIX}${userId}`;
}

function wasSkipped(userId: string) {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    return window.sessionStorage.getItem(skippedKey(userId)) === "true";
  } catch {
    return false;
  }
}

function rememberSkipped(userId: string) {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(skippedKey(userId), "true");
    }
  } catch {
    // Storage can be unavailable in locked-down desktop browsers. Skipping should never crash the app.
  }
}

export default function CommunityProfileGate() {
  const [user, setUser] = useState<CommunitySessionUser | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async (forcePrompt = false) => {
    try {
      const response = await fetch("/api/community/session");
      const payload = await response.json();
      const nextUser = payload.user || null;
      setUser(nextUser);
      if (!nextUser) {
        setOpen(false);
        return;
      }
      const skipped = wasSkipped(nextUser.id);
      if (!nextUser.profileCompleted && (forcePrompt || !skipped)) {
        setOpen(true);
      }
    } catch {
      setUser(null);
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    function onLogin() {
      void refresh(true);
    }
    function onProfileUpdated(event: Event) {
      const detail = (event as CustomEvent<{ user?: CommunitySessionUser }>).detail;
      if (detail?.user) setUser(detail.user);
      setOpen(false);
    }
    window.addEventListener("tyora:community-login", onLogin);
    window.addEventListener("tyora:community-profile-updated", onProfileUpdated);
    return () => {
      window.removeEventListener("tyora:community-login", onLogin);
      window.removeEventListener("tyora:community-profile-updated", onProfileUpdated);
    };
  }, [refresh]);

  function close() {
    if (user && !user.profileCompleted) {
      rememberSkipped(user.id);
    }
    setOpen(false);
  }

  return <CommunityProfileModal open={open} user={user} mode="setup" onClose={close} onSaved={(nextUser) => setUser(nextUser)} />;
}
