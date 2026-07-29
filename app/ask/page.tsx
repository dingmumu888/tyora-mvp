import Link from "next/link";
import {
  BadgeCheck,
  Boxes,
  ChevronRight,
  CircleHelp,
  Flame,
  Lightbulb,
  MessageCircle,
  PackageSearch,
  PenLine,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Tags,
  ThumbsUp,
  TrendingUp,
  Users
} from "lucide-react";
import { CommunityFeedSort, CommunityIdea, CommunityStatus } from "@/lib/community";
import { getCommunityIdeas } from "@/lib/server/community-store";
import { getContent } from "@/lib/server/data-store";
import { CaseStudy, CommunityPageContent } from "@/lib/storage";
import CommunityImage from "@/components/community-image";
import CommunityAvatar from "@/components/community-avatar";
import CommunityText, { CommunitySearchInput } from "@/components/community-text";
import CommunityUserMenu from "@/components/community-user-menu";
import PublicLanguageSwitcher from "@/components/public-language-switcher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Ask TYORA Community",
  description: "Product creators discussing ideas with Chinese manufacturing expertise.",
  alternates: { canonical: "/ask" }
};

type CommunityPageSort = CommunityFeedSort | "unanswered";

const tabs: Array<[CommunityPageSort, string]> = [
  ["trending", "Hot"],
  ["newest", "New"],
  ["latest-comments", "Most Discussed"],
  ["unanswered", "Unanswered"],
  ["latest-tyora-reply", "TYORA Reviewed"]
];

const topNav = [
  ["Ideas", "/ask"],
  ["Manufacturing", "/build"],
  ["Source", "/source"],
  ["Pricing", "/build#pricing"]
] as const;
const primaryButton = "bg-[#1565f9] text-white shadow-sm shadow-[#1565f9]/20 transition hover:bg-[#0b55de] hover:shadow-md hover:shadow-[#1565f9]/25";

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
  const title = story ? story.name : idea!.title;
  const description = story ? story.shortDescription : idea!.description;
  const category = story ? story.category : idea!.category;
  const country = story ? story.country : idea?.country;
  const imageUrl = story ? story.coverImage.desktopUrl : idea?.imageUrls[0];
  const href = story ? `/ask/case/${encodeURIComponent(story.slug)}` : `/ask/${idea!.slug}`;
  const authorName = story ? "TYORA" : idea!.author.name;
  const commentCount = idea?.comments.length || 0;
  const helpfulCount = idea?.helpfulCount || 0;
  const isUnanswered = Boolean(idea && commentCount === 0 && !idea.review);
  const reviewSnippet = idea?.review?.recommendedNextStep || idea?.review?.additionalNotes || idea?.review?.mainRisks;

  return (
    <article className={`group overflow-hidden rounded-xl border bg-white transition duration-150 hover:border-[#b8c5d8] hover:shadow-[0_12px_32px_rgba(11,20,38,0.08)] ${isUnanswered ? "border-[#f6c894]" : "border-[#dfe5ed]"}`}>
      <div className="grid min-h-[126px] grid-cols-[minmax(0,1fr)_88px] sm:grid-cols-[58px_minmax(0,1fr)_124px]">
        <div className="hidden border-r border-[#edf0f4] bg-[#fafbfc] px-2 py-3 text-center sm:block">
          <ThumbsUp size={15} className="mx-auto text-[#667085]" />
          <p className="mt-1 text-lg font-bold leading-none text-[#0b1426]">{helpfulCount}</p>
          <p className="mt-1 text-[10px] font-medium text-[#667085]"><CommunityText text="Helpful" /></p>
        </div>

        <div className="min-w-0 px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {idea?.isHot ? <span className="inline-flex items-center gap-1 rounded bg-[#fff1e8] px-2 py-1 text-[10px] font-bold uppercase text-[#c2410c]"><Flame size={11} fill="currentColor" /> Hot</span> : null}
            <span className="rounded bg-[#eef4ff] px-2 py-1 text-[10px] font-bold uppercase text-[#155eef]"><CommunityText text={idea?.postType || category} /></span>
            <span className="rounded bg-[#f3f0ff] px-2 py-1 text-[10px] font-bold uppercase text-[#6d28d9]"><CommunityText text={idea?.productStage || status} /></span>
            {idea && status !== "Discussing" ? <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ring-1 ${statusStyles[status]}`}><CommunityText text={status} /></span> : null}
            {idea?.review ? <span className="inline-flex items-center gap-1 rounded bg-[#e8f7f4] px-2 py-1 text-[10px] font-bold uppercase text-[#06756f]"><BadgeCheck size={11} /> <CommunityText text="TYORA Replied" /></span> : null}
            {isUnanswered ? <span className="rounded bg-[#fff1e8] px-2 py-1 text-[10px] font-bold uppercase text-[#c2410c]"><CommunityText text="Unanswered" /></span> : null}
            {story ? <span className="rounded bg-[#0b1426] px-2 py-1 text-[10px] font-bold uppercase text-white"><CommunityText text={story.badgeLabel || "TYORA Case"} /></span> : null}
            {story?.projectType === "Demonstration Project" ? <span className="rounded bg-[#fff7d6] px-2 py-1 text-[10px] font-bold uppercase text-[#8a5a00]"><CommunityText text="Demonstration Project" /></span> : null}
          </div>

          <Link href={href} className="mt-2 block">
            <h2 className="line-clamp-2 text-[15px] font-bold leading-5 text-[#0b1426] transition group-hover:text-[#155eef] sm:text-base">{title}</h2>
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.45] text-[#5f6b7a] sm:text-[13px]">{description}</p>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#667085]">
            <span className="inline-flex items-center gap-1.5">
              <CommunityAvatar name={authorName} src={idea?.author.avatar} className="size-5 border text-[8px]" />
              {authorName}
            </span>
            {country ? <span>{flagFor(country)}</span> : null}
            {idea ? <span>{timeAgo(idea.updatedAt || idea.createdAt)}</span> : <span><CommunityText text="TYORA case" /></span>}
            <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> {commentCount} <CommunityText text={labels.commentText} /></span>
            {idea ? <span className="inline-flex items-center gap-1"><ThumbsUp size={13} /> {helpfulCount} <CommunityText text="helpful" /></span> : null}
            {idea?.interestedCount ? <span>{idea.interestedCount} {labels.interestedText}</span> : null}
          </div>

          {reviewSnippet ? (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#a8ddd7] bg-[#f1fbf9] px-2.5 py-2 text-[11px] leading-4 text-[#285f5b]">
              <BadgeCheck size={14} className="mt-0.5 shrink-0 text-[#078a83]" />
              <p className="line-clamp-2"><strong className="text-[#066a65]"><CommunityText text="TYORA Expert:" /></strong> {reviewSnippet}</p>
            </div>
          ) : null}
        </div>

        <Link href={href} className={`relative min-h-[126px] overflow-hidden border-l border-[#edf0f4] bg-gradient-to-br ${story ? "from-[#eef4ff] to-[#f8fafc]" : coverTone(idea!)}`}>
          <CommunityImage src={imageUrl} alt={title} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.04]" fallbackClassName="absolute inset-0 p-4" initialsClassName="bg-white/74" />
        </Link>
      </div>
    </article>
  );
}

function StarterCommunityState() {
  return (
    <div className="rounded-[18px] border border-[#e4e8ef] bg-white/95 p-4 shadow-sm shadow-[#101216]/4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]"><CommunityText text="Starter community" /></p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight"><CommunityText text="Be the first founder to start a discussion." /></h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59616e]">
            <CommunityText text="Share a product idea for a limited initial manufacturing assessment from TYORA." />
          </p>
        </div>
        <Link href="/ask/new" className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${primaryButton}`}>
          <Plus size={16} /> <CommunityText text="Start a Discussion" />
        </Link>
      </div>

    </div>
  );
}

export default async function AskCommunityPage({
  searchParams
}: {
  searchParams: Promise<{ sort?: CommunityPageSort; category?: string; stage?: string; type?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sort = tabs.some(([id]) => id === params.sort) ? params.sort as CommunityPageSort : "trending";
  const dataSort: CommunityFeedSort = sort === "unanswered" ? "newest" : sort;
  const [rawIdeas, content] = await Promise.all([getCommunityIdeas(dataSort), getContent()]);
  const query = (params.q || "").trim().toLowerCase();
  const selectedCategory = (params.category || "").trim();
  const selectedStage = (params.stage || "").trim();
  const selectedPostType = (params.type || "").trim();

  const stageMatches = (idea: CommunityIdea) => {
    if (!selectedStage) return true;
    return idea.productStage === selectedStage;
  };

  const ideas = rawIdeas
    .filter((idea) => !selectedCategory || idea.category === selectedCategory)
    .filter((idea) => !selectedPostType || idea.postType === selectedPostType)
    .filter(stageMatches)
    .filter((idea) => !query || `${idea.title} ${idea.description} ${idea.category} ${idea.author.name}`.toLowerCase().includes(query))
    .filter((idea) => sort !== "unanswered" || (idea.comments.length === 0 && !idea.review))
    .filter((idea) => sort !== "latest-tyora-reply" || Boolean(idea.review))
    .sort((left, right) => sort === "latest-comments" ? right.comments.length - left.comments.length : 0);

  const showCases = !query && !selectedCategory && !selectedStage && !selectedPostType && sort !== "unanswered" && sort !== "latest-tyora-reply";
  const tyoraCases = content.communityPage.showCasesInFeed && showCases
    ? content.cases.filter((story) => story.visible).sort((left, right) => left.order - right.order).slice(0, content.communityPage.caseLimit)
    : [];
  const latestReviews = rawIdeas.filter((idea) => idea.review);
  const countries = new Set(rawIdeas.map((idea) => idea.country).filter(Boolean)).size;
  const adviceIdeas = rawIdeas
    .filter((idea) => !idea.review && idea.comments.length === 0)
    .sort((left, right) => left.comments.length - right.comments.length || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 3);
  const categories = Array.from(new Set(rawIdeas.map((idea) => idea.category).filter(Boolean))).slice(0, 7);
  const categoryCounts = categories.map((category) => ({
    category,
    count: rawIdeas.filter((idea) => idea.category === category).length
  })).sort((left, right) => right.count - left.count);
  const contributors = Array.from(new Map(
    rawIdeas.flatMap((idea) => idea.comments.map((comment) => [comment.author.id, comment.author] as const))
  ).values()).sort((left, right) => Number(right.expertVerified) - Number(left.expertVerified)).slice(0, 3);
  const progressedIdeas = rawIdeas.filter((idea) => idea.productStage !== "Concept").length;
  const activeDiscussions = rawIdeas.filter((idea) => idea.comments.length > 0).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f8] pb-28 text-[#0b1426] md:pb-16">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1426] text-white shadow-[0_4px_18px_rgba(11,20,38,0.16)]">
        <div className="mx-auto flex h-[60px] max-w-[1580px] items-center gap-3 px-3 sm:px-5 lg:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 pr-4 lg:pr-7" aria-label={`${content.brandName} home`}>
            <span className="grid size-9 place-items-center overflow-hidden rounded-lg bg-white p-1">
              {content.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.logoImage} alt="" className="size-full object-contain" />
              ) : <Sparkles size={17} className="text-[#0b1426]" />}
            </span>
            {content.showBrandNameWithLogo ? <span className="text-base font-bold tracking-[0.08em]">{content.brandName}</span> : null}
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Community navigation">
            {topNav.map(([label, href]) => (
              <Link key={label} href={href} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${href === "/ask" ? "bg-white/12 text-white" : "text-white/72 hover:bg-white/8 hover:text-white"}`}>
                <CommunityText text={label} />
              </Link>
            ))}
          </nav>

          <form action="/ask" className="mx-auto hidden h-10 w-full max-w-[500px] items-center gap-2 rounded-lg border border-white/25 bg-white/7 px-3 text-white/65 lg:flex">
            <Search size={16} />
            <CommunitySearchInput defaultValue={params.q || ""} placeholder="Search ideas, products, or manufacturing questions" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/48" />
            <input type="hidden" name="sort" value={sort} />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <PublicLanguageSwitcher compact className="hidden sm:inline-flex" />
            <CommunityUserMenu loginClassName="hidden h-10 items-center rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/15 md:inline-flex" />
            <Link href="/ask/new" className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold sm:px-4 ${primaryButton}`}>
              <PenLine size={15} /> <span className="hidden sm:inline"><CommunityText text="Start a discussion" /></span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1580px] gap-4 px-3 py-4 sm:px-5 xl:grid-cols-[224px_minmax(0,1fr)_292px] xl:px-6">
        <aside className="hidden xl:block">
          <div className="sticky top-[76px] space-y-4">
            <section>
              <h2 className="text-lg font-bold"><CommunityText text="Creator Community" /></h2>
              <p className="mt-1 text-xs leading-5 text-[#667085]"><CommunityText text="Turn practical feedback into manufacturing confidence." /></p>
              <Link href="/ask/new" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0b1426] px-4 text-sm font-semibold text-white transition hover:bg-[#17243b]">
                <PenLine size={16} /> <CommunityText text="Start a Discussion" />
              </Link>
            </section>

            <nav className="space-y-1 border-b border-[#d8dee8] pb-4">
              {([
                ["All Discussions", "/ask", MessageCircle],
                ["Ideas & Feedback", `/ask?type=${encodeURIComponent("Idea Feedback")}`, Lightbulb],
                ["Cost & MOQ", `/ask?type=${encodeURIComponent("Cost & MOQ")}`, Tags],
                ["Manufacturing Advice", `/ask?type=${encodeURIComponent("Manufacturing Advice")}`, Boxes],
                ["Prototyping", "/ask?stage=Prototype", Rocket],
                ["Find a Supplier", "/source", PackageSearch]
              ] as const).map(([label, href, Icon]) => (
                <Link key={label} href={href} className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition ${label === "All Discussions" && !selectedCategory && !selectedStage && !selectedPostType ? "bg-[#e8f0ff] text-[#155eef]" : "text-[#475467] hover:bg-white hover:text-[#0b1426]"}`}>
                  <Icon size={17} /> <CommunityText text={label} />
                </Link>
              ))}
            </nav>

            <section>
              <p className="px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#667085]"><CommunityText text="Product stage" /></p>
              <div className="mt-2 space-y-1">
                {([
                  ["Concept", Lightbulb],
                  ["Design", BadgeCheck],
                  ["Prototype", Boxes],
                  ["Pre-production", PackageSearch],
                  ["Production", Rocket]
                ] as const).map(([stage, Icon]) => (
                  <Link key={stage} href={`/ask?stage=${stage}`} className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition ${selectedStage === stage ? "bg-white text-[#155eef] shadow-sm" : "text-[#475467] hover:bg-white"}`}>
                    <Icon size={16} /> <CommunityText text={stage} />
                  </Link>
                ))}
              </div>
            </section>

            {categories.length > 0 ? (
              <section>
                <p className="px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#667085]"><CommunityText text="Browse topics" /></p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {categories.slice(0, 5).map((item) => (
                    <Link key={item} href={`/ask?category=${encodeURIComponent(item)}`} className={`rounded-md border px-2 py-1.5 text-[11px] font-medium ${selectedCategory === item ? "border-[#155eef] bg-[#e8f0ff] text-[#155eef]" : "border-[#d8dee8] bg-white text-[#475467]"}`}>{item}</Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </aside>

        <section id="feed" className="min-w-0">
          <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#155eef]"><Users size={14} /> <CommunityText text="Product creator community" /></p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] sm:text-[30px]"><CommunityText text="Build it with confidence" /></h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5f6b7a]"><CommunityText text="Get practical feedback from buyers, makers, and TYORA manufacturing experts." /></p>
            </div>
            <div className="flex gap-2 text-xs font-semibold text-[#475467]">
              <span className="rounded-md border border-[#d8dee8] bg-white px-2.5 py-1.5"><CommunityText text="{count} ideas" values={{ count: rawIdeas.length }} /></span>
              <span className="rounded-md border border-[#d8dee8] bg-white px-2.5 py-1.5"><CommunityText text="{count} reviewed" values={{ count: latestReviews.length }} /></span>
            </div>
          </div>

          <form action="/ask" className="mb-3 flex h-11 items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3 shadow-sm lg:hidden">
            <Search size={16} className="text-[#667085]" />
            <CommunitySearchInput defaultValue={params.q || ""} placeholder="Search discussions" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <input type="hidden" name="sort" value={sort} />
          </form>

          <nav id="ideas" className="no-scrollbar flex overflow-x-auto rounded-xl border border-[#d8dee8] bg-white px-1.5 pt-1.5 shadow-sm">
            {tabs.map(([id, label]) => (
              <Link key={id} href={`/ask?sort=${id}`} className={`relative whitespace-nowrap rounded-t-lg px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${sort === id ? "bg-[#f7f9fc] text-[#155eef] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[#155eef]" : "text-[#5f6b7a] hover:bg-[#f7f9fc] hover:text-[#0b1426]"}`}>
                <CommunityText text={label} />
              </Link>
            ))}
          </nav>

          {(query || selectedCategory || selectedStage || selectedPostType) ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-xs text-[#5f6b7a]">
              <span className="font-semibold text-[#0b1426]"><CommunityText text="Active filters:" /></span>
              {query ? <span className="rounded bg-[#eef4ff] px-2 py-1"><CommunityText text="Search: {query}" values={{ query: params.q || "" }} /></span> : null}
              {selectedCategory ? <span className="rounded bg-[#eef4ff] px-2 py-1">{selectedCategory}</span> : null}
              {selectedPostType ? <span className="rounded bg-[#eef4ff] px-2 py-1">{selectedPostType}</span> : null}
              {selectedStage ? <span className="rounded bg-[#eef4ff] px-2 py-1"><CommunityText text={selectedStage} /></span> : null}
              <Link href="/ask" className="ml-auto font-semibold text-[#155eef]"><CommunityText text="Clear" /></Link>
            </div>
          ) : null}

          <div className="mt-2 grid gap-2">
            {ideas.length === 0 && tyoraCases.length === 0 ? (
              query || selectedCategory || selectedStage || selectedPostType || sort === "unanswered" || sort === "latest-tyora-reply" ? (
                <div className="rounded-xl border border-[#d8dee8] bg-white p-8 text-center">
                  <CircleHelp size={26} className="mx-auto text-[#98a2b3]" />
                  <h2 className="mt-3 text-lg font-bold"><CommunityText text="No discussions match this view yet." /></h2>
                  <p className="mt-1 text-sm text-[#667085]"><CommunityText text="Try another filter or start the first discussion." /></p>
                  <Link href="/ask/new" className={`mt-4 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${primaryButton}`}><Plus size={15} /> <CommunityText text="Start a Discussion" /></Link>
                </div>
              ) : <StarterCommunityState />
            ) : (
              <>
                {ideas.map((idea) => <CommunityCard key={idea.id} idea={idea} labels={content.communityPage} />)}
                {tyoraCases.map((story) => <CommunityCard key={`case-${story.id}`} story={story} labels={content.communityPage} />)}
              </>
            )}
          </div>

          <section className="mt-4 grid grid-cols-3 gap-2 xl:hidden">
            {[
              ["Discussions", activeDiscussions],
              ["TYORA Reviews", latestReviews.length],
              ["Countries", countries]
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-[#d8dee8] bg-white p-3 text-center">
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[11px] text-[#667085]"><CommunityText text={label as string} /></p>
              </div>
            ))}
          </section>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-[76px] space-y-3">
            <section className="rounded-xl border border-[#d8dee8] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <CircleHelp size={17} className="text-[#f59e0b]" />
                <h2 className="font-bold"><CommunityText text="Needs your advice" /></h2>
              </div>
              <div className="mt-3 divide-y divide-[#edf0f4]">
                {adviceIdeas.length > 0 ? adviceIdeas.map((idea) => (
                  <Link key={idea.id} href={`/ask/${idea.slug}`} className="group block py-3 first:pt-0">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-5 group-hover:text-[#155eef]">{idea.title}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#667085]"><MessageCircle size={12} /> {idea.comments.length} <CommunityText text="replies" /></span>
                  </Link>
                )) : <p className="text-sm text-[#667085]"><CommunityText text="Every visible idea has received guidance." /></p>}
              </div>
              <Link href="/ask?sort=unanswered" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#155eef]"><CommunityText text="View all unanswered" /> <ChevronRight size={13} /></Link>
            </section>

            {categoryCounts.length > 0 ? (
              <section className="rounded-xl border border-[#d8dee8] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2"><TrendingUp size={17} className="text-[#155eef]" /><h2 className="font-bold"><CommunityText text="Trending topics" /></h2></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryCounts.slice(0, 6).map(({ category, count }) => (
                    <Link key={category} href={`/ask?category=${encodeURIComponent(category)}`} className="rounded-md border border-[#d8dee8] bg-[#f8fafc] px-2 py-1.5 text-[11px] font-medium text-[#475467] transition hover:border-[#9dbcf7] hover:text-[#155eef]"># {category} · {count}</Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-xl border border-[#d8dee8] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2"><BadgeCheck size={17} className="text-[#078a83]" /><h2 className="font-bold"><CommunityText text="People helping" /></h2></div>
              <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-[#f1fbf9] p-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0b1426] text-xs font-bold text-white">T</span>
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1 text-xs font-bold"><CommunityText text="TYORA Manufacturing Team" /> <BadgeCheck size={12} className="text-[#078a83]" /></p>
                  <p className="text-[11px] text-[#667085]"><CommunityText text="Structured manufacturing assessments" /></p>
                </div>
              </div>
              {contributors.length > 0 ? <div className="mt-2 space-y-1">
                {contributors.map((person) => (
                  <div key={person.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                    <CommunityAvatar name={person.name} src={person.avatar} className="size-7 text-[9px]" />
                    <div className="min-w-0">
                      <p className="inline-flex max-w-full items-center gap-1 truncate text-xs font-semibold">
                        {person.name}
                        {person.expertVerified ? <BadgeCheck size={12} className="shrink-0 text-[#078a83]" /> : null}
                      </p>
                      <p className="text-[10px] text-[#667085]">{person.expertVerified ? person.expertRole || "Verified expert" : <CommunityText text="Community contributor" />}</p>
                    </div>
                  </div>
                ))}
              </div> : null}
            </section>

            <section className="rounded-xl border border-[#d8dee8] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2"><Rocket size={17} className="text-[#155eef]" /><h2 className="font-bold"><CommunityText text="Community progress" /></h2></div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#eef4ff] p-3"><p className="text-xl font-bold text-[#155eef]">{progressedIdeas}</p><p className="mt-1 text-[11px] leading-4 text-[#475467]"><CommunityText text="ideas moved beyond discussion" /></p></div>
                <div className="rounded-lg bg-[#f1fbf9] p-3"><p className="text-xl font-bold text-[#078a83]">{latestReviews.length}</p><p className="mt-1 text-[11px] leading-4 text-[#475467]"><CommunityText text="TYORA assessments published" /></p></div>
              </div>
              <p className="mt-3 text-[11px] leading-4 text-[#667085]"><CommunityText text="Every useful reply can move a product one step closer to manufacturing." /></p>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
