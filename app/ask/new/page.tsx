import NewIdeaClient from "./new-idea-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Start a Discussion | Ask TYORA Community"
};

export default function NewIdeaPage() {
  return <NewIdeaClient />;
}
