import AskAdminClient from "./ask-admin-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Admin Ask TYORA"
};

export default function AdminAskPage() {
  return <AskAdminClient />;
}
