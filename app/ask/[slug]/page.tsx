import IdeaClient from "./idea-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Ask TYORA Idea",
  description: "Review a submitted product idea and continue the project with TYORA."
};

export default async function AskIdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <IdeaClient slug={slug} />;
}
