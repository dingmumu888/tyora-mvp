"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CommunityAvatarProps = {
  name: string;
  src?: string;
  className?: string;
  textClassName?: string;
};

const MAX_INLINE_AVATAR_LENGTH = 120000;

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "TY";
}

function canRender(src?: string) {
  if (!src) return false;
  const value = src.trim();
  if (value.startsWith("data:image/")) return value.length <= MAX_INLINE_AVATAR_LENGTH && value.includes(";base64,");
  return value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/");
}

export default function CommunityAvatar({ name, src, className, textClassName }: CommunityAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => initialsFor(name), [name]);

  return (
    <span className={cn("relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-[#101216] text-xs font-semibold text-white", className)}>
      {canRender(src) && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className={textClassName}>{initials}</span>
      )}
    </span>
  );
}
