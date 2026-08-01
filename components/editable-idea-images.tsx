"use client";

import { ChangeEvent, DragEvent, TouchEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { preparePublicImage } from "@/lib/public-image-processing";

export default function EditableIdeaImages({
  images,
  onChange,
  addLabel = "Add image",
  preparingLabel = "Preparing images...",
  limitMessage = "You can upload up to 9 images.",
  errorMessage = "Unable to prepare this image."
}: {
  images: string[];
  onChange: (images: string[]) => void;
  addLabel?: string;
  preparingLabel?: string;
  limitMessage?: string;
  errorMessage?: string;
}) {
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const draggingIndex = useRef<number | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDraggingIndex = useRef<number | null>(null);

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
    const next = [...images];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
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

  function dropOn(event: DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault();
    const sourceIndex = draggingIndex.current;
    draggingIndex.current = null;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    moveImage(sourceIndex, targetIndex);
  }

  function startTouchReorder(event: TouchEvent<HTMLDivElement>, index: number) {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => {
      touchDraggingIndex.current = index;
      if ("vibrate" in navigator) navigator.vibrate(35);
    }, 350);
  }

  function moveTouchReorder(event: TouchEvent<HTMLDivElement>) {
    if (touchDraggingIndex.current !== null) event.preventDefault();
  }

  function endTouchReorder(event: TouchEvent<HTMLDivElement>) {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = null;
    const sourceIndex = touchDraggingIndex.current;
    touchDraggingIndex.current = null;
    if (sourceIndex === null) return;
    const touch = event.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-image-index]");
    const targetIndex = Number(target?.dataset.imageIndex);
    if (Number.isInteger(targetIndex)) moveImage(sourceIndex, targetIndex);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, index) => (
          <div
            key={`${src.slice(0, 80)}-${index}`}
            data-image-index={index}
            draggable
            onDragStart={() => { draggingIndex.current = index; }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => dropOn(event, index)}
            onTouchStart={(event) => startTouchReorder(event, index)}
            onTouchMove={moveTouchReorder}
            onTouchEnd={endTouchReorder}
            onClick={() => setPreviewIndex(index)}
            className="group relative aspect-[4/3] cursor-grab overflow-hidden rounded-2xl border border-[#dfe6ef] bg-[#f8fafc] active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img aria-hidden="true" src={src} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-15 blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Idea image ${index + 1}`} className="relative size-full object-contain" />
            <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-white/92 text-xs font-bold text-[#155eef] shadow-sm">{index + 1}</span>
            <span className="absolute bottom-2 left-2 grid size-7 place-items-center rounded-full bg-[#0b1426]/72 text-white opacity-0 transition group-hover:opacity-100"><GripVertical size={14} /></span>
            <button type="button" onClick={(event) => { event.stopPropagation(); onChange(images.filter((_, itemIndex) => itemIndex !== index)); }} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/94 text-[#667085] shadow-sm transition hover:bg-[#fff1f2] hover:text-[#be123c]" aria-label={`Remove image ${index + 1}`}><X size={15} /></button>
          </div>
        ))}
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
