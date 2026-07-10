import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/server/admin-auth";
import WorkOrdersAdminClient from "./work-orders-admin-client";

export const metadata = {
  title: "Work Orders | TYORA Admin",
  robots: { index: false, follow: false }
};

export default async function WorkOrdersAdminPage() {
  if (!(await hasAdminSession())) redirect("/admin");
  return <WorkOrdersAdminClient />;
}
