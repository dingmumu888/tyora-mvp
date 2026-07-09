import Link from "next/link";
import { CalendarDays, MapPin, Sparkles, UserRound } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";
import CommunityImage from "@/components/community-image";
import EmailLogin from "@/components/email-login";
import MarkNotificationsRead from "@/components/mark-notifications-read";
import MyTyoraLogoutButton from "@/components/my-tyora-logout-button";
import { getCommunitySession } from "@/lib/server/community-auth";
import { getCommunityUserActivity } from "@/lib/server/community-store";
import { CommunityIdea } from "@/lib/community";
import ActivityMessages from "./activity-messages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "My TYORA | Creator Activity",
  description: "Your TYORA discussions, comments, liked ideas, and notifications."
};

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 6e4));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function IdeaRow({ idea, meta }: { idea: CommunityIdea; meta?: string }) {
  return (
    <Link href={`/ask/${idea.slug}`} className="grid gap-3 rounded-[18px] border border-[#e3e9f1] bg-white p-3 shadow-sm shadow-[#101216]/4 transition hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-[0_14px_36px_rgba(37,99,235,0.12)] sm:grid-cols-[92px_1fr]">
      <div className="relative flex min-h-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#e9f7f3] via-white to-[#eff4ff] text-lg font-semibold">
        <CommunityImage src={idea.imageUrls[0]} alt={idea.title} className="absolute inset-0 size-full object-cover" fallbackClassName="absolute inset-0 p-4" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#69707d]">
          <span className="rounded-full bg-[#f4f6f8] px-2 py-1">{idea.category}</span>
          <span>{idea.status}</span>
          <span>{meta || timeAgo(idea.updatedAt || idea.createdAt)}</span>
        </div>
        <h3 className="mt-2 line-clamp-1 text-base font-semibold text-[#101216]">{idea.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#59616e]">{idea.description}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-[#69707d]">
          <span>{idea.likeCount} Love</span>
          <span>{idea.comments.length} Comments</span>
          <span>{idea.interestedCount} I'd Buy</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ title, cta }: { title: string; cta?: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#cfd8e6] bg-white/78 p-5 text-sm text-[#69707d]">
      <p className="font-semibold text-[#101216]">{title}</p>
      {cta ? <Link href="/ask/new" className="mt-3 inline-flex rounded-full bg-[#101216] px-4 py-2 text-xs font-semibold text-white">{cta}</Link> : null}
    </div>
  );
}

export default async function MyTyoraPage() {
  const session = await getCommunitySession();
  const activity = session ? await getCommunityUserActivity(session.userId) : null;

  if (!session || !activity) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_45%,#f7f5f0_100%)] px-4 pb-28 pt-16 text-[#101216] md:pb-16">
        <section className="mx-auto max-w-xl rounded-[28px] border border-[#dfe6ef] bg-white p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#101216] text-white"><Sparkles size={20} /></div>
          <h1 className="mt-5 text-3xl font-semibold">Log in to view My TYORA</h1>
          <p className="mt-3 text-sm leading-6 text-[#59616e]">See your discussions, comments, liked ideas, and community notifications on this device.</p>
          <EmailLogin refreshOnSuccess className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20">
            Email Login
          </EmailLogin>
        </section>
      </main>
    );
  }

  const { user, stats, ideas, comments, likedIdeas, interestedIdeas, notifications } = activity;
  const totalUnread =
    stats.unreadReceivedComments + stats.unreadReceivedReactions + stats.unreadReviewedIdeas + stats.unreadStatusIdeas;
  const profileMeta = [
    ["Product Creator", UserRound],
    [user.country || "Global", MapPin],
    [`Joined ${new Date(user.joinedAt).getFullYear()}`, CalendarDays]
  ] as const;
  const compactStats = [
    { label: "Posts", value: stats.ideasPosted, href: "#discussions" },
    { label: "Comments", value: stats.commentsMade, href: "#comments" },
    { label: "Likes", value: stats.likedIdeas, href: "#liked" },
    { label: "I'd Buy", value: stats.interestedIdeas, href: "#liked" },
    { label: "Reviews", value: ideas.filter((idea) => idea.review).length, href: "#messages" }
  ] as const;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_42%,#f7f5f0_100%)] pb-28 text-[#101216] md:pb-12">
      <MarkNotificationsRead />
      <header className="sticky top-0 z-30 border-b border-[#e4e8ef]/90 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/me" className="leading-tight">
            <span className="block text-sm font-semibold text-[#101216]">My TYORA</span>
            <span className="block text-xs font-medium text-[#69707d]">Profile & activity</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-semibold text-[#59616e] md:flex">
            <a href="#messages" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Messages</a>
            <a href="#discussions" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">My Discussions</a>
            <a href="#comments" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">My Comments</a>
            <a href="#liked" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Following</a>
          </nav>
          <Link href="#profile" className="inline-flex items-center gap-2 rounded-full border border-[#dfe6ef] bg-white px-2 py-1.5 shadow-sm shadow-[#101216]/5" aria-label="Profile summary">
            <CommunityAvatar name={user.name} src={user.avatar} className="size-8 text-xs" />
            <span className="hidden max-w-28 truncate pr-2 text-sm font-semibold text-[#101216] sm:block">{user.name}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[290px_1fr] lg:px-8">
        <aside id="profile" className="scroll-mt-24 self-start rounded-[22px] border border-[#dfe6ef] bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.08)] lg:sticky lg:top-20">
          <div className="flex items-center gap-3">
            <CommunityAvatar name={user.name} src={user.avatar} className="size-14 text-lg" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{user.name}</h1>
              <p className="truncate text-sm text-[#69707d]">@{user.username}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profileMeta.map(([label, Icon]) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f7ff] px-3 py-1.5 text-xs font-semibold text-[#315fbd]">
                <Icon size={13} />
                {label}
              </span>
            ))}
          </div>
          {user.bio ? <p className="mt-4 text-sm leading-6 text-[#59616e]">{user.bio}</p> : <p className="mt-4 text-sm leading-6 text-[#8b93a1]">Set up your profile so founders know who they're talking to.</p>}
          <div className="mt-4 grid grid-cols-5 gap-1 rounded-[18px] bg-[#f7f8fa] p-2">
            {compactStats.map(({ label, value, href }) => (
              <Link key={label} href={href} className="rounded-2xl bg-white px-2 py-2 text-center shadow-sm shadow-[#101216]/3 transition hover:-translate-y-0.5 hover:text-[#315fbd] hover:shadow-md">
                <p className="text-base font-semibold">{value}</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#69707d]">{label}</p>
              </Link>
            ))}
          </div>
          <ActivityMessages notifications={notifications} unreadCount={totalUnread} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/ask" className="inline-flex h-10 items-center justify-center rounded-full border border-[#dfe3e8] text-sm font-semibold">Community</Link>
            <Link href="/ask/new" className="inline-flex h-10 items-center justify-center rounded-full bg-[#101216] px-3 text-sm font-semibold text-white">New post</Link>
          </div>
          <div className="mt-2">
            <MyTyoraLogoutButton />
          </div>
        </aside>

        <div className="grid gap-4">
          <section id="discussions" className="scroll-mt-24 rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
            <h2 className="text-xl font-semibold">My Discussions</h2>
            <div className="mt-3 grid gap-2">
              {ideas.length ? ideas.map((idea) => <IdeaRow key={idea.id} idea={idea} />) : <EmptyState title="You haven't started a discussion yet." cta="Start a Discussion" />}
            </div>
          </section>

          <section id="comments" className="scroll-mt-24 rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
            <h2 className="text-xl font-semibold">My Comments</h2>
            <div className="mt-3 grid gap-2">
              {comments.length ? comments.map((comment) => (
                <Link key={comment.id} href={`/ask/${comment.idea.slug}`} className="rounded-[18px] border border-[#e4e8ef] bg-[#fbfcfe] p-4 transition hover:border-[#93c5fd]">
                  <p className="text-sm leading-6 text-[#59616e]">"{comment.body}"</p>
                  <p className="mt-2 text-sm font-semibold text-[#101216]">{comment.idea.title}</p>
                  <p className="mt-1 text-xs text-[#8b93a1]">{timeAgo(comment.createdAt)}</p>
                </Link>
              )) : <EmptyState title="You haven't commented on any ideas yet." />}
            </div>
          </section>

          <section id="liked" className="scroll-mt-24 rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
            <h2 className="text-xl font-semibold">Following / Interested Ideas</h2>
            <p className="mt-1 text-sm text-[#69707d]">Ideas you liked or marked as something you'd buy.</p>
            <div className="mt-3 grid gap-2">
              {likedIdeas.length ? likedIdeas.map((item) => <IdeaRow key={item.id} idea={item.idea} meta={`Liked ${timeAgo(item.createdAt)}`} />) : <EmptyState title="Ideas you love will appear here." />}
              {interestedIdeas.length ? interestedIdeas.map((item) => <IdeaRow key={item.id} idea={item.idea} meta={`I'd Buy ${timeAgo(item.createdAt)}`} />) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
