import Link from "next/link";
import {
  ChevronRight,
  Filter,
  Flame,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { CommunityFeedSort, CommunityIdea, CommunityStatus } from "@/lib/community";
import { getCommunityIdeas } from "@/lib/server/community-store";
import { getContent } from "@/lib/server/data-store";
import { CaseStudy, CommunityPageContent } from "@/lib/storage";
import CommunityImage from "@/components/community-image";
import CommunityAvatar from "@/components/community-avatar";
import CommunityUserMenu from "@/components/community-user-menu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Ask TYORA Community",
  description: "Product creators discussing ideas with Chinese manufacturing expertise."
};

const tabs: Array<[CommunityFeedSort, string]> = [
  ["trending", "Trending"],
  ["newest", "Newest"],
  ["latest-comments", "Most Discussed"],
  ["latest-tyora-reply", "Latest TYORA Reply"],
  ["latest-uploaded", "Recently Uploaded"]
];

const topNav = [
  ["Ideas", "/ask"],
  ["Post Idea", "/ask/new"],
  ["Source", "/source"],
  ["Custom", "/custom"],
  ["Pricing", "/#pricing"]
] as const;
const statusSteps = ["Idea", "Discussion", "TYORA Review", "Prototype", "Manufacturing", "Shipping"];
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] hover:shadow-md hover:shadow-[#2563eb]/25";

const statusStyles: Record<CommunityStatus, string> = {
  Discussing: "bg-[#f0eaff] text-[#6d28d9] ring-[#ddd0ff]",
  "TYORA Reviewing": "bg-[#fff7d6] text-[#8a5a00] ring-[#ffe89a]",
  "Project Started": "bg-[#e9f2ff] text-[#1d4ed8] ring-[#c9ddff]",
  Manufacturing: "bg-[#fff0df] text-[#c2410c] ring-[#ffd8ad]",
  Shipping: "bg-[#edf4ff] text-[#315fbd] ring-[#d4e4ff]",
  Completed: "bg-[#e8f8ef] text-[#15803d] ring-[#c9efd8]"
};

function flagFor(country: string) {
  const value = country.toLowerCase();
  if (value.includes("china")) return "CN";
  if (value.includes("united states") || value.includes("usa") || value.includes("america")) return "US";
  if (value.includes("united kingdom") || value.includes("uk")) return "UK";
  if (value.includes("canada")) return "CA";
  if (value.includes("australia")) return "AU";
  if (value.includes("germany")) return "DE";
  return country.slice(0, 2).toUpperCase() || "GL";
}

function statusProgress(status: CommunityStatus) {
  if (status === "Completed") return 6;
  if (status === "Shipping") return 6;
  if (status === "Manufacturing") return 5;
  if (status === "Project Started") return 4;
  if (status === "TYORA Reviewing") return 3;
  return 2;
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diff / 36e5));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function coverTone(idea: CommunityIdea) {
  const tones = [
    "from-[#e9f7f3] via-[#f7fbff] to-[#efe9ff]",
    "from-[#fff4e7] via-[#f8fbff] to-[#e9f2ff]",
    "from-[#edf7ff] via-[#fbfbfc] to-[#effaf3]",
    "from-[#f5efff] via-[#ffffff] to-[#fff7dd]"
  ];
  return tones[idea.title.length % tones.length];
}

function HotBadge({ idea }: { idea?: CommunityIdea }) {
  if (!idea?.isHot) return null;
  return (
    <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#ff385c] px-2.5 py-1 text-[10px] font-bold uppercase tracking-normal text-white shadow-[0_8px_22px_rgba(255,56,92,0.28)]">
      <Flame size={11} fill="currentColor" /> Hot
    </span>
  );
}

function activity(ideas: CommunityIdea[]) {
  const latestReviews = ideas.filter((idea) => idea.review).slice(0, 4);
  const latestComments = ideas.flatMap((idea) => idea.comments.map((comment) => ({ idea, comment }))).slice(-4).reverse();
  return [
    ...ideas.slice(0, 4).map((idea) => `${idea.author.name} uploaded a new idea`),
    ...latestReviews.map((idea) => `TYORA replied to ${idea.title}`),
    ...latestComments.map(({ comment }) => `${comment.author.name} commented`)
  ].slice(0, 7);
}

function caseStatus(story: CaseStudy): CommunityStatus {
  if (story.status === "Delivered") return "Completed";
  if (story.status === "In Production") return "Manufacturing";
  if (story.status === "Prototype Approved") return "Project Started";
  return "Discussing";
}

type InteractionLabels = Pick<CommunityPageContent, "likeText" | "commentText" | "interestedText" | "shareText">;

function CommunityCard({ idea, story, labels }: { idea?: CommunityIdea; story?: CaseStudy; labels: InteractionLabels }) {
  if (!idea && !story) return null;
  const status = story ? caseStatus(story) : idea!.status;
  const progress = statusProgress(status);
  const title = story?.name || idea!.title;
  const description = story?.shortDescription || idea!.description;
  const category = story?.category || idea!.category;
  const country = story?.country || idea!.country;
  const imageUrl = story?.coverImage.desktopUrl || idea?.imageUrls[0];
  const href = story ? `/ask/case/${encodeURIComponent(story.slug)}` : `/ask/${idea!.slug}`;
  const authorName = story ? "TYORA" : idea!.author.name;

  return (
    <article className="group relative overflow-hidden rounded-[12px] border border-[#e1e6ee] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition duration-150 hover:-translate-y-0.5 hover:border-[#cfd8e6] hover:shadow-[0_14px_38px_rgba(15,23,42,0.1)]">
      <HotBadge idea={idea} />
      <div className="grid grid-cols-[96px_1fr] gap-0 sm:grid-cols-[132px_1fr]">
        <Link href={href} className={`relative block aspect-square overflow-hidden bg-gradient-to-br ${story ? "from-[#eef4ff] to-[#f8fafc]" : coverTone(idea!)}`}>
          <CommunityImage src={imageUrl} alt={title} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]" fallbackClassName="absolute inset-0 p-6" initialsClassName="bg-white/74" />
          <span className="absolute left-2 top-2 rounded-full bg-white/88 px-2 py-0.5 text-[10px] font-semibold text-[#101216] backdrop-blur">{category}</span>
        </Link>

        <div className="min-w-0 p-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#69707d]">
            {country ? <span className="rounded-full bg-[#f4f6f8] px-2 py-1">{flagFor(country)}</span> : null}
            <span>{authorName}</span>
            {idea ? <span>{timeAgo(idea.createdAt)}</span> : null}
            {story ? <span className="rounded-full bg-[#101216] px-2 py-1 font-semibold text-white">{story.badgeLabel || "TYORA Case"}</span> : null}
            {story?.projectType === "Demonstration Project" ? <span className="rounded-full bg-[#fff7d6] px-2 py-1 font-semibold text-[#8a5a00]">Demonstration Project</span> : null}
            <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 max-sm:hidden ${statusStyles[status]}`}>{status}</span>
          </div>

          <Link href={href} className="mt-1.5 block">
            <h2 className="line-clamp-1 text-base font-semibold leading-tight tracking-normal text-[#101216]">{title}</h2>
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#59616e]">{description}</p>
          </Link>

          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] max-sm:hidden">
            {(idea?.questions || []).slice(0, 2).map((question) => (
              <span key={question} className="rounded-full border border-[#e8ebef] px-2.5 py-1 text-[#59616e]">{question}</span>
            ))}
            <span className="rounded-full border border-[#e8ebef] px-2.5 py-1 text-[#59616e]">{story ? story.status : "Concept"}</span>
          </div>

          <div className="mt-2 grid gap-2 max-sm:hidden sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {statusSteps.map((step, index) => (
                  <div key={step} className="flex flex-1 items-center gap-1">
                    <span className={`h-1.5 flex-1 rounded-full ${index < progress ? "bg-[#14b8a6]" : "bg-[#e8ebef]"}`} />
                  </div>
                ))}
              </div>
              <div className="mt-1 hidden grid-cols-6 text-[10px] text-[#8b93a1] sm:grid">
                {statusSteps.map((step) => <span key={step} className="truncate">{step}</span>)}
              </div>
            </div>

            <CommunityAvatar name={authorName} src={idea?.author.avatar} className="size-6 border text-[10px]" />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {idea ? <div className="flex flex-wrap gap-2 text-[11px] font-medium text-[#69707d] sm:gap-3 sm:text-xs">
              <span className="inline-flex items-center gap-1"><Heart size={14} /> {idea.likeCount} {labels.likeText}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {idea.comments.length} {labels.commentText}</span>
              <span className="inline-flex items-center gap-1 max-sm:hidden"><ShoppingBag size={14} /> {idea.interestedCount} {labels.interestedText}</span>
              <span className="inline-flex items-center gap-1 max-sm:hidden"><Share2 size={14} /> {idea.shareCount} {labels.shareText}</span>
            </div> : <span className="text-xs font-semibold text-[#315fbd]">Case information, process, and disclosure</span>}
            <Link href={href} className={`hidden h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold sm:inline-flex ${primaryButton}`}>
              {story ? story.ctaText || "View Case" : "Join Discussion"} <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function StarterCommunityState() {
  return (
    <div className="rounded-[18px] border border-[#e4e8ef] bg-white/95 p-4 shadow-sm shadow-[#101216]/4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">Starter community</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight">Be the first founder to start a discussion.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59616e]">
            Share a product idea for a limited initial manufacturing assessment from TYORA.
          </p>
        </div>
        <Link href="/ask/new" className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${primaryButton}`}>
          <Plus size={16} /> Start a Discussion
        </Link>
      </div>

    </div>
  );
}

export default async function AskCommunityPage({ searchParams }: { searchParams: Promise<{ sort?: CommunityFeedSort }> }) {
  const { sort = "trending" } = await searchParams;
  const [ideas, content] = await Promise.all([getCommunityIdeas(sort), getContent()]);
  const tyoraCases = content.communityPage.showCasesInFeed
    ? content.cases.filter((story) => story.visible).sort((left, right) => left.order - right.order).slice(0, content.communityPage.caseLimit)
    : [];
  const latestReviews = ideas.filter((idea) => idea.review);
  const countries = new Set(ideas.map((idea) => idea.country).filter(Boolean)).size;
  const recentActivity = activity(ideas);
  const categories = Array.from(new Set(ideas.map((idea) => idea.category).filter(Boolean))).slice(0, 8);
  const hasCommunityStats = ideas.length > 0;
  const communityStats = [
    ["Ideas Shared", ideas.length],
    ["TYORA Reviews", latestReviews.length],
    ["Countries", countries]
  ] as const;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f5f7fb_32%,#f7f5f0_72%,#eef2f8_100%)] pb-28 text-[#101216] md:pb-20">
      <header className="sticky top-0 z-40 border-b border-[#e8ebef]/90 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1520px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-normal">TYORA</Link>
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {topNav.map(([label, href]) => (
              <Link key={label} href={href} className="rounded-full px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f2f4f7] hover:text-[#101216]">
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden h-10 w-64 items-center gap-2 rounded-full border border-[#e1e5ea] bg-white px-3 text-sm text-[#8b93a1] md:flex">
              <Search size={16} /> Search ideas
            </div>
            <CommunityUserMenu loginClassName="hidden rounded-full border border-[#dfe3e8] bg-white px-4 py-2 text-sm font-semibold sm:inline-flex" />
            <Link href="/ask/new" className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${primaryButton}`}>
              <Plus size={16} /> <span className="hidden sm:inline">Start a Discussion</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1520px] gap-3 px-3 py-3 sm:px-5 lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:px-6">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-3">
            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-3.5 shadow-[0_10px_36px_rgba(15,23,42,0.07)]">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101216] text-white"><Sparkles size={18} /></div>
              <h2 className="mt-3 text-base font-semibold">Creator HQ</h2>
              <p className="mt-1.5 text-[13px] leading-5 text-[#69707d]">Founders testing ideas with manufacturing experts.</p>
              <div className="mt-3 grid gap-2 text-sm">
                <Link href="/ask/new" className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 font-semibold ${primaryButton}`}><Plus size={15} /> Start a Discussion</Link>
                <a href="#feed" className="inline-flex h-10 items-center justify-center rounded-full border border-[#dfe3e8] font-semibold">Browse Ideas</a>
                <span className="rounded-2xl bg-[#eef6ff] p-3 text-sm font-semibold text-[#315fbd]">Limited initial manufacturing assessments</span>
              </div>
            </section>

            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-2.5 shadow-sm shadow-[#101216]/4">
              {[
                ["Discover Ideas", "/ask"],
                ["Start a Discussion", "/ask/new"],
                ["Newest Ideas", "/ask?sort=newest"],
                ["Latest TYORA Reply", "/ask?sort=latest-tyora-reply"]
              ].map(([item, href]) => (
                <Link key={item} href={href} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f5f6f8] hover:text-[#101216]">
                  {item}<ChevronRight size={14} />
                </Link>
              ))}
            </section>

            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-2.5 shadow-sm shadow-[#101216]/4">
              <p className="px-3 text-xs font-semibold uppercase text-[#8b93a1]">My TYORA</p>
              <div className="mt-2 grid gap-1">
                {[
                  ["My Discussions", "/me#discussions"],
                  ["My Comments", "/me#comments"],
                  ["Liked Ideas", "/me#liked"],
                  ["Notifications", "/me#notifications"]
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f5f6f8] hover:text-[#101216]">
                    {label}<ChevronRight size={14} />
                  </Link>
                ))}
              </div>
            </section>

            {categories.length > 0 ? <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-2.5 shadow-sm shadow-[#101216]/4">
              <p className="px-3 text-xs font-semibold uppercase text-[#8b93a1]">Categories</p>
              <div className="mt-2 grid gap-1.5">
                {categories.map((item) => <Link key={item} href="/ask" className="rounded-xl bg-[#f8fafc] px-3 py-1.5 text-[13px] text-[#59616e] transition hover:bg-[#eef6ff] hover:text-[#1d4ed8]">{item}</Link>)}
              </div>
            </section> : null}

            <section className="rounded-[18px] border border-[#d7f1eb] bg-[#effaf6] p-3">
              <p className="text-sm font-semibold text-[#0f766e]">Early founder community</p>
              <p className="mt-1 text-sm leading-6 text-[#3d766d]">Share an idea for an initial manufacturing assessment.</p>
            </section>
          </div>
        </aside>

        <section id="feed" className="min-w-0">
          <div className="rounded-[16px] border border-[#dfe6ef] bg-white/96 p-3 shadow-[0_10px_36px_rgba(15,23,42,0.07)] sm:p-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
              <Sparkles size={14} /> Limited initial manufacturing assessment
            </p>
            <div className="mt-2 grid gap-2.5 xl:grid-cols-[1fr_auto] xl:items-end">
              <div>
                <h1 className="max-w-3xl text-[1.45rem] font-semibold leading-[1.08] tracking-normal sm:text-3xl">What are founders building next?</h1>
                <p className="mt-1.5 max-w-[300px] text-sm leading-5 text-[#59616e] sm:mt-2 sm:max-w-2xl sm:leading-6">
                  Discover product ideas from founders, or share your own for an initial manufacturing assessment.
                </p>
                <p className="mt-1.5 max-w-[320px] break-words text-xs font-medium text-[#315fbd] sm:mt-2 sm:max-w-2xl sm:text-sm">Founders are discussing product ideas with TYORA manufacturing experts.</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link href="/ask/new" className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold sm:h-11 sm:px-5 ${primaryButton}`}><Plus size={16} /> Start a Discussion</Link>
                <a href="#ideas" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold sm:h-12 sm:px-5"><Search size={16} /> Browse Ideas</a>
              </div>
            </div>
            <div className="mt-3 hidden gap-2 sm:grid sm:grid-cols-2 xl:grid-cols-5">
              {hasCommunityStats ? communityStats.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#e7edf5] bg-gradient-to-br from-white to-[#f7fbff] p-2.5 shadow-sm shadow-[#101216]/3">
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="mt-1 text-xs font-medium text-[#69707d]">{label}</p>
                </div>
              )) : null}
            </div>
          </div>

          <nav id="ideas" className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
            {tabs.map(([id, label]) => (
              <Link key={id} href={`/ask?sort=${id}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${sort === id ? "bg-[#101216] text-white" : "border border-[#dfe3e8] bg-white text-[#59616e]"}`}>
                {label}
              </Link>
            ))}
            <button className="inline-flex whitespace-nowrap rounded-full border border-[#dfe3e8] bg-white px-4 py-2 text-sm font-semibold text-[#59616e]"><Filter size={15} /> Filter</button>
          </nav>

          <div className="mt-2.5 grid gap-2">
            {ideas.length === 0 && tyoraCases.length === 0 ? (
              <StarterCommunityState />
            ) : (
              <>
                {ideas.map((idea) => <CommunityCard key={idea.id} idea={idea} labels={content.communityPage} />)}
                {tyoraCases.map((story) => <CommunityCard key={`case-${story.id}`} story={story} labels={content.communityPage} />)}
              </>
            )}
          </div>

          <div className="mt-3 hidden gap-3 sm:grid xl:hidden">
            {recentActivity.length > 0 ? <section className="rounded-[16px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
              <h2 className="text-base font-semibold">Recent community activity</h2>
              <div className="mt-3 grid gap-2 text-sm text-[#59616e]">
                {recentActivity.slice(0, 2).map((item) => (
                  <p key={item} className="rounded-2xl bg-[#f7f8fa] p-3">{item}</p>
                ))}
              </div>
            </section> : null}
            {hasCommunityStats ? <section className="rounded-[16px] border border-[#e4e8ef] bg-white p-4">
              <h2 className="text-base font-semibold">Community Statistics</h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[#69707d]">
                {[
                  ["Ideas", ideas.length],
                  ["Reviews", latestReviews.length],
                  ["Countries", countries]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f8fa] p-3">
                    <p className="text-lg font-semibold text-[#101216]">{value}</p>
                    <p>{label}</p>
                  </div>
                ))}
              </div>
            </section> : null}
          </div>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-3">
            {recentActivity.length > 0 ? <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-3.5 shadow-[0_10px_36px_rgba(15,23,42,0.07)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Recent community activity</h2>
              </div>
              <div className="mt-3 space-y-2">
                {recentActivity.map((item, index) => <p key={item} className="rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]"><span className={`mr-2 inline-block size-2 rounded-full ${index % 3 === 0 ? "bg-[#14b8a6]" : index % 3 === 1 ? "bg-[#f59e0b]" : "bg-[#2563eb]"}`} />{item}</p>)}
              </div>
            </section> : null}

            {hasCommunityStats ? <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4">
              <h2 className="text-lg font-semibold">Community Statistics</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Ideas", ideas.length],
                  ["Reviews", latestReviews.length],
                  ["Countries", countries]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f8fa] p-3">
                    <p className="text-lg font-semibold text-[#101216]">{value}</p>
                    <p className="text-xs text-[#69707d]">{label}</p>
                  </div>
                ))}
              </div>
            </section> : null}
          </div>
        </aside>
      </div>

    </main>
  );
}
