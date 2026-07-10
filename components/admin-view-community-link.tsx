import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type AdminViewCommunityLinkProps = {
  className?: string;
};

export function AdminViewCommunityLink({ className = "" }: AdminViewCommunityLinkProps) {
  return (
    <Link
      href="/ask"
      target="_blank"
      rel="noreferrer"
      className={`inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white ${className}`}
    >
      View Community <ArrowUpRight size={15} />
    </Link>
  );
}
