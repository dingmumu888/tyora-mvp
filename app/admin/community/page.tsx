import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/server/admin-auth";
import CommunityAdminClient from "./community-admin-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Admin Community | TYORA"
};

export default async function AdminCommunityPage() {
  if (!(await hasAdminSession())) redirect("/admin");
  return <CommunityAdminClient />;
}
