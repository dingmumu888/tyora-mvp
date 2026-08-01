"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import CommunityImage from "@/components/community-image";

type Props = {
  imageUrls: string[];
  title: string;
  tone: string;
  cover?: boolean;
};

export default function CommunityCardImageRail({
  imageUrls,
  title,
  tone,
  cover = false
}: Props) {
  const images = imageUrls.slice(0, 9);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visibleRows = Math.min(Math.max(images.length, 1), 3);
  const itemHeight = `calc((100% - ${(visibleRows - 1) * 4}px) / ${visibleRows})`;

  function move(direction: number) {
    if (activeIndex === null || images.length < 2) return;
    setActiveIndex((activeIndex + direction + images.length) % images.length);
  }

  return (
    <>
      <div
        data-testid="mobile-card-image-rail"
        className="no-scrollbar absolute inset-2 flex snap-y snap-mandatory flex-col gap-1 overflow-y-auto overscroll-contain rounded-lg"
        aria-label={`${title} images`}
      >
        {(images.length ? images : [undefined]).map((src, index) => (
          <button
            key={`${src || "fallback"}-${index}`}
            type="button"
            disabled={!src}
            onClick={() => src && setActiveIndex(index)}
            style={{ height: itemHeight }}
            className={`relative w-full shrink-0 snap-start overflow-hidden rounded-lg border border-[#dfe5ed] bg-gradient-to-br shadow-sm ${tone} disabled:cursor-default`}
            aria-label={src ? `Enlarge ${title} image ${index + 1}` : `${title} image`}
          >
            <CommunityImage
              src={src}
              alt={`${title} image ${index + 1}`}
              className={`absolute inset-0 size-full ${cover ? "object-cover" : "object-contain p-1"}`}
              fallbackClassName="absolute inset-0 p-2"
              initialsClassName="size-10 rounded-xl text-sm"
            />
            {images.length > 1 ? (
              <span className="absolute bottom-1 right-1 rounded bg-[#0b1426]/72 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {index + 1}/{images.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeIndex !== null && images[activeIndex] ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#07101f]/96 text-white" role="dialog" aria-modal="true" aria-label={`${title} image preview`}>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="truncate text-sm font-semibold">{title}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/75">{activeIndex + 1} / {images.length}</span>
              <button type="button" onClick={() => setActiveIndex(null)} className="flex size-10 items-center justify-center rounded-full bg-white/12" aria-label="Close image preview">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
            {images.length > 1 ? (
              <button type="button" onClick={() => move(-1)} className="absolute left-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/12" aria-label="Previous image">
                <ChevronLeft size={24} />
              </button>
            ) : null}
            <CommunityImage
              src={images[activeIndex]}
              alt={`${title} image ${activeIndex + 1}`}
              className="max-h-full max-w-full object-contain"
              fallbackClassName="max-h-full max-w-full p-8"
              initialsClassName="size-24 rounded-[28px] text-3xl"
            />
            {images.length > 1 ? (
              <button type="button" onClick={() => move(1)} className="absolute right-3 z-10 flex size-11 items-center justify-center rounded-full bg-white/12" aria-label="Next image">
                <ChevronRight size={24} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
