"use client";

/* eslint-disable @next/next/no-img-element -- TYORA's authenticated image route supplies fixed-size WebP thumbnails while preserving private full-resolution access. */

import { useEffect, useMemo, useRef, useState } from "react";
import { communityThumbnailUrl } from "@/lib/community-image-url";
import { cn } from "@/lib/utils";

type CommunityImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  initialsClassName?: string;
  thumbnail?: boolean;
  priority?: boolean;
  showLoadingPlaceholder?: boolean;
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
  initialsClassName,
  thumbnail = false,
  priority = false,
  showLoadingPlaceholder = false
}: CommunityImageProps) {
  const renderSrc = thumbnail ? communityThumbnailUrl(src) : src;
  const imageRef = useRef<HTMLImageElement>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const initials = useMemo(() => initialsFor(alt), [alt]);
  const loaded = Boolean(renderSrc && loadedSrc === renderSrc);

  useEffect(() => {
    const image = imageRef.current;

    // A cached image can finish before React attaches onLoad during hydration.
    // Detect that state so a refreshed feed never leaves the image transparent.
    if (renderSrc && image?.complete && image.naturalWidth > 0) {
      setLoadedSrc(renderSrc);
    }
  }, [renderSrc]);

  if (canRenderImage(renderSrc) && failedSrc !== renderSrc) {
    return (
      <>
        {showLoadingPlaceholder && !loaded ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#eef2f6_25%,#f8fafc_42%,#eef2f6_60%)] bg-[length:220%_100%]"
          />
        ) : null}
        <img
          ref={imageRef}
          src={renderSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={cn(className, showLoadingPlaceholder && (loaded ? "opacity-100" : "opacity-0"))}
          onLoad={() => setLoadedSrc(renderSrc || null)}
          onError={() => setFailedSrc(renderSrc || null)}
        />
      </>
    );
  }

  return (
    <div className={cn("flex size-full items-center justify-center", fallbackClassName)} aria-label={alt}>
      <div className={cn("flex size-14 items-center justify-center rounded-2xl bg-white/78 text-lg font-semibold shadow-sm ring-1 ring-white", initialsClassName)}>
        {initials}
      </div>
    </div>
  );
}
