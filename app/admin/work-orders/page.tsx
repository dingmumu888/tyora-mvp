import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/server/admin-auth";
import WorkOrdersAdminClient from "./work-orders-admin-client";

export const metadata = {
  title: "Unified Inbox | TYORA Admin",
  robots: { index: false, follow: false }
};

function deploymentEnvironmentLabel() {
  const value = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (value === "production") return "Production";
  if (value === "preview") return "Preview";
  if (value === "development") return "Development";
  return "Current environment";
}

export default async function WorkOrdersAdminPage({
  searchParams
}: {
  searchParams: Promise<{ submission?: string; kind?: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin");
  const params = await searchParams;
  const submissionId = typeof params.submission === "string" && params.submission.length <= 200
    ? params.submission.trim()
    : undefined;
  const recordKind = typeof params.kind === "string" && params.kind.length <= 64
    ? params.kind.trim()
    : undefined;
  return (
    <WorkOrdersAdminClient
      initialSubmissionId={submissionId}
      initialRecordKind={recordKind}
      environmentLabel={deploymentEnvironmentLabel()}
    />
  );
}
