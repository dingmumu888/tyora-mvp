import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/server/admin-auth";
import LeadFinderClient from "./lead-finder-client";

export const metadata: Metadata = {
  title: "TYORA Lead Finder",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  try {
    if (!(await hasAdminSession())) redirect("/admin");
  } catch {
    redirect("/admin");
  }

  return <LeadFinderClient />;
}
