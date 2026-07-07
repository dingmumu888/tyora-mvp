import Link from "next/link";
import { Bell, Heart, MessageCircle, PackageCheck, PenLine, Send, Settings, Sparkles, ThumbsUp } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";
import CommunityImage from "@/components/community-image";
import EmailLogin from "@/components/email-login";
import { getCommunitySession } from "@/lib/server/community-auth";
import { getCommunityUserActivity } from "@/lib/server/community-store";
import { CommunityIdea } from "@/lib/community";

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

function badgeCount(value: number) {
  if (value <= 0) return "";
  return value > 99 ? "99+" : String(value);
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
          <EmailLogin className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20">
            Email Login
          </EmailLogin>
        </section>
      </main>
    );
  }

  const { user, stats, ideas, comments, likedIdeas, interestedIdeas, notifications } = activity;
  const statCards = [
    ["Ideas posted", stats.ideasPosted, PenLine],
    ["Comments made", stats.commentsMade, MessageCircle],
    ["Liked ideas", stats.likedIdeas, Heart],
    ["I'd Buy", stats.interestedIdeas, ThumbsUp],
    ["Received comments", stats.receivedComments, Send],
    ["Received likes", stats.receivedLikes + stats.receivedInterested, Bell]
  ] as const;
  const topNotificationCards = [
    ["Received comments", stats.receivedComments, Send],
    ["Received likes", stats.receivedLikes + stats.receivedInterested, Bell],
    ["TYORA reviews", ideas.filter((idea) => idea.review).length, PackageCheck]
  ] as const;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_42%,#f7f5f0_100%)] pb-28 text-[#101216] md:pb-12">
      <header className="sticky top-0 z-30 border-b border-[#e4e8ef]/90 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/ask" className="text-sm font-semibold">TYORA</Link>
          <nav className="hidden items-center gap-1 text-sm font-semibold text-[#59616e] md:flex">
            <a href="#discussions" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">My Discussions</a>
            <a href="#comments" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">My Comments</a>
            <a href="#liked" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Liked Ideas</a>
            <a href="#notifications" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Notifications</a>
          </nav>
          <Link href="/ask/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2563eb] px-4 text-sm font-semibold text-white">
            <PenLine size={15} /> Start a Discussion
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[290px_1fr] lg:px-8">
        <aside className="self-start rounded-[22px] border border-[#dfe6ef] bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.08)] lg:sticky lg:top-20">
          <div className="flex items-center gap-3">
            <CommunityAvatar name={user.name} src={user.avatar} className="size-14 text-lg" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{user.name}</h1>
              <p className="truncate text-sm text-[#69707d]">@{user.username}</p>
            </div>
          </div>
          {user.bio ? <p className="mt-4 text-sm leading-6 text-[#59616e]">{user.bio}</p> : <p className="mt-4 text-sm leading-6 text-[#8b93a1]">Set up your profile so founders know who they're talking to.</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statCards.slice(0, 4).map(([label, value, Icon]) => (
              <div key={label} className="rounded-2xl bg-[#f7f8fa] p-3">
                <Icon size={15} className="text-[#2563eb]" />
                <p className="mt-2 text-lg font-semibold">{value}</p>
                <p className="text-xs text-[#69707d]">{label}</p>
              </div>
            ))}
          </div>
          <Link href="/ask" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-[#dfe3e8] text-sm font-semibold">Back to community</Link>
        </aside>

        <div className="grid gap-4">
          <section className="rounded-[22px] border border-[#dfe6ef] bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.07)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#315fbd]">My TYORA</p>
                <h2 className="mt-1 text-3xl font-semibold">Your creator activity</h2>
              </div>
              <Link href="/me#notifications" className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-4 py-2 text-sm font-semibold text-[#315fbd]">
                <Bell size={15} /> {stats.notifications} notifications
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {topNotificationCards.map(([label, value, Icon]) => (
                <div key={label} className="relative rounded-2xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
                  {badgeCount(value) ? <span className="absolute right-3 top-3 rounded-full bg-[#ff385c] px-2 py-1 text-[10px] font-bold leading-none text-white">NEW {badgeCount(value)}</span> : null}
                  <Icon size={16} className="text-[#0f766e]" />
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                  <p className="text-sm text-[#69707d]">{label}</p>
                </div>
              ))}
            </div>
          </section>

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
            <h2 className="text-xl font-semibold">Liked Ideas</h2>
            <div className="mt-3 grid gap-2">
              {likedIdeas.length ? likedIdeas.map((item) => <IdeaRow key={item.id} idea={item.idea} meta={`Liked ${timeAgo(item.createdAt)}`} />) : <EmptyState title="Ideas you love will appear here." />}
              {interestedIdeas.length ? interestedIdeas.map((item) => <IdeaRow key={item.id} idea={item.idea} meta={`I'd Buy ${timeAgo(item.createdAt)}`} />) : null}
            </div>
          </section>

          <section id="notifications" className="scroll-mt-24 rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-sm shadow-[#101216]/4">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <div className="mt-3 grid gap-2">
              {notifications.length ? notifications.map((item) => (
                <Link key={item.id} href={item.href} className="flex gap-3 rounded-[18px] border border-[#e4e8ef] bg-[#fbfcfe] p-4 transition hover:border-[#93c5fd]">
                  <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f2f7ff] text-[#315fbd]">
                    <Bell size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#101216]">{item.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-5 text-[#59616e]">{item.body}</span>
                    <span className="mt-1 block text-xs text-[#8b93a1]">{timeAgo(item.createdAt)}</span>
                  </span>
                </Link>
              )) : <EmptyState title="Comments, likes, TYORA reviews, and status updates will appear here." />}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
