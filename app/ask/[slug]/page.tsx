import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, CircleHelp } from "lucide-react";
import { CommunityQuestion, CommunityStatus } from "@/lib/community";
import { getCommunityIdeaBySlug } from "@/lib/server/community-store";
import { getCurrentIdeaAccessContext } from "@/lib/server/idea-access-context";
import { getContent } from "@/lib/server/data-store";
import CommunityAvatar from "@/components/community-avatar";
import CommunityText from "@/components/community-text";
import CommunityDetailHeader from "@/components/community-detail-header";
import ProfileCountryName from "@/components/profile-country-name";
import IdeaActions from "./idea-actions";
import IdeaComments from "./idea-comments";
import IdeaImageGallery from "./idea-image-gallery";
import IdeaDetailText, { IdeaRelativeTime } from "./idea-detail-text";
import type { IdeaDetailKey } from "@/lib/idea-detail-i18n";

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

const questionKeys: Record<CommunityQuestion, IdeaDetailKey> = {
  "Can this be manufactured?": "canManufacture",
  "Estimated Cost?": "estimatedCost",
  "Material Suggestion?": "materialSuggestion",
  "MOQ Estimate?": "moqEstimate",
  "Factory Recommendation?": "factoryRecommendation",
  Other: "customQuestion"
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getCommunityIdeaBySlug(slug, await getCurrentIdeaAccessContext());
  const isPublic = idea?.visibility === "Public" && !idea.hidden;
  return {
    title: idea ? `${idea.title} | Ask TYORA Community` : "Ask TYORA Idea",
    description: idea?.description || "Manufacturing discussion on Ask TYORA Community.",
    alternates: isPublic ? { canonical: `/ask/${encodeURIComponent(slug)}` } : undefined,
    robots: isPublic
      ? { index: true, follow: true }
      : { index: false, follow: false }
  };
}

export default async function CommunityIdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const context = await getCurrentIdeaAccessContext();
  const [idea, content] = await Promise.all([
    getCommunityIdeaBySlug(slug, context),
    getContent()
  ]);
  if (!idea) notFound();

  const labels = content.communityPage.assessmentLabels;
  const isOwner = context.userId === idea.author.id;
  const reviewDetails = idea.review ? [
    [labels.feasibility, idea.review.manufacturingFeasible],
    [labels.estimatedCostRange, idea.review.estimatedCostRange],
    [labels.estimatedMoq, idea.review.estimatedMoq],
    [labels.suggestedMaterial, idea.review.suggestedMaterial],
    [labels.suggestedProcess, idea.review.suggestedManufacturing],
    [labels.moldRequirement, idea.review.moldRequirement],
    [labels.mainRisks, idea.review.mainRisks],
    [labels.recommendedNextStep, idea.review.recommendedNextStep],
    [labels.assumptions, idea.review.assumptions],
    [labels.confidence, idea.review.confidence]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => ({ label, value })) : [];
  const authorProfile = idea.author.occupation || idea.author.industry;
  const questionItems = idea.questions.map((question) => ({
    question,
    custom: question === "Other" ? idea.otherQuestion : undefined
  }));
  const reviewAction = idea.review?.customEligible ? {
    href: isOwner ? `/custom?idea=${encodeURIComponent(idea.slug)}` : content.communityPage.continueWithTyoraHref,
    label: isOwner ? content.communityPage.startCustomProjectText : content.communityPage.continueWithTyoraText
  } : undefined;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f8] pb-28 text-[#0b1426] md:pb-16">
      <CommunityDetailHeader
        brandName={content.brandName}
        logoImage={content.logoImage}
        showBrandNameWithLogo={content.showBrandNameWithLogo}
      />

      <div className="mx-auto w-full max-w-[1040px] space-y-3 px-3 py-4 sm:px-5 sm:py-6">
        <article className="overflow-hidden rounded-[22px] border border-[#d8dee8] bg-white shadow-sm shadow-[#0b1426]/5">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Link href={`/creator/${encodeURIComponent(idea.author.id)}`} className="shrink-0 rounded-full outline-none transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#155eef]/20" aria-label={`View ${idea.author.name}'s profile`}>
                <CommunityAvatar name={idea.author.name} src={idea.author.avatar} className="size-11 border-0 text-sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link href={`/creator/${encodeURIComponent(idea.author.id)}`} className="truncate text-sm font-bold text-[#0b1426] underline-offset-4 hover:text-[#155eef] hover:underline">{idea.author.name}</Link>
                  {idea.author.expertVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f4] px-2 py-0.5 text-[10px] font-bold text-[#06756f]">
                      <BadgeCheck size={11} /> {idea.author.expertRole || "Verified expert"}
                    </span>
                  ) : null}
                  {authorProfile ? <span className="text-xs text-[#667085]">· {authorProfile}</span> : null}
                  {idea.author.country || idea.author.countryCode ? (
                    <span className="text-xs text-[#667085]">
                      · <ProfileCountryName country={idea.author.country} countryCode={idea.author.countryCode} />
                    </span>
                  ) : null}
                  <span className="text-xs text-[#8b93a1]">· <IdeaRelativeTime value={idea.createdAt} /></span>
                </div>
                <p className="mt-0.5 text-xs text-[#8b93a1]">
                  <IdeaDetailText textKey={idea.visibility === "Public" ? "public" : "private"} />
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusStyles[idea.status]}`}>
                <CommunityText text={idea.status} />
              </span>
            </div>

            <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-[-0.025em] sm:text-[34px]">{idea.title}</h1>

            {idea.imageUrls.length > 0 ? (
              <div className="mt-4">
                <IdeaImageGallery imageUrls={idea.imageUrls} title={idea.title} />
              </div>
            ) : null}

            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-[#344054] sm:text-base">{idea.description}</p>

            {questionItems.length > 0 ? (
              <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-[#d8dee8] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#475467]">
                <CircleHelp size={17} className="mt-0.5 shrink-0 text-[#155eef]" />
                <p className="flex flex-wrap gap-x-1.5 gap-y-1">
                  <strong className="text-[#0b1426]"><IdeaDetailText textKey="questionLead" /></strong>
                  {questionItems.map((item, index) => (
                    <span key={`${item.question}-${index}`}>
                      {item.custom || <IdeaDetailText textKey={questionKeys[item.question]} />}
                      {index < questionItems.length - 1 ? " ·" : ""}
                    </span>
                  ))}
                </p>
              </div>
            ) : null}

            <IdeaActions idea={idea} mode="bar" compact labels={content.communityPage} />
          </div>
        </article>

        <IdeaComments
          slug={idea.slug}
          comments={idea.comments}
          review={idea.review}
          reviewDetails={reviewDetails}
          reviewAction={reviewAction}
        />
      </div>
    </main>
  );
}
