"use client";

import { useState } from "react";
import { Expand, Trash2, X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  index?: number;
  caption?: string;
  className?: string;
  onRemove?: () => void;
  removeLabel?: string;
};

export default function PublicUploadImagePreview({
  src,
  alt,
  index,
  caption,
  className = "",
  onRemove,
  removeLabel = `Remove ${alt}`
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`group relative overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative block aspect-[4/3] w-full overflow-hidden bg-[#f8fafc]"
          aria-label={`View full image: ${alt}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img aria-hidden="true" src={src} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-20 blur-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="relative size-full object-contain" />
          <span className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-[#344054] opacity-0 shadow-sm transition group-hover:opacity-100">
            <Expand size={15} />
          </span>
        </button>
        {typeof index === "number" ? (
          <span className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/92 text-xs font-semibold text-[#2563eb] shadow-sm">
            {index + 1}
          </span>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/92 text-[#59616e] shadow-sm transition hover:bg-[#fff1f2] hover:text-[#be123c]"
            aria-label={removeLabel}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
        {caption ? <p className="truncate px-3 py-2 text-xs font-medium text-[#69707d]">{caption}</p> : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#07101f]/96 text-white" role="dialog" aria-modal="true" aria-label={alt}>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="truncate text-sm font-semibold">{alt}</p>
            <button type="button" onClick={() => setOpen(false)} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/12" aria-label="Close image">
              <X size={20} />
            </button>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6" aria-label="Close image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
          </button>
        </div>
      ) : null}
    </>
  );
}
