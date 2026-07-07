"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CommunityImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  initialsClassName?: string;
};

const MAX_INLINE_IMAGE_LENGTH = 900000;

function initialsFor(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return value.trim().slice(0, 2).toUpperCase() || "TY";
}

function canRenderImage(src?: string) {
  if (!src) return false;
  const value = src.trim();
  if (value.startsWith("data:image/")) return value.length <= MAX_INLINE_IMAGE_LENGTH && value.includes(";base64,");
  return value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/");
}

export default function CommunityImage({
  src,
  alt,
  className,
  fallbackClassName,
  initialsClassName
}: CommunityImageProps) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => initialsFor(alt), [alt]);

  if (canRenderImage(src) && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
  }

  return (
    <div className={cn("flex size-full items-center justify-center", fallbackClassName)} aria-label={alt}>
      <div className={cn("flex size-14 items-center justify-center rounded-2xl bg-white/78 text-lg font-semibold shadow-sm ring-1 ring-white", initialsClassName)}>
        {initials}
      </div>
    </div>
  );
}
