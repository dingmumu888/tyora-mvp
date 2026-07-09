"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import CommunityImage from "@/components/community-image";

export default function IdeaImageGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const previewImages = imageUrls.length > 0 ? imageUrls.slice(0, 3) : [undefined];
  const extraCount = Math.max(imageUrls.length - 3, 0);

  function move(direction: -1 | 1) {
    if (activeIndex === null || imageUrls.length === 0) return;
    setActiveIndex((activeIndex + direction + imageUrls.length) % imageUrls.length);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-[22px] bg-white p-1.5 shadow-sm ring-1 ring-[#e4e8ef]">
        {previewImages.map((src, index) => (
          <button
            key={`${src || "fallback"}-${index}`}
            type="button"
            onClick={() => imageUrls.length > 0 ? setActiveIndex(index) : undefined}
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-[#e9f7f3] via-white to-[#efe9ff]"
          >
            <CommunityImage src={src} alt={`${title} image ${index + 1}`} className="size-full object-contain" fallbackClassName="absolute inset-0 p-5" initialsClassName="size-16 rounded-2xl text-xl" />
            {index === 2 && extraCount > 0 ? (
              <span className="absolute bottom-2 right-2 rounded-full bg-[#101216]/82 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">+{extraCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {activeIndex !== null ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/94 text-white">
          <div className="flex h-14 items-center justify-between px-4">
            <button type="button" onClick={() => setActiveIndex(null)} className="flex size-10 items-center justify-center rounded-full bg-white/10">
              <X size={20} />
            </button>
            <span className="text-sm font-semibold">{activeIndex + 1} / {imageUrls.length}</span>
            <span className="size-10" />
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-8">
            <button type="button" onClick={() => move(-1)} className="absolute left-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/12">
              <ChevronLeft size={22} />
            </button>
            <CommunityImage src={imageUrls[activeIndex]} alt={`${title} image ${activeIndex + 1}`} className="max-h-full max-w-full object-contain" fallbackClassName="max-h-full max-w-full p-8" initialsClassName="size-24 rounded-[28px] text-3xl" />
            <button type="button" onClick={() => move(1)} className="absolute right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/12">
              <ChevronRight size={22} />
            </button>
          </div>
          <div className="pb-5 text-center text-xs text-white/62">Tap arrows to browse images</div>
        </div>
      ) : null}
    </>
  );
}
