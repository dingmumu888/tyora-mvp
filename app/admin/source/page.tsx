import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/server/admin-auth";
import SourceAdminClient from "./source-admin-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Source Products | TYORA OS"
};

export default async function AdminSourcePage() {
  if (!(await hasAdminSession())) redirect("/admin");
  return <SourceAdminClient />;
}
