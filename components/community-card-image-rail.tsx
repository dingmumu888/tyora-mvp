"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import CommunityImage from "@/components/community-image";

type Props = {
  imageUrls: string[];
  title: string;
  tone: string;
  cover?: boolean;
  priority?: boolean;
};

export default function CommunityCardImageRail({
  imageUrls,
  title,
  tone,
  cover = false,
  priority = false
}: Props) {
  const images = imageUrls.slice(0, 9);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const coverImage = images[0];

  function move(direction: number) {
    if (activeIndex === null || images.length < 2) return;
    setActiveIndex((activeIndex + direction + images.length) % images.length);
  }

  return (
    <>
      <button
        type="button"
        data-testid="mobile-card-image-rail"
        disabled={!coverImage}
        onClick={() => coverImage && setActiveIndex(0)}
        className={`absolute inset-2 overflow-hidden rounded-lg border border-[#dfe5ed] bg-gradient-to-br shadow-sm ${tone} disabled:cursor-default`}
        aria-label={coverImage ? `Enlarge ${title} images` : `${title} image`}
      >
        <CommunityImage
          src={coverImage}
          alt={`${title} image 1`}
          thumbnail
          priority={priority}
          showLoadingPlaceholder
          className={`absolute inset-0 size-full ${cover ? "object-cover" : "object-contain p-1"}`}
          fallbackClassName="absolute inset-0 p-2"
          initialsClassName="size-10 rounded-xl text-sm"
        />
        {images.length > 1 ? (
          <span className="absolute bottom-1 right-1 rounded bg-[#0b1426]/72 px-1.5 py-0.5 text-[9px] font-bold text-white">
            1/{images.length}
          </span>
        ) : null}
      </button>

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
