"use client";

import { ChangeEvent, DragEvent, TouchEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronLeft, ChevronRight, GripVertical, ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { preparePublicImage } from "@/lib/public-image-processing";
import {
  MAX_IDEA_IMAGES,
  summarizeUnsupportedFileNames,
  validateIdeaImageSelection
} from "@/lib/idea-image-selection";

type TouchDragPreview = { src: string; x: number; y: number; width: number };
type UploadTask = {
  id: string;
  file: File;
  previewUrl: string;
  status: "preparing" | "uploading" | "error";
  progress: number;
  error: string;
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

function uploadPreparedImage(file: File, onProgress: (progress: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/community/idea-images");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.max(12, Math.round((event.loaded / event.total) * 96)));
    };
    request.onerror = () => reject(new Error("Unable to upload this image. Check your connection and retry."));
    request.onload = () => {
      const payload = request.response || {};
      const reference = payload?.data?.reference;
      if (request.status >= 200 && request.status < 300 && typeof reference === "string") {
        onProgress(100);
        resolve(reference);
      } else {
        reject(new Error(typeof payload?.message === "string" ? payload.message : "Unable to upload this image."));
      }
    };
    const formData = new FormData();
    formData.append("file", file, file.name);
    request.send(formData);
  });
}

export default function EditableIdeaImages({
  images,
  onChange,
  addLabel = "Add image",
  preparingLabel = "Preparing image…",
  uploadingLabel = "Uploading image…",
  retryLabel = "Retry",
  onBusyChange,
  limitMessage = "You can upload up to 9 images.",
  reorderHint = "Drag to reorder. On mobile, press and hold, then drag.",
  errorMessage = "Unable to prepare this image.",
  capacityErrorMessage = (selected, remaining, excess) => `You selected ${selected} images. TYORA allows 9 in total and you have ${remaining} spaces left. Remove ${excess} and try again. Nothing was uploaded.`,
  unsupportedFilesMessage = (files) => `Unsupported file selected: ${files}. Choose JPG, PNG, or WebP. Nothing was uploaded.`
}: {
  images: string[];
  onChange: (images: string[]) => void;
  addLabel?: string;
  preparingLabel?: string;
  uploadingLabel?: string;
  retryLabel?: string;
  onBusyChange?: (busy: boolean) => void;
  limitMessage?: string;
  reorderHint?: string;
  errorMessage?: string;
  capacityErrorMessage?: (selected: number, remaining: number, excess: number) => string;
  unsupportedFilesMessage?: (files: string) => string;
}) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [message, setMessage] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [touchPreview, setTouchPreview] = useState<TouchDragPreview | null>(null);
  const liveImages = useRef(images);
  const liveTasks = useRef(tasks);
  const onBusyChangeRef = useRef(onBusyChange);
  const draggingIndex = useRef<number | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDraggingIndex = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number; src: string; width: number } | null>(null);
  const suppressClick = useRef(false);
  const mounted = useRef(true);
  const busy = tasks.some((task) => task.status !== "error");
  const hasPendingTasks = tasks.length > 0;

  useEffect(() => { liveImages.current = images; }, [images]);
  useEffect(() => { liveTasks.current = tasks; }, [tasks]);
  useEffect(() => { onBusyChangeRef.current = onBusyChange; }, [onBusyChange]);
  useEffect(() => { onBusyChange?.(hasPendingTasks); }, [hasPendingTasks, onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      onBusyChangeRef.current?.(false);
      if (touchTimer.current) clearTimeout(touchTimer.current);
      liveTasks.current.forEach((task) => URL.revokeObjectURL(task.previewUrl));
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

  function updateTask(id: string, update: Partial<UploadTask>) {
    if (!mounted.current) return;
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...update } : task));
  }

  async function processTask(task: UploadTask) {
    try {
      updateTask(task.id, { status: "preparing", progress: 6, error: "" });
      const prepared = await preparePublicImage(task.file, {
        maxDimension: 2048,
        quality: 0.82,
        maxFileSize: 1_500_000,
        minimumDimension: 600,
        errors: { prepare: errorMessage, tooLarge: errorMessage }
      });
      updateTask(task.id, { status: "uploading", progress: 12 });
      return await uploadPreparedImage(prepared.file, (progress) => updateTask(task.id, { progress }));
    } catch (error) {
      updateTask(task.id, {
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : errorMessage
      });
      return null;
    }
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const candidates = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = "";
    if (!candidates.length) return;

    const validation = validateIdeaImageSelection(candidates, images.length + tasks.length);
    if (!validation.ok) {
      if (validation.reason === "unsupported") {
        setMessage(unsupportedFilesMessage(summarizeUnsupportedFileNames(validation.unsupported)));
      } else {
        setMessage(capacityErrorMessage(validation.selected, validation.remaining, validation.excess));
      }
      return;
    }

    setMessage("");
    const batch = candidates.map((file, index): UploadTask => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "preparing",
      progress: 2,
      error: ""
    }));
    setTasks((current) => [...current, ...batch]);
    const results: Array<string | null> = new Array(batch.length).fill(null);
    let cursor = 0;
    async function worker() {
      while (cursor < batch.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await processTask(batch[index]);
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, batch.length) }, () => worker()));
    if (!mounted.current) return;
    const uploaded = results.filter((value): value is string => Boolean(value));
    if (uploaded.length) {
      const next = [...liveImages.current, ...uploaded].slice(0, MAX_IDEA_IMAGES);
      liveImages.current = next;
      onChange(next);
    }
    const successfulIds = new Set(batch.filter((_, index) => results[index]).map((task) => task.id));
    batch.filter((task) => successfulIds.has(task.id)).forEach((task) => URL.revokeObjectURL(task.previewUrl));
    setTasks((current) => current.filter((task) => !successfulIds.has(task.id)));
  }

  async function retryTask(task: UploadTask) {
    const reference = await processTask(task);
    if (!reference || !mounted.current) return;
    const next = [...liveImages.current, reference].slice(0, MAX_IDEA_IMAGES);
    liveImages.current = next;
    onChange(next);
    URL.revokeObjectURL(task.previewUrl);
    setTasks((current) => current.filter((item) => item.id !== task.id));
  }

  function removeTask(task: UploadTask) {
    URL.revokeObjectURL(task.previewUrl);
    setTasks((current) => current.filter((item) => item.id !== task.id));
  }

  function moveImage(sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex) return;
    const next = [...liveImages.current];
    const [moved] = next.splice(sourceIndex, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    liveImages.current = next;
    onChange(next);
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

  const occupiedCount = images.length + tasks.length;

  return (
    <div>
      {images.length > 1 ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">
          <GripVertical size={15} className="shrink-0 text-[var(--color-primary)]" />
          <span>{reorderHint}</span>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, index) => {
          const duplicateNumber = images.slice(0, index).filter((item) => item === src).length;
          const active = activeDragIndex === index;
          return (
            <motion.div layout transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }} key={`${imageKey(src)}-${duplicateNumber}`}>
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
                onClick={() => { if (!suppressClick.current) setPreviewIndex(index); }}
                className={`group relative aspect-[4/3] select-none overflow-hidden rounded-2xl border bg-[var(--color-surface-muted)] transition-[border-color,box-shadow,opacity,transform] duration-200 active:cursor-grabbing ${active ? "z-10 cursor-grabbing border-[#2563eb] opacity-45 shadow-[0_12px_30px_rgba(37,99,235,0.2)] ring-2 ring-[#2563eb]/20" : "cursor-grab border-[var(--color-border)] hover:border-[#93b4f8] hover:shadow-md"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img aria-hidden="true" draggable={false} src={src} alt="" className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-15 blur-xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img draggable={false} src={src} alt={`Idea image ${index + 1}`} className="pointer-events-none relative size-full object-contain" />
                <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-white/92 text-xs font-bold text-[#155eef] shadow-sm">{index + 1}</span>
                <span className={`absolute bottom-2 left-2 grid size-11 place-items-center rounded-full bg-[#0b1426]/78 text-white shadow-sm transition ${active ? "scale-110 opacity-100" : "opacity-80 sm:opacity-0 sm:group-hover:opacity-100"}`}><GripVertical size={17} /></span>
                <button type="button" onClick={(event) => { event.stopPropagation(); liveImages.current = images.filter((_, itemIndex) => itemIndex !== index); onChange(liveImages.current); }} className="absolute right-1 top-1 grid size-11 place-items-center rounded-full bg-white/94 text-[#667085] shadow-sm transition hover:bg-[#fff1f2] hover:text-[#be123c]" aria-label={`Remove image ${index + 1}`}><X size={17} /></button>
              </div>
            </motion.div>
          );
        })}
        {tasks.map((task) => (
          <div key={task.id} className={`relative aspect-[4/3] overflow-hidden rounded-2xl border ${task.status === "error" ? "border-[#fda4af] bg-[#fff1f2]" : "border-[#bfdbfe] bg-[#eff6ff]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={task.previewUrl} alt="" className="size-full object-cover opacity-55" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07101d]/58 p-2 text-center text-white">
              {task.status === "error" ? <AlertCircle size={22} /> : <Loader2 className="animate-spin" size={22} />}
              <span className="mt-1 line-clamp-2 text-[11px] font-semibold">{task.status === "preparing" ? preparingLabel : task.status === "uploading" ? uploadingLabel : task.error}</span>
              {task.status !== "error" ? (
                <div className="mt-2 h-1.5 w-4/5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-[width] duration-150" style={{ width: `${task.progress}%` }} /></div>
              ) : (
                <button type="button" onClick={() => retryTask(task)} className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-full bg-white px-3 text-xs font-bold text-[#155eef]"><RotateCcw size={14} />{retryLabel}</button>
              )}
            </div>
            {task.status === "error" ? <button type="button" onClick={() => removeTask(task)} aria-label="Remove failed image" className="absolute right-1 top-1 grid size-11 place-items-center rounded-full bg-white text-[#be123c] shadow"><X size={17} /></button> : null}
          </div>
        ))}
        {occupiedCount < MAX_IDEA_IMAGES ? (
          <label className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#93b4f8] bg-[#f8fbff] text-center text-[#155eef] transition ${busy ? "cursor-wait opacity-60" : "cursor-pointer hover:border-[#155eef] hover:bg-[#eef6ff]"}`}>
            {busy ? <Loader2 className="animate-spin" size={26} /> : <ImagePlus size={30} />}
            <span className="px-2 text-xs font-bold">{busy ? uploadingLabel : addLabel}</span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy} onChange={addFiles} />
          </label>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]"><span>{limitMessage}</span><strong>{occupiedCount}/{MAX_IDEA_IMAGES}</strong></div>
      {message ? <p role="alert" aria-live="assertive" className="mt-2 rounded-xl bg-[#fff7ed] px-3 py-2 text-xs text-[#9a3412]">{message}</p> : null}
      {touchPreview ? (
        <div aria-hidden="true" className="pointer-events-none fixed z-[140] aspect-[4/3] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-[#2563eb] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.35)] ring-4 ring-[#2563eb]/15" style={{ left: touchPreview.x, top: touchPreview.y, width: Math.min(touchPreview.width, 280) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={touchPreview.src} alt="" className="size-full object-contain" />
        </div>
      ) : null}
      {previewIndex !== null && images[previewIndex] ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] grid place-items-center bg-[#07101d]/94 p-4 backdrop-blur-sm" onClick={() => setPreviewIndex(null)}>
          <button type="button" onClick={() => setPreviewIndex(null)} aria-label="Close preview" className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-white/12 text-white"><X size={20} /></button>
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
