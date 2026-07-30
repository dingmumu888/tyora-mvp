"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Settings } from "lucide-react";
import CommunityProfileModal, { type CommunitySessionUser } from "@/components/community-profile-modal";
import { usePublicLanguage } from "@/components/public-language-provider";

export default function CommunityProfileEditor({ user }: { user: CommunitySessionUser }) {
  const router = useRouter();
  const { copy } = usePublicLanguage();
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-3 text-xs font-semibold text-[#59616e] transition hover:bg-[#f6f7fb] hover:text-[#101216]"
      >
        <Settings size={15} aria-hidden="true" />
        {copy.common.editProfile}
      </button>
      <CommunityProfileModal
        open={open}
        user={currentUser}
        mode="edit"
        onClose={() => setOpen(false)}
        onSaved={(nextUser) => {
          setCurrentUser(nextUser);
          router.refresh();
        }}
      />
    </>
  );
}
