import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useAdminLanguage } from "@/components/admin/admin-language-provider";

type AdminViewCommunityLinkProps = {
  className?: string;
};

export function AdminViewCommunityLink({ className = "inline-flex" }: AdminViewCommunityLinkProps) {
  const { t } = useAdminLanguage();
  return (
    <Link
      href="/ask"
      target="_blank"
      rel="noreferrer"
      className={`h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white ${className}`}
    >
      {t("View Community")} <ArrowUpRight size={15} />
    </Link>
  );
}
