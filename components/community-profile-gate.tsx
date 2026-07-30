"use client";

import { useCallback, useEffect, useState } from "react";
import CommunityProfileModal, { CommunitySessionUser } from "@/components/community-profile-modal";

export default function CommunityProfileGate() {
  const [user, setUser] = useState<CommunitySessionUser | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/community/session");
      const payload = await response.json();
      const nextUser = payload.user || null;
      setUser(nextUser);
      if (!nextUser) {
        setOpen(false);
        return;
      }
      setOpen(!nextUser.profileCompleted);
    } catch {
      setUser(null);
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    function onLogin() {
      void refresh();
    }
    function onProfileUpdated(event: Event) {
      const detail = (event as CustomEvent<{ user?: CommunitySessionUser }>).detail;
      if (detail?.user) setUser(detail.user);
      setOpen(!detail?.user?.profileCompleted);
    }
    window.addEventListener("tyora:community-login", onLogin);
    window.addEventListener("tyora:community-profile-updated", onProfileUpdated);
    return () => {
      window.removeEventListener("tyora:community-login", onLogin);
      window.removeEventListener("tyora:community-profile-updated", onProfileUpdated);
    };
  }, [refresh]);

  function close() {
    if (user?.profileCompleted) setOpen(false);
  }

  return <CommunityProfileModal open={open} user={user} mode="setup" onClose={close} onSaved={(nextUser) => setUser(nextUser)} />;
}
