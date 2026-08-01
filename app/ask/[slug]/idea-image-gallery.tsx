"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import CommunityImage from "@/components/community-image";
import { useIdeaDetailText } from "./idea-detail-text";

function galleryClass(count: number) {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  if (count === 4) return "grid-cols-2";
  return "grid-cols-3";
}

function tileClass(count: number) {
  if (count === 1) return "aspect-[16/10] max-h-[660px]";
  if (count === 2) return "aspect-[4/3]";
  return "aspect-[16/9]";
}

export default function IdeaImageGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const t = useIdeaDetailText();
  const images = imageUrls.slice(0, 9);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const move = useCallback((direction: -1 | 1) => {
    setActiveIndex((current) => {
      if (current === null || images.length === 0) return current;
      return (current + direction + images.length) % images.length;
    });
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, images.length, move]);

  useEffect(() => setScale(1), [activeIndex]);

  if (images.length === 0) return null;

  return (
    <>
      <div className={`grid ${galleryClass(images.length)} gap-1.5 overflow-hidden rounded-[18px] bg-[#edf1f6] p-1.5 ring-1 ring-[#d8dee8] sm:gap-2 sm:p-2`}>
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`group relative flex min-w-0 items-center justify-center overflow-hidden rounded-[12px] bg-[linear-gradient(145deg,#edf8f5,#fff,#f2edff)] ${tileClass(images.length)}`}
            aria-label={`${title} ${t("imageCounter", { current: index + 1, total: images.length })}`}
          >
            <CommunityImage
              src={src}
              alt={`${title} image ${index + 1}`}
              className="size-full object-contain transition duration-300 group-hover:scale-[1.015]"
              fallbackClassName="absolute inset-0 p-5"
              initialsClassName="size-16 rounded-2xl text-xl"
            />
            <span className="absolute left-2 top-2 rounded-full bg-[#0b1426]/78 px-2 py-1 text-[10px] font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100 sm:text-xs">
              {index + 1}/{images.length}
            </span>
          </button>
        ))}
      </div>

      {activeIndex !== null ? (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-[#070b12]/96 text-white backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current;
            const end = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (start === null || typeof end !== "number" || Math.abs(end - start) < 45) return;
            move(end < start ? 1 : -1);
          }}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/18"
              aria-label={t("closeGallery")}
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setScale((value) => Math.max(1, Number((value - 0.25).toFixed(2))))} disabled={scale <= 1} className="grid size-9 place-items-center rounded-full bg-white/10 disabled:opacity-35" aria-label="Zoom out"><Minus size={17} /></button>
              <span className="min-w-16 rounded-full bg-white/10 px-3 py-1.5 text-center text-sm font-semibold">{Math.round(scale * 100)}%</span>
              <button type="button" onClick={() => setScale((value) => Math.min(3, Number((value + 0.25).toFixed(2))))} disabled={scale >= 3} className="grid size-9 place-items-center rounded-full bg-white/10 disabled:opacity-35" aria-label="Zoom in"><Plus size={17} /></button>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">{t("imageCounter", { current: activeIndex + 1, total: images.length })}</span>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-8 sm:px-20">
            {images.length > 1 ? (
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-3 z-10 hidden size-12 items-center justify-center rounded-full bg-white/12 transition hover:bg-white/22 sm:flex"
                aria-label={t("previousImage")}
              >
                <ChevronLeft size={26} />
              </button>
            ) : null}
            <div className="flex max-h-full max-w-full items-center justify-center transition-transform duration-200" style={{ transform: `scale(${scale})` }}>
              <CommunityImage
                src={images[activeIndex]}
                alt={`${title} image ${activeIndex + 1}`}
                className="max-h-[calc(100vh-150px)] max-w-[calc(100vw-32px)] select-none object-contain sm:max-w-[calc(100vw-180px)]"
                fallbackClassName="max-h-full max-w-full p-8"
                initialsClassName="size-24 rounded-[28px] text-3xl"
              />
            </div>
            {images.length > 1 ? (
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-3 z-10 hidden size-12 items-center justify-center rounded-full bg-white/12 transition hover:bg-white/22 sm:flex"
                aria-label={t("nextImage")}
              >
                <ChevronRight size={26} />
              </button>
            ) : null}
          </div>
          <p className="shrink-0 pb-5 text-center text-xs text-white/62">{t("imageHint")}</p>
        </div>
      ) : null}
    </>
  );
}
