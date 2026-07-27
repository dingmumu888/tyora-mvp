"use client";

import { getImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { CmsImageValue } from "@/lib/storage";
import { cn } from "@/lib/utils";

type CmsImageProps = {
  image: CmsImageValue;
  fallbackAlt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export default function CmsImage({
  image,
  fallbackAlt,
  sizes,
  priority = false,
  className,
  imageClassName
}: CmsImageProps) {
  const desktopSrc = image.visible ? image.desktopUrl : "";
  const mobileSrc = image.visible ? image.mobileUrl || desktopSrc : "";
  const [desktopFailed, setDesktopFailed] = useState(false);
  const [mobileFailed, setMobileFailed] = useState(false);

  useEffect(() => {
    setDesktopFailed(false);
    setMobileFailed(false);
  }, [desktopSrc, mobileSrc]);

  const alt = image.alt.trim() || fallbackAlt;
  const position = image.objectPosition || "center center";

  if ((!desktopSrc || desktopFailed) && (!mobileSrc || mobileFailed)) {
    return (
      <div className={cn("grid place-items-center bg-[#eef2f7] text-[#667085]", className)} role="img" aria-label={alt}>
        <span className="flex flex-col items-center gap-2 px-4 text-center text-xs font-medium">
          <ImageOff size={22} aria-hidden="true" />
          <span>{fallbackAlt}</span>
        </span>
      </div>
    );
  }

  const desktopImage = desktopSrc && !desktopFailed
    ? getImageProps({ src: desktopSrc, alt, fill: true, sizes, priority })
    : null;
  const mobileImage = mobileSrc && !mobileFailed
    ? getImageProps({ src: mobileSrc, alt, fill: true, sizes, priority })
    : null;
  const fallbackImage = desktopImage || mobileImage;

  if (!fallbackImage) return null;
  const { alt: resolvedAlt, ...fallbackProps } = fallbackImage.props;

  return (
    <div className={cn("relative overflow-hidden bg-[#eef2f7]", className)}>
      <picture>
        {mobileImage && desktopImage && mobileSrc !== desktopSrc ? (
          <source media="(max-width: 639px)" srcSet={mobileImage.props.srcSet} sizes={mobileImage.props.sizes} />
        ) : null}
        {/* getImageProps keeps picture sources optimized without loading both mobile and desktop assets. */}
        <img
          {...fallbackProps}
          alt={resolvedAlt}
          className={cn("object-cover", imageClassName)}
          style={{ ...fallbackImage.props.style, objectFit: "cover", objectPosition: position }}
          onError={() => {
            setDesktopFailed(true);
            setMobileFailed(true);
          }}
        />
      </picture>
    </div>
  );
}
