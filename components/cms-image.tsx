"use client";

import Image from "next/image";
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

  return (
    <div className={cn("relative overflow-hidden bg-[#eef2f7]", className)}>
      {mobileSrc && !mobileFailed ? (
        <Image
          src={mobileSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover sm:hidden", imageClassName)}
          style={{ objectPosition: position }}
          onError={() => setMobileFailed(true)}
        />
      ) : null}
      {desktopSrc && !desktopFailed ? (
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(mobileSrc && !mobileFailed ? "hidden object-cover sm:block" : "object-cover", imageClassName)}
          style={{ objectPosition: position }}
          onError={() => setDesktopFailed(true)}
        />
      ) : null}
    </div>
  );
}
