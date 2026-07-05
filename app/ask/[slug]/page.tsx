import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommunityIdeaBySlug } from "@/lib/server/community-store";
import IdeaActions from "./idea-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getCommunityIdeaBySlug(slug);
  return {
    title: idea ? `${idea.title} | Ask TYORA Community` : "Ask TYORA Idea",
    description: idea?.description || "Manufacturing discussion on Ask TYORA Community."
  };
}

export default async function CommunityIdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getCommunityIdeaBySlug(slug);
  if (!idea) notFound();

  return (
    <main className="min-h-screen bg-white text-[#101216]">
      <header className="border-b border-[#eef1f4]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/ask" className="text-sm font-semibold">Ask TYORA</Link>
          <span className="rounded-full border border-[#e8ebef] px-3 py-1 text-xs text-[#69707d]">{idea.status}</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <article className="space-y-8">
          <section className="rounded-[8px] border border-[#e8ebef] p-6">
            <p className="text-sm font-medium text-[#69707d]">{idea.id}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{idea.title}</h1>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#69707d]">
              <span>{idea.category}</span>
              <span>{idea.country}</span>
              <span>By {idea.author.name}</span>
              <span>{new Date(idea.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-[#59616e]">{idea.description}</p>
            {idea.imageUrls.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#69707d]">
                {idea.imageUrls.map((image) => <span key={image} className="rounded-full bg-[#f5f6f8] px-3 py-1">{image}</span>)}
              </div>
            ) : null}
          </section>

          <section className="rounded-[8px] border border-[#e8ebef] p-6">
            <h2 className="text-2xl font-semibold">TYORA Expert Review</h2>
            {idea.review ? (
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Manufacturing Feasible", idea.review.manufacturingFeasible],
                  ["Estimated Cost Range", idea.review.estimatedCostRange],
                  ["Suggested Material", idea.review.suggestedMaterial],
                  ["Estimated MOQ", idea.review.estimatedMoq],
                  ["Suggested Manufacturing Process", idea.review.suggestedManufacturing],
                  ["Factories Matched", idea.review.factoriesMatched],
                  ["Additional Notes", idea.review.additionalNotes]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[6px] bg-[#f8f9fa] p-4">
                    <dt className="text-sm font-semibold">{label}</dt>
                    <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{value || "Not provided yet."}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-[#59616e]">TYORA has not replied yet. TYORA reviews manufacturing only and never predicts market demand.</p>
            )}
          </section>

          <section className="rounded-[8px] border border-[#e8ebef] p-6">
            <h2 className="text-2xl font-semibold">Comments</h2>
            <div className="mt-5 space-y-3">
              {idea.comments.length === 0 ? <p className="text-sm text-[#69707d]">No public comments yet.</p> : idea.comments.map((comment) => (
                <article key={comment.id} className={`rounded-[6px] bg-[#f8f9fa] p-4 ${comment.parentId ? "ml-6" : ""}`}>
                  <p className="text-sm font-semibold">{comment.author.name}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{comment.body}</p>
                  <p className="mt-2 text-xs text-[#69707d]">{comment.likeCount} likes · {new Date(comment.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </section>
        </article>

        <aside className="space-y-5">
          <section className="rounded-[8px] border border-[#e8ebef] p-5">
            <h2 className="text-lg font-semibold">Current Status</h2>
            <p className="mt-2 text-2xl font-semibold">{idea.status}</p>
            <p className="mt-3 text-sm leading-6 text-[#69707d]">The same post grows through discussion, TYORA review, project start, manufacturing, shipping, and completion.</p>
          </section>
          <IdeaActions idea={idea} />
        </aside>
      </section>
    </main>
  );
}
