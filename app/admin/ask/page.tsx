import AskAdminClient from "./ask-admin-client";
import { hasAdminSession } from "@/lib/server/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Admin Ask TYORA"
};

export default async function AdminAskPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }

  return <AskAdminClient />;
}
