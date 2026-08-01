import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Heart, MapPin, MessageCircle, PackageCheck, ShoppingBag, UserRound } from "lucide-react";
import CommunityDetailHeader from "@/components/community-detail-header";
import CommunityImage from "@/components/community-image";
import CommunityText from "@/components/community-text";
import CreatorAvatarViewer from "@/components/creator-avatar-viewer";
import MyTyoraText from "@/components/my-tyora-text";
import ProfileCountryName from "@/components/profile-country-name";
import { getContent } from "@/lib/server/data-store";
import { getPublicCreatorProfile } from "@/lib/server/community-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const profile = await getPublicCreatorProfile(publicId);
  return profile
    ? { title: `${profile.user.name} | TYORA Creator`, description: profile.user.bio || `${profile.user.name}'s public TYORA ideas.` }
    : { title: "Creator | TYORA" };
}

export default async function CreatorPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const [profile, content] = await Promise.all([getPublicCreatorProfile(publicId), getContent()]);
  if (!profile) notFound();
  const { user, ideas, stats } = profile;
  const statItems = [
    ["posts", stats.posts, UserRound],
    ["comments", stats.comments, MessageCircle],
    ["likes", stats.helpful, Heart],
    ["interested", stats.interested, ShoppingBag],
    ["reviews", stats.reviews, PackageCheck]
  ] as const;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_44%,#f7f5f0_100%)] pb-20 text-[#101216]">
      <CommunityDetailHeader brandName={content.brandName} logoImage={content.logoImage} showBrandNameWithLogo={content.showBrandNameWithLogo} />
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <section className="rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <CreatorAvatarViewer name={user.name} src={user.avatar} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{user.name}</h1>
                {user.expertVerified ? <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f4] px-2.5 py-1 text-xs font-bold text-[#06756f]"><BadgeCheck size={14} /> {user.expertRole || "TYORA"}</span> : null}
              </div>
              {user.occupation ? <p className="mt-2 text-base font-semibold text-[#475467]">{user.occupation}</p> : null}
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {user.industry ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f7ff] px-3 py-1.5 text-xs font-semibold text-[#315fbd]"><UserRound size={13} /><CommunityText text={user.industry} /></span> : null}
                {user.country || user.countryCode ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f7ff] px-3 py-1.5 text-xs font-semibold text-[#315fbd]"><MapPin size={13} /><ProfileCountryName country={user.country} countryCode={user.countryCode} /></span> : null}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f7ff] px-3 py-1.5 text-xs font-semibold text-[#315fbd]"><CalendarDays size={13} /><MyTyoraText textKey="joined" values={{ year: new Date(user.joinedAt).getFullYear() }} /></span>
              </div>
              {user.bio ? <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-[#59616e] sm:text-base">{user.bio}</p> : null}
            </div>
          </div>
          <div className="mt-7 grid grid-cols-5 gap-2 rounded-[22px] bg-[#f7f8fa] p-2">
            {statItems.map(([label, value, Icon]) => <div key={label} className="rounded-2xl bg-white px-1 py-3 text-center shadow-sm"><Icon size={15} className="mx-auto text-[#315fbd]" /><strong className="mt-1 block text-lg">{value}</strong><span className="block text-[10px] font-medium text-[#69707d]"><MyTyoraText textKey={label} /></span></div>)}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#315fbd]">TYORA</p><h2 className="mt-1 text-2xl font-bold"><MyTyoraText textKey="posts" /></h2></div>
            <Link href="/ask" className="rounded-full border border-[#dfe3e8] bg-white px-4 py-2 text-sm font-semibold"><MyTyoraText textKey="community" /></Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <Link key={idea.id} href={`/ask/${idea.slug}`} className="group overflow-hidden rounded-[22px] border border-[#dfe6ef] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#e9f7f3] via-white to-[#eff4ff]"><CommunityImage src={idea.imageUrls[0]} alt={idea.title} className="absolute inset-0 size-full object-contain transition duration-300 group-hover:scale-[1.02]" fallbackClassName="absolute inset-0 p-6" /></div>
                <div className="p-4"><div className="flex items-center gap-2 text-[11px] font-semibold text-[#69707d]"><span className="rounded-full bg-[#eef4ff] px-2 py-1 text-[#155eef]">{idea.category}</span><span>{new Date(idea.createdAt).toLocaleDateString()}</span></div><h3 className="mt-3 line-clamp-2 text-lg font-bold group-hover:text-[#155eef]">{idea.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#59616e]">{idea.description}</p></div>
              </Link>
            ))}
          </div>
          {!ideas.length ? <p className="mt-4 rounded-[22px] border border-dashed border-[#cfd8e6] bg-white p-6 text-sm text-[#69707d]"><MyTyoraText textKey="noPosts" /></p> : null}
        </section>
      </div>
    </main>
  );
}
