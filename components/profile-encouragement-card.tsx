"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateMyTyora } from "@/lib/my-tyora-i18n";
import {
  normalizeProfileEncouragements,
  profileEncouragementFallbacks,
  type ProfileEncouragements
} from "@/lib/profile-encouragements";

type ProfileEncouragementCardProps = {
  userId: string;
  sessionSeed: number;
};

function encouragementHash(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

type SavedSelection = {
  sessionSeed: number;
  index: number;
};

function readSelection(key: string): SavedSelection | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "");
    if (!Number.isFinite(parsed?.sessionSeed) || !Number.isInteger(parsed?.index)) return null;
    return parsed as SavedSelection;
  } catch {
    return null;
  }
}

function saveSelection(key: string, value: SavedSelection) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The message can still rotate while storage is unavailable.
  }
}

export default function ProfileEncouragementCard({ userId, sessionSeed }: ProfileEncouragementCardProps) {
  const { language } = usePublicLanguage();
  const [encouragements, setEncouragements] = useState<ProfileEncouragements>(
    profileEncouragementFallbacks
  );
  const [contentReady, setContentReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const choices = useMemo(() => {
    const localized = encouragements[language];
    return localized.length ? localized : encouragements.en;
  }, [encouragements, language]);
  const encouragement = useMemo(() => {
    if (selectedIndex === null) return "";
    return choices[selectedIndex] || "";
  }, [choices, selectedIndex]);

  useEffect(() => {
    let active = true;
    void fetch("/api/content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load profile encouragements.");
        const payload = await response.json();
        return normalizeProfileEncouragements(payload?.data?.communityPage?.profileEncouragements);
      })
      .then((next) => {
        if (active) {
          setEncouragements(next);
          setContentReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setEncouragements(profileEncouragementFallbacks);
          setContentReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!contentReady || !choices.length) return;
    const storageKey = `tyora-profile-encouragement:${userId}:${language}`;
    const previous = readSelection(storageKey);
    if (
      previous?.sessionSeed === sessionSeed
      && previous.index >= 0
      && previous.index < choices.length
    ) {
      setSelectedIndex(previous.index);
      return;
    }

    let nextIndex = encouragementHash(`${userId}:${sessionSeed}:${language}`) % choices.length;
    if (
      choices.length > 1
      && previous
      && previous.index >= 0
      && previous.index < choices.length
      && nextIndex === previous.index
    ) {
      const offset = 1 + encouragementHash(`${sessionSeed}:${language}:next`) % (choices.length - 1);
      nextIndex = (nextIndex + offset) % choices.length;
    }
    setSelectedIndex(nextIndex);
    saveSelection(storageKey, { sessionSeed, index: nextIndex });
  }, [choices.length, contentReady, language, sessionSeed, userId]);

  function showAnother() {
    if (choices.length <= 1) return;
    setSelectedIndex((current) => {
      const currentIndex = current ?? 0;
      const offset = 1 + Math.floor(Math.random() * (choices.length - 1));
      const nextIndex = (currentIndex + offset) % choices.length;
      saveSelection(
        `tyora-profile-encouragement:${userId}:${language}`,
        { sessionSeed, index: nextIndex }
      );
      return nextIndex;
    });
  }

  if (!encouragement) return null;

  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dbe7ff] bg-gradient-to-br from-[#f2f7ff] to-[#f8fbff] px-4 py-3.5 text-[#274b87]">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm">
        <Sparkles size={15} aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-6">{encouragement}</p>
      {choices.length > 1 ? (
        <button
          type="button"
          onClick={showAnother}
          className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-[#315fbd] transition hover:bg-white/80"
        >
          <RefreshCw size={13} aria-hidden="true" />
          {translateMyTyora(language, "anotherEncouragement")}
        </button>
      ) : null}
    </div>
  );
}
