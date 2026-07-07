import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Eye,
  Filter,
  Heart,
  MessageCircle,
  PackageCheck,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { CommunityFeedSort, CommunityIdea, CommunityStatus } from "@/lib/community";
import { getCommunityIdeas } from "@/lib/server/community-store";
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

const categories = ["Phone Accessories", "Pet", "Home", "Office", "Kitchen", "Outdoor", "Electronics", "Fashion"];
const topNav = ["Discover Ideas", "Ask TYORA", "Journeys", "Success Stories", "Pricing"];
const statusSteps = ["Idea", "Discussion", "TYORA Review", "Prototype", "Manufacturing", "Shipping"];
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] hover:shadow-md hover:shadow-[#2563eb]/25";
const starterExamples = [
  {
    title: "Magnetic Phone Stand",
    category: "Phone Accessories",
    description: "A foldable desk stand with a weighted base, magnetic ring, and manufacturable hinge design."
  },
  {
    title: "Portable Pet Water Bottle",
    category: "Pet",
    description: "A leak-resistant travel bottle with a one-hand drinking tray and easy-clean plastic parts."
  },
  {
    title: "Travel Coffee Mug",
    category: "Kitchen",
    description: "A compact insulated mug with a secure lid, tactile grip, and low-MOQ material options."
  }
];

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

function activity(ideas: CommunityIdea[]) {
  const latestReviews = ideas.filter((idea) => idea.review).slice(0, 4);
  const latestComments = ideas.flatMap((idea) => idea.comments.map((comment) => ({ idea, comment }))).slice(-4).reverse();
  return [
    ...ideas.slice(0, 4).map((idea) => `${idea.author.name} uploaded a new idea`),
    ...latestReviews.map((idea) => `TYORA replied to ${idea.title}`),
    ...latestComments.map(({ comment }) => `${comment.author.name} commented`)
  ].slice(0, 7);
}

function CommunityCard({ idea }: { idea: CommunityIdea }) {
  const progress = statusProgress(idea.status);

  return (
    <article className="group overflow-hidden rounded-[12px] border border-[#e1e6ee] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition duration-150 hover:-translate-y-0.5 hover:border-[#cfd8e6] hover:shadow-[0_14px_38px_rgba(15,23,42,0.1)]">
      <div className="grid gap-0 sm:grid-cols-[108px_1fr]">
        <Link href={`/ask/${idea.slug}`} className={`relative block min-h-24 overflow-hidden bg-gradient-to-br ${coverTone(idea)}`}>
          <CommunityImage src={idea.imageUrls[0]} alt={idea.title} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]" fallbackClassName="absolute inset-0 p-6" initialsClassName="bg-white/74" />
          <span className="absolute left-2 top-2 rounded-full bg-white/88 px-2 py-0.5 text-[10px] font-semibold text-[#101216] backdrop-blur">{idea.category}</span>
        </Link>

        <div className="min-w-0 p-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#69707d]">
            <span className="rounded-full bg-[#f4f6f8] px-2 py-1">{flagFor(idea.country)}</span>
            <span>{idea.author.name}</span>
            <span>{timeAgo(idea.createdAt)}</span>
            <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${statusStyles[idea.status]}`}>{idea.status}</span>
          </div>

          <Link href={`/ask/${idea.slug}`} className="mt-1.5 block">
            <h2 className="line-clamp-1 text-base font-semibold leading-tight tracking-normal text-[#101216]">{idea.title}</h2>
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#59616e]">{idea.description}</p>
          </Link>

          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
            {idea.questions.slice(0, 2).map((question) => (
              <span key={question} className="rounded-full border border-[#e8ebef] px-2.5 py-1 text-[#59616e]">{question}</span>
            ))}
            <span className="rounded-full border border-[#e8ebef] px-2.5 py-1 text-[#59616e]">Concept</span>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
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

            <div className="flex items-center gap-1">
              <CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="-ml-1 size-6 border text-[10px]" />
              {["TY", "CM"].map((item) => (
                <span key={item} className="-ml-1 flex size-6 items-center justify-center rounded-full border border-white bg-[#edf2f7] text-[10px] font-semibold text-[#59616e]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-3 text-xs font-medium text-[#69707d]">
              <span className="inline-flex items-center gap-1"><Heart size={14} /> {idea.likeCount} Love</span>
              <span className="inline-flex items-center gap-1"><MessageCircle size={14} /> {idea.comments.length}</span>
              <span className="inline-flex items-center gap-1"><ShoppingBag size={14} /> {idea.interestedCount} I&apos;d Buy</span>
              <span className="inline-flex items-center gap-1"><Eye size={14} /> {Math.max(idea.likeCount + idea.comments.length + idea.interestedCount, 1) * 17}</span>
            </div>
            <Link href={`/ask/${idea.slug}`} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${primaryButton}`}>
              Join Discussion <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ExampleCommunityCard({ example, index }: { example: (typeof starterExamples)[number]; index: number }) {
  const tone = ["from-[#e9f7f3] via-white to-[#efe9ff]", "from-[#fff4e7] via-white to-[#e9f2ff]", "from-[#edf7ff] via-white to-[#effaf3]"][index % 3];

  return (
    <Link href="/ask/new" className="group grid gap-0 overflow-hidden rounded-[12px] border border-dashed border-[#cdd6e2] bg-white/94 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_38px_rgba(15,23,42,0.09)] sm:grid-cols-[108px_1fr]">
      <div className={`relative flex min-h-24 items-center justify-center bg-gradient-to-br ${tone}`}>
        <span className="rounded-2xl bg-white/78 px-3 py-2 text-lg font-semibold shadow-sm ring-1 ring-white">
          {example.title.slice(0, 2).toUpperCase()}
        </span>
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#69707d] ring-1 ring-[#e8ebef]">
          Example
        </span>
      </div>
      <div className="min-w-0 p-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#69707d]">
          <span className="rounded-full bg-[#f4f6f8] px-2 py-1">{example.category}</span>
          <span>Demo prompt</span>
          <span className="inline-flex items-center gap-1 text-[#0f766e]"><span className="size-1.5 rounded-full bg-[#14b8a6]" /> Ready for review</span>
        </div>
        <h3 className="mt-1.5 line-clamp-1 text-base font-semibold">{example.title}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#59616e]">{example.description}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb]">
          Start from this example <ChevronRight size={13} />
        </p>
      </div>
    </Link>
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
            Share a product idea and get a free manufacturing review from TYORA.
          </p>
        </div>
        <Link href="/ask/new" className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${primaryButton}`}>
          <Plus size={16} /> Start a Discussion
        </Link>
      </div>

      <div className="mt-4 grid gap-2.5">
        {starterExamples.map((example, index) => (
          <Link
            key={example.title}
            href="/ask/new"
            className="grid gap-3 rounded-[14px] border border-[#e4e8ef] bg-[#fbfbfc] p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-[#101216]/6 sm:grid-cols-[116px_1fr]"
          >
            <div className={`relative flex min-h-24 items-center justify-center rounded-xl bg-gradient-to-br ${["from-[#e9f7f3] via-white to-[#efe9ff]", "from-[#fff4e7] via-white to-[#e9f2ff]", "from-[#edf7ff] via-white to-[#effaf3]"][index]}`}>
              <span className="rounded-2xl bg-white/78 px-3 py-2 text-lg font-semibold shadow-sm ring-1 ring-white">
                {example.title.slice(0, 2).toUpperCase()}
              </span>
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase text-[#69707d] ring-1 ring-[#e8ebef]">
                Example
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#69707d]">
                <span className="rounded-full bg-white px-2 py-1 ring-1 ring-[#e8ebef]">{example.category}</span>
                <span>Demo prompt</span>
              </div>
              <h3 className="mt-2 line-clamp-1 text-lg font-semibold">{example.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#59616e]">{example.description}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2563eb]">
                Use this as inspiration <ChevronRight size={13} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function AskCommunityPage({ searchParams }: { searchParams: Promise<{ sort?: CommunityFeedSort }> }) {
  const { sort = "trending" } = await searchParams;
  const ideas = await getCommunityIdeas(sort);
  const latestReviews = ideas.filter((idea) => idea.review);
  const projectsStarted = ideas.filter((idea) => ["Project Started", "Manufacturing", "Shipping", "Completed"].includes(idea.status)).length;
  const delivered = ideas.filter((idea) => idea.status === "Completed");
  const countries = new Set(ideas.map((idea) => idea.country).filter(Boolean)).size;
  const liveActivity = activity(ideas);
  const feedExamples = ideas.length < 4 ? starterExamples.slice(0, 4 - ideas.length) : [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f5f7fb_32%,#f7f5f0_72%,#eef2f8_100%)] pb-20 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e8ebef]/90 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1520px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-normal">TYORA</Link>
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {topNav.map((item) => (
              <Link key={item} href={item === "Ask TYORA" || item === "Discover Ideas" ? "/ask" : item === "Pricing" ? "/#pricing" : "/ask"} className="rounded-full px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f2f4f7] hover:text-[#101216]">
                {item}
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
            <button className="hidden size-10 items-center justify-center rounded-full border border-[#dfe3e8] bg-white md:inline-flex" aria-label="Notifications">
              <Bell size={16} />
            </button>
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
                <span className="inline-flex items-center gap-2 rounded-2xl bg-[#f6fefb] px-3 py-2 text-[#0f766e]"><span className="size-2 rounded-full bg-[#14b8a6] shadow-[0_0_0_4px_rgba(20,184,166,0.12)]" /> {Math.max(ideas.length * 3, 8)} creators online</span>
                <Link href="/ask/new" className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 font-semibold ${primaryButton}`}><Plus size={15} /> Start a Discussion</Link>
                <a href="#feed" className="inline-flex h-10 items-center justify-center rounded-full border border-[#dfe3e8] font-semibold">Browse Ideas</a>
                <span className="rounded-2xl bg-[#eef6ff] p-3 text-sm font-semibold text-[#315fbd]">3 FREE Expert Reviews per day</span>
              </div>
            </section>

            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-2.5 shadow-sm shadow-[#101216]/4">
              {["Discover Ideas", "Following", "My Discussions", "My Projects", "Notifications"].map((item) => (
                <Link key={item} href="/ask" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#59616e] transition hover:bg-[#f5f6f8] hover:text-[#101216]">
                  {item}<ChevronRight size={14} />
                </Link>
              ))}
            </section>

            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-2.5 shadow-sm shadow-[#101216]/4">
              <p className="px-3 text-xs font-semibold uppercase text-[#8b93a1]">Categories</p>
              <div className="mt-2 grid gap-1.5">
                {categories.map((item) => <Link key={item} href="/ask" className="rounded-xl bg-[#f8fafc] px-3 py-1.5 text-[13px] text-[#59616e] transition hover:bg-[#eef6ff] hover:text-[#1d4ed8]">{item}</Link>)}
              </div>
            </section>

            <section className="rounded-[18px] border border-[#d7f1eb] bg-[#effaf6] p-3">
              <p className="text-sm font-semibold text-[#0f766e]">Invite Friends</p>
              <p className="mt-1 text-sm leading-6 text-[#3d766d]">Get FREE review quota</p>
            </section>
          </div>
        </aside>

        <section id="feed" className="min-w-0">
          <div className="rounded-[16px] border border-[#dfe6ef] bg-white/96 p-3.5 shadow-[0_10px_36px_rgba(15,23,42,0.07)] sm:p-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-xs font-semibold text-[#315fbd]">
              <Sparkles size={14} /> 3 FREE Expert Reviews per day
            </p>
            <div className="mt-2.5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
              <div>
                <h1 className="max-w-3xl text-2xl font-semibold leading-[1.05] tracking-normal sm:text-3xl">What are founders building next?</h1>
                <p className="mt-2 max-w-[300px] text-sm leading-6 text-[#59616e] sm:max-w-2xl">
                  Share your idea. Get a FREE manufacturing review within 8 working hours.
                </p>
                <p className="mt-2 max-w-[320px] break-words text-sm font-medium text-[#315fbd] sm:max-w-2xl">Founders are discussing product ideas with TYORA manufacturing experts.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/ask/new" className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ${primaryButton}`}><Plus size={16} /> Start a Discussion</Link>
                <a href="#ideas" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-5 text-sm font-semibold"><Search size={16} /> Browse Ideas</a>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["Ideas Shared", ideas.length],
                ["TYORA Reviews", latestReviews.length],
                ["Projects Started", projectsStarted],
                ["Products Delivered", delivered.length],
                ["Countries", countries]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#e7edf5] bg-gradient-to-br from-white to-[#f7fbff] p-2.5 shadow-sm shadow-[#101216]/3">
                  <p className="text-lg font-semibold">{value}</p>
                  <p className="mt-1 text-xs font-medium text-[#69707d]">{label}</p>
                </div>
              ))}
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
            {ideas.length === 0 ? (
              <StarterCommunityState />
            ) : (
              <>
                {ideas.map((idea) => <CommunityCard key={idea.id} idea={idea} />)}
                {feedExamples.map((example, index) => <ExampleCommunityCard key={example.title} example={example} index={index} />)}
              </>
            )}
          </div>

          <div className="mt-3 grid gap-3 xl:hidden">
            <section className="rounded-[16px] border border-[#e4e8ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
              <h2 className="text-base font-semibold">Live Activity</h2>
              <div className="mt-3 grid gap-2 text-sm text-[#59616e]">
                {liveActivity.length === 0 ? (
                  <>
                    <p className="rounded-2xl bg-[#f7f8fa] p-3">A founder uploads a product idea.</p>
                    <p className="rounded-2xl bg-[#f7f8fa] p-3">Creators discuss feasibility, cost and materials.</p>
                  </>
                ) : liveActivity.slice(0, 2).map((item) => (
                  <p key={item} className="rounded-2xl bg-[#f7f8fa] p-3">{item}</p>
                ))}
              </div>
            </section>
            <section className="rounded-[16px] border border-[#e4e8ef] bg-white p-4">
              <h2 className="text-base font-semibold">Community Statistics</h2>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-[#69707d]">
                {[
                  ["Ideas", ideas.length],
                  ["Reviews", latestReviews.length],
                  ["Projects", projectsStarted],
                  ["Built", delivered.length]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f8fa] p-3">
                    <p className="text-lg font-semibold text-[#101216]">{value}</p>
                    <p>{label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-3">
            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-3.5 shadow-[0_10px_36px_rgba(15,23,42,0.07)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Live Activity</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-1 text-[11px] font-semibold text-[#0f766e]"><span className="size-1.5 rounded-full bg-[#14b8a6]" /> Live</span>
              </div>
              <div className="mt-3 space-y-2">
                {liveActivity.length === 0 ? (
                  <>
                    <p className="rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]"><span className="mr-2 inline-block size-2 rounded-full bg-[#14b8a6]" />A founder uploads a product idea.</p>
                    <p className="rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]"><span className="mr-2 inline-block size-2 rounded-full bg-[#f59e0b]" />Creators discuss feasibility and cost.</p>
                    <p className="rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]"><span className="mr-2 inline-block size-2 rounded-full bg-[#2563eb]" />TYORA experts reply with guidance.</p>
                  </>
                ) : null}
                {liveActivity.map((item, index) => <p key={item} className="rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]"><span className={`mr-2 inline-block size-2 rounded-full ${index % 3 === 0 ? "bg-[#14b8a6]" : index % 3 === 1 ? "bg-[#f59e0b]" : "bg-[#2563eb]"}`} />{item}</p>)}
              </div>
            </section>

            <section className="rounded-[16px] border border-[#dfe6ef] bg-white p-3.5 shadow-sm shadow-[#101216]/4">
              <h2 className="text-base font-semibold">Products Built</h2>
              <div className="mt-3 space-y-2">
                {delivered.length === 0 ? (
                  <>
                    <p className="rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]">Idea → TYORA Review → Project Started</p>
                    <p className="rounded-2xl bg-[#f7f8fa] p-2.5 text-[13px] text-[#59616e]">Manufacturing → Shipping → Delivered</p>
                  </>
                ) : null}
                {delivered.slice(0, 3).map((idea) => (
                  <Link key={idea.id} href={`/ask/${idea.slug}`} className="block rounded-2xl border border-[#eef1f4] p-3">
                    <p className="font-semibold">{idea.title}</p>
                    <p className="mt-1 text-xs text-[#69707d]">Delivered · {idea.country}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[16px] border border-[#e8ebef] bg-[#101216] p-3.5 text-white shadow-[0_16px_44px_rgba(15,23,42,0.18)]">
              <h2 className="text-base font-semibold">Journey of the Week</h2>
              <div className="mt-3 grid gap-1.5 text-sm text-white/72">
                {["Idea", "TYORA Review", "Prototype", "Manufacturing", "Delivered"].map((step) => <span key={step} className="rounded-full bg-white/8 px-3 py-1.5">{step}</span>)}
              </div>
              <Link href="/ask" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#101216]">View Full Journey</Link>
            </section>

            <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4">
              <h2 className="text-lg font-semibold">Community Statistics</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Ideas", ideas.length],
                  ["Reviews", latestReviews.length],
                  ["Projects", projectsStarted],
                  ["Delivered", delivered.length]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#f7f8fa] p-3">
                    <p className="text-lg font-semibold text-[#101216]">{value}</p>
                    <p className="text-xs text-[#69707d]">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8ebef] bg-white/92 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[calc(100vw-2rem)] items-center justify-between gap-3 sm:max-w-[1520px]">
          <p className="hidden text-sm font-semibold sm:block">Ready to build your idea?</p>
          <Link href="/ask/new" className={`inline-flex h-10 w-full max-w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold sm:ml-auto sm:w-auto ${primaryButton}`}>
            <span className="hidden sm:inline">Continue This Project on WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
            <Send size={14} className="shrink-0" />
          </Link>
        </div>
      </div>

      <Link href="/ask/new" className="fixed bottom-20 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#14b8a6] px-4 text-sm font-semibold text-white shadow-xl shadow-[#14b8a6]/25 sm:px-5">
        <PackageCheck size={17} /> <span className="hidden sm:inline">Ask TYORA</span>
      </Link>
    </main>
  );
}
