"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";

export default function CreatorAvatarViewer({ name, src }: { name: string; src?: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; centerX: number; centerY: number; scale: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setView({ scale: 1, x: 0, y: 0 });
    pointers.current.clear();
    gesture.current = null;
  }

  function pair() {
    const [first, second] = [...pointers.current.values()];
    if (!first || !second) return null;
    return {
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      centerX: (first.x + second.x) / 2,
      centerY: (first.y + second.y) / 2
    };
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = pair();
    if (points) gesture.current = { ...points, scale: view.scale, x: view.x, y: view.y };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = pair();
    const start = gesture.current;
    if (!points || !start) return;
    const scale = Math.min(4, Math.max(1, start.scale * (points.distance / start.distance)));
    setView({
      scale,
      x: scale === 1 ? 0 : start.x + points.centerX - start.centerX,
      y: scale === 1 ? 0 : start.y + points.centerY - start.centerY
    });
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-full outline-none transition hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-[#155eef]/20" aria-label={`Enlarge ${name}'s avatar`}>
        <CommunityAvatar name={name} src={src} className="size-24 border-4 border-white text-2xl shadow-lg sm:size-28" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] grid touch-none place-items-center overflow-hidden bg-[#05070b]/88 p-3 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" onClick={close} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
          <button type="button" onClick={close} className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/12 text-white transition hover:bg-white/20" aria-label="Close avatar preview">
            <X size={22} />
          </button>
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setView((current) => { const scale = Math.max(1, current.scale - 0.25); return { ...current, scale, x: scale === 1 ? 0 : current.x, y: scale === 1 ? 0 : current.y }; })} disabled={view.scale <= 1} className="grid size-11 place-items-center rounded-full bg-white/12 text-white disabled:opacity-35" aria-label="Zoom out"><Minus size={18} /></button>
            <button type="button" onClick={() => setView((current) => ({ ...current, scale: Math.min(4, current.scale + 0.25) }))} disabled={view.scale >= 4} className="grid size-11 place-items-center rounded-full bg-white/12 text-white disabled:opacity-35" aria-label="Zoom in"><Plus size={18} /></button>
          </div>
          <div onClick={(event) => event.stopPropagation()} onDoubleClick={() => setView(view.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2, x: 0, y: 0 })} style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`, transition: pointers.current.size ? "none" : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <CommunityAvatar name={name} src={src} className="size-[min(88vw,78vh,520px)] border-4 border-white/20 text-7xl shadow-2xl" />
          </div>
        </div>
      ) : null}
    </>
  );
}
