"use client";

import { useState } from "react";
import { X } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";

export default function CreatorAvatarViewer({ name, src }: { name: string; src?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-full outline-none transition hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-[#155eef]/20" aria-label={`Enlarge ${name}'s avatar`}>
        <CommunityAvatar name={name} src={src} className="size-24 border-4 border-white text-2xl shadow-lg sm:size-28" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#05070b]/80 p-5 backdrop-blur-md" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <button type="button" onClick={() => setOpen(false)} className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white/12 text-white transition hover:bg-white/20" aria-label="Close avatar preview">
            <X size={22} />
          </button>
          <div onClick={(event) => event.stopPropagation()}>
            <CommunityAvatar name={name} src={src} className="size-[min(76vw,480px)] border-4 border-white/20 text-7xl shadow-2xl" />
          </div>
        </div>
      ) : null}
    </>
  );
}
