"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { usePublicLanguage } from "@/components/public-language-provider";
import {
  normalizeProfileEncouragements,
  profileEncouragementFallbacks,
  type ProfileEncouragements
} from "@/lib/profile-encouragements";

type ProfileEncouragementCardProps = {
  userId: string;
};

function dailyEncouragementIndex(userId: string, count: number) {
  if (count <= 1) return 0;
  const seed = `${userId}:${new Date().toISOString().slice(0, 10)}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % count;
}

export default function ProfileEncouragementCard({ userId }: ProfileEncouragementCardProps) {
  const { language } = usePublicLanguage();
  const [encouragements, setEncouragements] = useState<ProfileEncouragements>(
    profileEncouragementFallbacks
  );
  const encouragement = useMemo(() => {
    const localized = encouragements[language];
    const choices = localized.length ? localized : encouragements.en;
    return choices[dailyEncouragementIndex(userId, choices.length)] || "";
  }, [encouragements, language, userId]);

  useEffect(() => {
    let active = true;
    void fetch("/api/content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load profile encouragements.");
        const payload = await response.json();
        return normalizeProfileEncouragements(payload?.data?.communityPage?.profileEncouragements);
      })
      .then((next) => {
        if (active) setEncouragements(next);
      })
      .catch(() => {
        if (active) setEncouragements(profileEncouragementFallbacks);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!encouragement) return null;

  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dbe7ff] bg-gradient-to-br from-[#f2f7ff] to-[#f8fbff] px-4 py-3.5 text-[#274b87]">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm">
        <Sparkles size={15} aria-hidden="true" />
      </span>
      <p className="text-sm font-medium leading-6">{encouragement}</p>
    </div>
  );
}
