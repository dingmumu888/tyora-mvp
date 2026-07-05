import Link from "next/link";
import { MessageCircle, Plus, Search, Sparkles } from "lucide-react";
import { CommunityFeedSort } from "@/lib/community";
import { getCommunityIdeas } from "@/lib/server/community-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Ask TYORA Community",
  description: "A free manufacturing discussion community for product creators."
};

const tabs: Array<[CommunityFeedSort, string]> = [
  ["newest", "Newest"],
  ["trending", "Trending"],
  ["recently-active", "Recently Active"],
  ["latest-tyora-reply", "Latest TYORA Reply"],
  ["latest-comments", "Latest Comments"],
  ["latest-uploaded", "Latest Uploaded"]
];

export default async function AskCommunityPage({ searchParams }: { searchParams: Promise<{ sort?: CommunityFeedSort }> }) {
  const { sort = "newest" } = await searchParams;
  const ideas = await getCommunityIdeas(sort);
  const latestReviews = ideas.filter((idea) => idea.review).slice(0, 4);
  const latestComments = ideas.flatMap((idea) => idea.comments.map((comment) => ({ idea, comment }))).slice(-4).reverse();
  const liveActivity = [
    ...ideas.slice(0, 4).map((idea) => `${idea.author.name} uploaded ${idea.title}.`),
    ...latestReviews.map((idea) => `TYORA replied to ${idea.title}.`),
    ...latestComments.map(({ idea, comment }) => `${comment.author.name} commented on ${idea.title}.`)
  ].slice(0, 8);

  return (
    <main className="min-h-screen bg-white text-[#101216]">
      <header className="border-b border-[#eef1f4]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold">TYORA</Link>
          <div className="flex items-center gap-3">
            <a href="/api/community/auth/google" className="hidden rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold sm:inline-flex">Google Login</a>
            <Link href="/ask/new" className="inline-flex items-center gap-2 rounded-full bg-[#101216] px-4 py-2 text-sm font-semibold text-white">
              <Plus size={16} /> Upload My Idea
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.68fr_0.32fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e8ebef] px-3 py-1 text-sm text-[#69707d]">
              <Sparkles size={15} /> Ask TYORA Community
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal sm:text-6xl">What&apos;s your next idea?</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#59616e]">
              Upload your idea. Get a FREE manufacturing review within 8 working hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#ideas" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold">
                <Search size={16} /> Browse Ideas
              </a>
              <Link href="/ask/new" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">
                <Plus size={16} /> Upload My Idea
              </Link>
            </div>
          </div>

          <aside className="rounded-[8px] border border-[#e8ebef] bg-[#fbfbfc] p-5">
            <h2 className="text-lg font-semibold">Floating Live Activity</h2>
            <div className="mt-4 space-y-3">
              {liveActivity.length === 0 ? (
                <p className="text-sm leading-6 text-[#69707d]">No activity yet. Real uploads, TYORA replies, comments, and likes will appear here.</p>
              ) : liveActivity.map((item) => (
                <p key={item} className="rounded-[6px] bg-white p-3 text-sm text-[#59616e] ring-1 ring-[#eef1f4]">{item}</p>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-12 grid gap-4 md:grid-cols-4">
          {[
            ["Latest Discussions", latestComments.length],
            ["Newest Ideas", ideas.length],
            ["Recently Replied", latestReviews.length],
            ["Latest TYORA Reviews", latestReviews.length]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[8px] border border-[#e8ebef] p-5">
              <p className="text-sm text-[#69707d]">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <nav id="ideas" className="mt-12 flex gap-2 overflow-x-auto pb-2">
          {tabs.map(([id, label]) => (
            <Link
              key={id}
              href={`/ask?sort=${id}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${sort === id ? "bg-[#101216] text-white" : "border border-[#dfe3e8] text-[#59616e]"}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-5 grid gap-4">
          {ideas.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#cfd5dc] p-10 text-center">
              <p className="text-xl font-semibold">No ideas yet.</p>
              <p className="mt-2 text-[#69707d]">Be the first product creator to start a manufacturing discussion.</p>
            </div>
          ) : ideas.map((idea) => (
            <Link key={idea.id} href={`/ask/${idea.slug}`} className="block rounded-[8px] border border-[#e8ebef] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#101216]/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs text-[#69707d]">
                    <span>{idea.status}</span>
                    <span>{idea.category}</span>
                    <span>{idea.country}</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold">{idea.title}</h2>
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[#59616e]">{idea.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-[#69707d] sm:min-w-52">
                  <span className="rounded-[6px] bg-[#f5f6f8] px-3 py-2">{idea.comments.length}<br />comments</span>
                  <span className="rounded-[6px] bg-[#f5f6f8] px-3 py-2">{idea.likeCount}<br />likes</span>
                  <span className="rounded-[6px] bg-[#f5f6f8] px-3 py-2">{idea.interestedCount}<br />interested</span>
                </div>
              </div>
              {idea.review ? <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e7f5f2] px-3 py-1 text-xs font-semibold text-[#0f766e]"><MessageCircle size={14} /> TYORA replied</p> : null}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
