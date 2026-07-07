"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

let markedNotificationsThisPageLoad = false;

export default function MarkNotificationsRead() {
  const router = useRouter();

  useEffect(() => {
    async function markReadIfViewingNotifications() {
      if (markedNotificationsThisPageLoad || window.location.hash !== "#notifications") return;
      markedNotificationsThisPageLoad = true;
      try {
        const response = await fetch("/api/community/notifications/read", { method: "POST" });
        if (response.ok) {
          window.dispatchEvent(new CustomEvent("tyora:community-notifications-read"));
          router.refresh();
        }
      } catch {
        markedNotificationsThisPageLoad = false;
      }
    }

    void markReadIfViewingNotifications();
    window.addEventListener("hashchange", markReadIfViewingNotifications);
    return () => window.removeEventListener("hashchange", markReadIfViewingNotifications);
  }, [router]);

  return null;
}
