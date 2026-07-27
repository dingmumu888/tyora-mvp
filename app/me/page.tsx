import Link from "next/link";
import { CalendarDays, FileLock2, MapPin, Sparkles, UserRound } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";
import CommunityUserMenu from "@/components/community-user-menu";
import EmailLogin from "@/components/email-login";
import MarkNotificationsRead from "@/components/mark-notifications-read";
import MyTyoraLogoutButton from "@/components/my-tyora-logout-button";
import { getCommunitySession } from "@/lib/server/community-auth";
import { getCommunityUserActivity } from "@/lib/server/community-store";
import { getCustomInquiriesForUser } from "@/lib/server/custom-inquiry-store";
import ActivityMessages from "./activity-messages";
import ActivitySummary from "./activity-summary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "My TYORA | Creator Activity",
  description: "Your TYORA discussions, comments, liked ideas, and notifications.",
  robots: {
    index: false,
    follow: false
  }
};

const myTyoraDesktopNav = [
  { label: "Home", href: "/" },
  { label: "Source", href: "/source" },
  { label: "Hot", href: "/" },
  { label: "Custom", href: "/custom" },
  { label: "Community", href: "/ask" }
] as const;

export default async function MyTyoraPage() {
  const session = await getCommunitySession();
  const [activity, customInquiries] = session
    ? await Promise.all([
        getCommunityUserActivity(session.userId),
        getCustomInquiriesForUser(session.userId)
      ])
    : [null, []];

  if (!session || !activity) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_45%,#f7f5f0_100%)] px-4 pb-28 pt-16 text-[#101216] md:pb-16 md:pt-0">
        <header className="sticky top-0 z-30 -mx-4 mb-16 hidden border-b border-[#e4e8ef]/90 bg-white/88 backdrop-blur-xl md:block">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
            <Link href="/" className="leading-tight">
              <span className="block text-sm font-semibold text-[#101216]">TYORA</span>
              <span className="block text-xs font-medium text-[#69707d]">Product creator community</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="My TYORA desktop navigation">
              {myTyoraDesktopNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-[#59616e] transition hover:bg-[#f2f7ff] hover:text-[#2563eb]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
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
    { label: "Posts", value: stats.ideasPosted, view: "posts" as const },
    { label: "Comments", value: stats.commentsMade, view: "comments" as const },
    { label: "Likes", value: stats.likedIdeas, view: "likes" as const },
    { label: "I'd Buy", value: stats.interestedIdeas, view: "interested" as const },
    { label: "Reviews", value: ideas.filter((idea) => idea.review).length, view: "reviews" as const }
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
          <nav className="hidden items-center gap-1 md:flex" aria-label="My TYORA desktop navigation">
            {myTyoraDesktopNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-semibold text-[#59616e] transition hover:bg-[#f2f7ff] hover:text-[#2563eb]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <CommunityUserMenu loginClassName="inline-flex h-10 items-center rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#101216] shadow-sm transition hover:bg-[#f6f7fb]" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <aside id="profile" className="scroll-mt-24 rounded-[22px] border border-[#dfe6ef] bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
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
          <ActivitySummary items={compactStats} ideas={ideas} comments={comments} likedIdeas={likedIdeas} interestedIdeas={interestedIdeas} />
          <ActivityMessages notifications={notifications} unreadCount={totalUnread} />
          <section id="custom-inquiries" className="mt-4 scroll-mt-24 rounded-2xl border border-[#dfe6ef] bg-[#fbfcff] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold"><FileLock2 size={15} /> Private Custom</p>
                <p className="mt-1 text-xs text-[#69707d]">Visible only to you and authorized TYORA staff.</p>
              </div>
              <Link href="/custom" className="inline-flex min-h-10 items-center rounded-full bg-[#101216] px-3 text-xs font-semibold text-white">New inquiry</Link>
            </div>
            <div className="mt-3 grid gap-2">
              {customInquiries.length ? customInquiries.map((inquiry) => (
                <article key={inquiry.id}>
                  <Link
                    href={`/me/custom/${encodeURIComponent(inquiry.id)}`}
                    className="group block min-h-20 cursor-pointer rounded-xl border border-[#e4e8ef] bg-white p-3 transition hover:border-[#a8c5ff] hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
                    aria-label={`Open private Custom inquiry: ${inquiry.productName}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[#101216] underline-offset-4 group-hover:underline">{inquiry.productName}</h3>
                        <p className="mt-1 text-xs text-[#69707d]">{inquiry.status} · {inquiry.fileCount} private file{inquiry.fileCount === 1 ? "" : "s"}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#eef7f4] px-2.5 py-1 text-[11px] font-semibold text-[#0f766e]">Private</span>
                    </div>
                    {inquiry.nextStep ? <p className="mt-2 text-xs leading-5 text-[#59616e]">{inquiry.nextStep}</p> : null}
                  </Link>
                </article>
              )) : (
                <p className="rounded-xl bg-white p-3 text-xs leading-5 text-[#69707d]">No private Custom inquiries yet.</p>
              )}
            </div>
          </section>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/ask" className="inline-flex h-10 items-center justify-center rounded-full border border-[#dfe3e8] text-sm font-semibold">Community</Link>
            <Link href="/ask/new" className="inline-flex h-10 items-center justify-center rounded-full bg-[#101216] px-3 text-sm font-semibold text-white">New post</Link>
          </div>
          <div className="mt-2">
            <MyTyoraLogoutButton />
          </div>
        </aside>
      </div>
    </main>
  );
}
