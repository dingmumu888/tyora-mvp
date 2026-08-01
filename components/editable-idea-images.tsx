"use client";

import { ChangeEvent, DragEvent, TouchEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { preparePublicImage } from "@/lib/public-image-processing";

type TouchDragPreview = {
  src: string;
  x: number;
  y: number;
  width: number;
};

function imageKey(src: string) {
  let hash = 2166136261;
  const step = Math.max(1, Math.floor(src.length / 256));
  for (let index = 0; index < src.length; index += step) {
    hash ^= src.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${src.length}-${(hash >>> 0).toString(36)}`;
}

export default function EditableIdeaImages({
  images,
  onChange,
  addLabel = "Add image",
  preparingLabel = "Preparing images...",
  limitMessage = "You can upload up to 9 images.",
  reorderHint = "Drag to reorder. On mobile, press and hold, then drag.",
  errorMessage = "Unable to prepare this image."
}: {
  images: string[];
  onChange: (images: string[]) => void;
  addLabel?: string;
  preparingLabel?: string;
  limitMessage?: string;
  reorderHint?: string;
  errorMessage?: string;
}) {
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [touchPreview, setTouchPreview] = useState<TouchDragPreview | null>(null);
  const liveImages = useRef(images);
  const draggingIndex = useRef<number | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDraggingIndex = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number; src: string; width: number } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    liveImages.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      if (touchTimer.current) clearTimeout(touchTimer.current);
    };
  }, []);

  useEffect(() => {
    if (previewIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewIndex(null);
      if (event.key === "ArrowLeft") setPreviewIndex((current) => current === null ? null : (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setPreviewIndex((current) => current === null ? null : (current + 1) % images.length);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [images.length, previewIndex]);

  function moveImage(sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex) return;
    const next = [...liveImages.current];
    const [moved] = next.splice(sourceIndex, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    liveImages.current = next;
    onChange(next);
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files || []).filter((file) => !file.type || file.type.startsWith("image/")).slice(0, 9 - images.length);
    event.currentTarget.value = "";
    if (!selected.length) return;
    setPreparing(true);
    setMessage("");
    try {
      const prepared = await Promise.all(selected.map((file) => preparePublicImage(file, {
        maxDimension: 1280,
        quality: 0.8,
        maxDataUrlLength: 650000,
        minimumDimension: 480
      })));
      onChange([...images, ...prepared.map((item) => item.dataUrl)].slice(0, 9));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errorMessage);
    } finally {
      setPreparing(false);
    }
  }

  function beginDesktopDrag(event: DragEvent<HTMLDivElement>, index: number) {
    draggingIndex.current = index;
    suppressClick.current = true;
    setActiveDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function enterDesktopTarget(event: DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault();
    const sourceIndex = draggingIndex.current;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    moveImage(sourceIndex, targetIndex);
    draggingIndex.current = targetIndex;
    setActiveDragIndex(targetIndex);
  }

  function finishDesktopDrag() {
    draggingIndex.current = null;
    setActiveDragIndex(null);
    window.setTimeout(() => { suppressClick.current = false; }, 0);
  }

  function startTouchReorder(event: TouchEvent<HTMLDivElement>, index: number) {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    touchStart.current = { x: touch.clientX, y: touch.clientY, src: images[index], width: rect.width };
    touchTimer.current = setTimeout(() => {
      const start = touchStart.current;
      if (!start) return;
      touchDraggingIndex.current = index;
      suppressClick.current = true;
      setActiveDragIndex(index);
      setTouchPreview({ src: start.src, x: start.x, y: start.y, width: start.width });
      if ("vibrate" in navigator) navigator.vibrate(35);
    }, 380);
  }

  function moveTouchReorder(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    const sourceIndex = touchDraggingIndex.current;
    if (sourceIndex === null) {
      const start = touchStart.current;
      if (start && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 10) {
        if (touchTimer.current) clearTimeout(touchTimer.current);
        touchTimer.current = null;
        touchStart.current = null;
      }
      return;
    }

    event.preventDefault();
    setTouchPreview((current) => current ? { ...current, x: touch.clientX, y: touch.clientY } : current);
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-image-index]");
    const targetIndex = Number(target?.dataset.imageIndex);
    if (!Number.isInteger(targetIndex) || targetIndex === sourceIndex) return;
    moveImage(sourceIndex, targetIndex);
    touchDraggingIndex.current = targetIndex;
    setActiveDragIndex(targetIndex);
  }

  function finishTouchReorder() {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = null;
    touchStart.current = null;
    const wasDragging = touchDraggingIndex.current !== null;
    touchDraggingIndex.current = null;
    setActiveDragIndex(null);
    setTouchPreview(null);
    if (wasDragging) window.setTimeout(() => { suppressClick.current = false; }, 80);
  }

  function openPreview(index: number) {
    if (suppressClick.current) return;
    setPreviewIndex(index);
  }

  return (
    <div>
      {images.length > 1 ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#f4f7fb] px-3 py-2 text-xs font-medium text-[#526071]">
          <GripVertical size={15} className="shrink-0 text-[#155eef]" />
          <span>{reorderHint}</span>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, index) => {
          const duplicateNumber = images.slice(0, index).filter((item) => item === src).length;
          const active = activeDragIndex === index;
          return (
            <motion.div
              layout
              transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
              key={`${imageKey(src)}-${duplicateNumber}`}
            >
              <div
                data-image-index={index}
                draggable
                aria-grabbed={active}
                onDragStart={(event) => beginDesktopDrag(event, index)}
                onDragEnter={(event) => enterDesktopTarget(event, index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                onDragEnd={finishDesktopDrag}
                onTouchStart={(event) => startTouchReorder(event, index)}
                onTouchMove={moveTouchReorder}
                onTouchEnd={finishTouchReorder}
                onTouchCancel={finishTouchReorder}
                onClick={() => openPreview(index)}
                className={`group relative aspect-[4/3] select-none overflow-hidden rounded-2xl border bg-[#f8fafc] transition-[border-color,box-shadow,opacity,transform] duration-200 active:cursor-grabbing ${active ? "z-10 cursor-grabbing border-[#2563eb] opacity-45 shadow-[0_12px_30px_rgba(37,99,235,0.2)] ring-2 ring-[#2563eb]/20" : "cursor-grab border-[#dfe6ef] hover:border-[#93b4f8] hover:shadow-md"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img aria-hidden="true" draggable={false} src={src} alt="" className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-15 blur-xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img draggable={false} src={src} alt={`Idea image ${index + 1}`} className="pointer-events-none relative size-full object-contain" />
                <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-white/92 text-xs font-bold text-[#155eef] shadow-sm">{index + 1}</span>
                <span className={`absolute bottom-2 left-2 grid size-8 place-items-center rounded-full bg-[#0b1426]/78 text-white shadow-sm transition ${active ? "scale-110 opacity-100" : "opacity-80 sm:opacity-0 sm:group-hover:opacity-100"}`}><GripVertical size={15} /></span>
                <button type="button" onClick={(event) => { event.stopPropagation(); liveImages.current = images.filter((_, itemIndex) => itemIndex !== index); onChange(liveImages.current); }} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/94 text-[#667085] shadow-sm transition hover:bg-[#fff1f2] hover:text-[#be123c]" aria-label={`Remove image ${index + 1}`}><X size={15} /></button>
              </div>
            </motion.div>
          );
        })}
        {images.length < 9 ? (
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#93b4f8] bg-[#f8fbff] text-center text-[#155eef] transition hover:border-[#155eef] hover:bg-[#eef6ff]">
            {preparing ? <Loader2 className="animate-spin" size={26} /> : <ImagePlus size={30} />}
            <span className="px-2 text-xs font-bold">{preparing ? preparingLabel : addLabel}</span>
            <input type="file" accept="image/*" multiple className="sr-only" disabled={preparing} onChange={addFiles} />
          </label>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#69707d]"><span>{limitMessage}</span><strong>{images.length}/9</strong></div>
      {message ? <p className="mt-2 rounded-xl bg-[#fff7ed] px-3 py-2 text-xs text-[#9a3412]">{message}</p> : null}
      {touchPreview ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[140] aspect-[4/3] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-[#2563eb] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.35)] ring-4 ring-[#2563eb]/15"
          style={{ left: touchPreview.x, top: touchPreview.y, width: Math.min(touchPreview.width, 280) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img aria-hidden="true" src={touchPreview.src} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-15 blur-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={touchPreview.src} alt="" className="relative size-full object-contain" />
        </div>
      ) : null}
      {previewIndex !== null && images[previewIndex] ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] grid place-items-center bg-[#07101d]/94 p-4 backdrop-blur-sm" onClick={() => setPreviewIndex(null)}>
          <button type="button" onClick={() => setPreviewIndex(null)} aria-label="Close preview" className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-white/12 text-white"><X size={20} /></button>
          <span className="absolute right-4 top-4 rounded-full bg-white/12 px-3 py-1.5 text-sm font-semibold text-white">{previewIndex + 1} / {images.length}</span>
          {images.length > 1 ? <button type="button" onClick={(event) => { event.stopPropagation(); setPreviewIndex((previewIndex - 1 + images.length) % images.length); }} aria-label="Previous image" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white"><ChevronLeft size={24} /></button> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[previewIndex]} alt={`Idea image ${previewIndex + 1}`} onClick={(event) => event.stopPropagation()} className="max-h-[88vh] max-w-[90vw] object-contain" />
          {images.length > 1 ? <button type="button" onClick={(event) => { event.stopPropagation(); setPreviewIndex((previewIndex + 1) % images.length); }} aria-label="Next image" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white"><ChevronRight size={24} /></button> : null}
        </div>
      ) : null}
    </div>
  );
}
