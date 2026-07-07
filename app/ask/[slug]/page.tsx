import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Box, Clock, FileText, MessageCircle, PackageCheck, Sparkles } from "lucide-react";
import { CommunityStatus } from "@/lib/community";
import { getCommunityIdeaBySlug } from "@/lib/server/community-store";
import CommunityImage from "@/components/community-image";
import CommunityAvatar from "@/components/community-avatar";
import IdeaActions from "./idea-actions";

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

const timeline = ["Idea", "Discussion", "TYORA Review", "Prototype", "Manufacturing", "Shipping", "Delivered"];
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8]";

function progressFor(status: CommunityStatus) {
  if (status === "Completed") return 7;
  if (status === "Shipping") return 6;
  if (status === "Manufacturing") return 5;
  if (status === "Project Started") return 4;
  if (status === "TYORA Reviewing") return 3;
  return 2;
}

function timeLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  const progress = progressFor(idea.status);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f6f7fb_36%,#f7f5f0_100%)] pb-24 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e8ebef]/90 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/ask" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Ask TYORA</Link>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[idea.status]}`}>{idea.status}</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1520px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:px-8">
        <aside className="hidden space-y-3 self-start lg:sticky lg:top-20 lg:block">
          <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#2563eb] text-white"><Sparkles size={18} /></div>
            <h2 className="mt-3 text-lg font-semibold">Community Thread</h2>
            <p className="mt-2 text-sm leading-6 text-[#69707d]">This idea grows through discussion, TYORA review, project start and delivery.</p>
            <Link href="/ask/new" className={`mt-4 inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold ${primaryButton}`}>Start a Discussion</Link>
          </section>
          <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-3">
            {["Idea", "Community Discussion", "TYORA Expert Review", "Ready to Build"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className="block rounded-xl px-3 py-2 text-sm font-medium text-[#59616e] hover:bg-[#f5f6f8]">{item}</a>
            ))}
          </section>
        </aside>

        <article className="min-w-0 space-y-3">
          <section id="idea" className="overflow-hidden rounded-[20px] border border-[#e4e8ef] bg-white shadow-sm shadow-[#101216]/4">
            <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
              <div className="relative min-h-[220px] bg-gradient-to-br from-[#e9f7f3] via-white to-[#efe9ff]">
                <CommunityImage src={idea.imageUrls[0]} alt={idea.title} className="absolute inset-0 size-full object-cover" fallbackClassName="absolute inset-0 p-8" initialsClassName="size-24 rounded-[28px] text-3xl" />
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-sm font-medium text-[#69707d]">{idea.id}</p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">{idea.title}</h1>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#69707d]">
                  <span className="rounded-full bg-[#f4f6f8] px-3 py-1">{idea.category}</span>
                  <span className="rounded-full bg-[#f4f6f8] px-3 py-1">{idea.country}</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f4f6f8] px-3 py-1"><CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="size-5 border-0 text-[9px]" /> By {idea.author.name}</span>
                  <span className="rounded-full bg-[#f4f6f8] px-3 py-1">{timeLabel(idea.createdAt)}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#59616e] sm:text-base">{idea.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {idea.questions.map((question) => <span key={question} className="rounded-full border border-[#e8ebef] px-3 py-1 text-xs font-medium text-[#59616e]">{question}</span>)}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#69707d]">Project Timeline</p>
                <h2 className="mt-1 text-2xl font-semibold">From idea to delivered product</h2>
              </div>
              <Clock className="text-[#69707d]" size={20} />
            </div>
            <div className="mt-6 grid grid-cols-7 gap-2">
              {timeline.map((step, index) => (
                <div key={step} className="min-w-0">
                  <div className={`h-2 rounded-full ${index < progress ? "bg-[#14b8a6]" : "bg-[#e8ebef]"}`} />
                  <p className="mt-2 truncate text-[11px] font-medium text-[#69707d]">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="tyora-expert-review" className="rounded-[18px] border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-[#14b8a6]" />
              <h2 className="text-2xl font-semibold">TYORA Expert Review</h2>
            </div>
            {idea.review ? (
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Manufacturing Feasible", idea.review.manufacturingFeasible],
                  ["Estimated Cost Range", idea.review.estimatedCostRange],
                  ["Suggested Material", idea.review.suggestedMaterial],
                  ["Estimated MOQ", idea.review.estimatedMoq],
                  ["Suggested Manufacturing Process", idea.review.suggestedManufacturing],
                  ["Factories Matched", idea.review.factoriesMatched],
                  ["Additional Notes", idea.review.additionalNotes]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f8fa] p-4">
                    <dt className="text-sm font-semibold">{label}</dt>
                    <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{value || "Not provided yet."}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 rounded-2xl bg-[#fff7d6] p-4 text-sm leading-6 text-[#8a5a00]">
                TYORA has not replied yet. TYORA reviews manufacturing feasibility, cost, materials, MOQ, process and factory fit. It never predicts market demand.
              </p>
            )}
          </section>

          <section id="community-discussion" className="rounded-[18px] border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Community Discussion</h2>
              <span className="inline-flex items-center gap-1 text-sm text-[#69707d]"><MessageCircle size={15} /> {idea.comments.length}</span>
            </div>
            <div className="mt-5 space-y-3">
              {idea.comments.length === 0 ? <p className="rounded-2xl bg-[#f7f8fa] p-4 text-sm text-[#69707d]">No public comments yet.</p> : null}
              {idea.comments.map((comment) => (
                <article key={comment.id} className={`rounded-2xl border border-[#eef1f4] bg-[#fbfbfc] p-4 ${comment.parentId ? "ml-6" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold"><CommunityAvatar name={comment.author.name} src={comment.author.avatar} className="size-7 border-0 text-[10px]" /> {comment.author.name}</p>
                    <span className="text-xs text-[#8b93a1]">{timeLabel(comment.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{comment.body}</p>
                  <p className="mt-3 text-xs text-[#69707d]">{comment.likeCount} likes</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-dashed border-[#cfd5dc] bg-white p-5">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-[#69707d]" />
              <h2 className="text-xl font-semibold">Files</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#69707d]">Reference files, CAD, drawings, and production documents will appear here as the project grows.</p>
          </section>
        </article>

        <aside className="space-y-3 self-start lg:sticky lg:top-20">
          <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold">Current Status</h2>
            <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusStyles[idea.status]}`}>{idea.status}</p>
            <p className="mt-4 text-sm leading-6 text-[#69707d]">The same post grows through discussion, TYORA review, project start, manufacturing, shipping, and completion.</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-[#69707d]">
              <span className="rounded-2xl bg-[#f7f8fa] p-3">{idea.likeCount}<br />Love</span>
              <span className="rounded-2xl bg-[#f7f8fa] p-3">{idea.comments.length}<br />Comments</span>
              <span className="rounded-2xl bg-[#f7f8fa] p-3">{idea.interestedCount}<br />I&apos;d Buy</span>
            </div>
          </section>

          <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4">
            <div className="flex items-center gap-2">
              <Box size={18} />
              <h2 className="text-lg font-semibold">Manufacturing Scope</h2>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
              <span>Category: {idea.category}</span>
              <span>Country: {idea.country}</span>
              <span>Visibility: {idea.visibility}</span>
              <span>{idea.locked ? "Comments locked" : "Discussion open"}</span>
            </div>
          </section>

          <IdeaActions idea={idea} />

          <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4">
            <h2 className="text-lg font-semibold">Live Activity</h2>
            <div className="mt-4 space-y-3 text-sm text-[#59616e]">
              <p className="flex items-center gap-2 rounded-2xl bg-[#f7f8fa] p-3"><CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="size-7 border-0 text-[10px]" /> {idea.author.name} started this discussion.</p>
              {idea.review ? <p className="rounded-2xl bg-[#f7f8fa] p-3">TYORA expert review is available.</p> : <p className="rounded-2xl bg-[#f7f8fa] p-3">Waiting for TYORA expert review.</p>}
              <p className="rounded-2xl bg-[#f7f8fa] p-3">{idea.comments.length} community comments.</p>
            </div>
          </section>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8ebef] bg-white/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <p className="text-sm font-semibold">Ready to build?</p>
          <Link href="#continue" className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${primaryButton}`}>
            Continue <PackageCheck size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
