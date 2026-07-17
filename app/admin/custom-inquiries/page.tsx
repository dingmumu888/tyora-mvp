import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/server/admin-auth";
import CustomInquiriesAdminClient from "./custom-inquiries-admin-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Private Custom Queue | TYORA OS" };

export default async function CustomInquiriesAdminPage() {
  if (!(await hasAdminSession())) redirect("/admin");
  return <CustomInquiriesAdminClient />;
}
