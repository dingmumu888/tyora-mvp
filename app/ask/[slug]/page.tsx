import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { CommunityStatus } from "@/lib/community";
import { getCommunityIdeaBySlug } from "@/lib/server/community-store";
import CommunityAvatar from "@/components/community-avatar";
import IdeaActions from "./idea-actions";
import IdeaComments from "./idea-comments";
import IdeaImageGallery from "./idea-image-gallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusStyles: Record<CommunityStatus, string> = {
  Discussing: "bg-[#f0eaff] text-[#6d28d9] ring-[#ddd0ff]",
  "TYORA Reviewing": "bg-[#fff7d6] text-[#8a5a00] ring-[#ffe89a]",
  "Project Started": "bg-[#e9f2ff] text-[#1d4ed8] ring-[#c9ddff]",
  Manufacturing: "bg-[#fff0df] text-[#c2410c] ring-[#ffd8ad]",
  Shipping: "bg-[#edf4ff] text-[#315fbd] ring-[#d4e4ff]",
  Completed: "bg-[#e8f8ef] text-[#15803d] ring-[#c9efd8]"
};

function timeLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function expertReplyText(idea: Awaited<ReturnType<typeof getCommunityIdeaBySlug>>) {
  if (!idea?.review) return "";
  if (idea.review.additionalNotes) return idea.review.additionalNotes;
  return [
    ["Manufacturing feasible", idea.review.manufacturingFeasible],
    ["Estimated cost range", idea.review.estimatedCostRange],
    ["Suggested material", idea.review.suggestedMaterial],
    ["Estimated MOQ", idea.review.estimatedMoq],
    ["Suggested manufacturing process", idea.review.suggestedManufacturing],
    ["Factories matched", idea.review.factoriesMatched]
  ]
    .map(([label, value]) => value ? `${label}: ${value}` : "")
    .filter(Boolean)
    .join("\n\n");
}

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
  const expertReply = expertReplyText(idea);
  const compactMeta = [
    { value: idea.category, tone: "bg-[#edf4ff] text-[#2563eb]" },
    { value: idea.country, tone: "bg-[#f4f6f8] text-[#667085]" },
    ...idea.questions.slice(0, 2).map((question) => ({ value: question, tone: "bg-[#f4f6f8] text-[#667085]" }))
  ].filter((item) => item.value && item.value !== "Not specified");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f6f7fb_38%,#f7f5f0_100%)] pb-28 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e8ebef]/90 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/ask" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Ask TYORA</Link>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[idea.status]}`}>{idea.status}</span>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-3 px-3 py-3 sm:px-5">
        <section className="rounded-[24px] border border-[#e4e8ef] bg-white p-3 shadow-sm shadow-[#101216]/4 sm:p-4">
          <div className="flex items-center gap-3">
            <CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="size-11 border-0 text-sm" />
            <div className="min-w-0">
              <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-semibold">
                <span className="truncate">{idea.author.name}</span>
                {compactMeta[0] ? <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${compactMeta[0].tone}`}>{compactMeta[0].value}</span> : null}
              </p>
              <p className="text-xs text-[#8b93a1]">{timeLabel(idea.createdAt)} · {idea.visibility}</p>
            </div>
            <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusStyles[idea.status]}`}>{idea.status}</span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl">{idea.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[#343b47]">{idea.description}</p>

          <div className="mt-4">
            <IdeaImageGallery imageUrls={idea.imageUrls} title={idea.title} />
          </div>

          {compactMeta.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {compactMeta.slice(1).map((item) => (
                <span key={item.value} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone}`}>{item.value}</span>
              ))}
            </div>
          ) : null}

          <IdeaActions idea={idea} mode="bar" compact />
        </section>

        <section id="tyora-expert-review" className="rounded-[18px] border border-[#99f6e4] bg-white p-3 shadow-sm shadow-[#14b8a6]/10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#14b8a6]" />
            <h2 className="text-base font-semibold text-[#0f766e]">TYORA Expert Review</h2>
          </div>
          {idea.review ? (
            <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-[#f0fdfa] p-3 text-sm leading-6 text-[#115e59]">{expertReply || "TYORA has replied, but no public reply text is available yet."}</p>
          ) : (
            <p className="mt-2 rounded-2xl bg-[#f0fdfa] p-3 text-sm leading-6 text-[#0f766e]">TYORA review will appear here after review.</p>
          )}
        </section>

        <IdeaComments slug={idea.slug} comments={idea.comments} />
        <IdeaActions idea={idea} mode="comment" />
        <IdeaActions idea={idea} mode="ready" />

        <section className="rounded-[20px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
          <h2 className="text-lg font-semibold">Live Activity</h2>
          <div className="mt-4 space-y-2 text-sm text-[#59616e]">
            <p className="flex items-center gap-2 rounded-2xl bg-[#f7f8fa] p-3"><CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="size-7 border-0 text-[10px]" /> {idea.author.name} started this discussion.</p>
            {idea.review ? <p className="rounded-2xl bg-[#f7f8fa] p-3">TYORA expert review is available.</p> : <p className="rounded-2xl bg-[#f7f8fa] p-3">Waiting for TYORA expert review.</p>}
            <p className="inline-flex items-center gap-2 rounded-2xl bg-[#f7f8fa] p-3"><MessageCircle size={15} /> {idea.comments.length} community comments.</p>
          </div>
        </section>
      </article>
    </main>
  );
}
