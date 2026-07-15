"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Boxes,
  Check,
  Factory,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Menu,
  MessageCircle,
  PackageCheck,
  PackageSearch,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  type LucideIcon
} from "lucide-react";
import CmsImage from "@/components/cms-image";
import CommunityImage from "@/components/community-image";
import CommunityUserMenu from "@/components/community-user-menu";
import SiteSearch from "@/components/site-search";
import { CommunityIdea } from "@/lib/community";
import { CaseStudy, defaultContent, loadContent, SiteContent } from "@/lib/storage";

type HomepagePostCardProps = {
  badge: string;
  badgeTone: "blue" | "green";
  title: string;
  description: string;
  review: string;
  meta: string;
  disclosure?: string;
  href: string;
  ctaText?: string;
  media: ReactNode;
  stats?: {
    likes: number;
    comments: number;
  };
};

const iconMap: Record<string, LucideIcon> = {
  idea: Lightbulb,
  source: PackageSearch,
  custom: Factory
};

function timeAgo(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ideaScore(idea: CommunityIdea) {
  return (idea.homepageFeatured ? 1000 : 0)
    + (idea.isHot ? 200 : 0)
    + idea.likeCount * 3
    + idea.comments.length * 5
    + idea.interestedCount * 2;
}

function reviewSummary(idea: CommunityIdea) {
  if (!idea.review) return "";
  if (idea.review.additionalNotes?.trim()) return idea.review.additionalNotes.trim();
  return [
    idea.review.manufacturingFeasible,
    idea.review.estimatedCostRange,
    idea.review.estimatedMoq,
    idea.review.suggestedMaterial,
    idea.review.suggestedManufacturing
  ].filter((value): value is string => Boolean(value?.trim())).join(" | ");
}

function HomepagePostCard({
  badge,
  badgeTone,
  title,
  description,
  review,
  meta,
  disclosure,
  href,
  ctaText,
  media,
  stats
}: HomepagePostCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-[#dde3eb] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-[#eef2f6]" aria-label={`Open ${title}`}>
        {media}
        <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${badgeTone === "green" ? "bg-[#0f766e] text-white" : "bg-[#155eef] text-white"}`}>
          {badge}
        </span>
        {disclosure ? (
          <span className="absolute bottom-3 right-3 max-w-[80%] rounded-md bg-white/92 px-2 py-1 text-[11px] font-medium text-[#344054] shadow-sm">
            {disclosure}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-[#667085]">{meta}</p>
        <Link href={href} className="mt-2 text-lg font-semibold leading-6 text-[#101828] hover:text-[#155eef]">
          {title}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#475467]">{description}</p>
        {review ? (
          <div className="mt-4 border-l-2 border-[#14b8a6] pl-3">
            <p className="text-xs font-semibold uppercase text-[#0f766e]">TYORA Review</p>
            <p className="mt-1 line-clamp-3 text-sm font-semibold leading-6 text-[#101828]">{review}</p>
          </div>
        ) : null}
        <div className="mt-auto flex min-h-10 items-end justify-between gap-3 pt-4">
          {stats ? (
            <div className="flex items-center gap-4 text-sm text-[#667085]" aria-label="Community engagement">
              <span className="inline-flex items-center gap-1.5"><Heart size={16} /> {stats.likes}</span>
              <span className="inline-flex items-center gap-1.5"><MessageCircle size={16} /> {stats.comments}</span>
            </div>
          ) : <span />}
          <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#155eef]">
            {ctaText || "Open Idea"} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CaseCard({ story }: { story: CaseStudy }) {
  return (
    <HomepagePostCard
      badge={story.badgeLabel}
      badgeTone="green"
      title={story.name}
      description={story.shortDescription}
      review={story.manufacturingReview}
      meta={`${story.category} | ${story.status}`}
      disclosure={story.projectType}
      href={story.ctaHref}
      ctaText={story.ctaText}
      media={(
        <CmsImage
          image={story.coverImage}
          fallbackAlt={`${story.name} case image`}
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
          className="absolute inset-0 size-full"
        />
      )}
    />
  );
}

function CommunityCard({ idea }: { idea: CommunityIdea }) {
  return (
    <HomepagePostCard
      badge={idea.category}
      badgeTone="blue"
      title={idea.title}
      description={idea.description}
      review={reviewSummary(idea)}
      meta={`${idea.author.name} | ${timeAgo(idea.updatedAt || idea.createdAt)}`}
      href={`/ask/${idea.slug}`}
      stats={{ likes: idea.likeCount, comments: idea.comments.length }}
      media={(
        <CommunityImage
          src={idea.imageUrls[0]}
          alt={idea.title}
          className="size-full object-cover transition duration-300 hover:scale-[1.02]"
          fallbackClassName="size-full bg-[#eef2f6]"
        />
      )}
    />
  );
}

export default function Home() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [communityIdeas, setCommunityIdeas] = useState<CommunityIdea[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    void loadContent().then(setContent).catch(() => setContent(defaultContent));
  }, []);

  useEffect(() => {
    fetch("/api/community/ideas?sort=trending&limit=24", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setCommunityIdeas(Array.isArray(payload.data) ? payload.data : []))
      .catch(() => setCommunityIdeas([]))
      .finally(() => setCommunityLoading(false));
  }, []);

  const homepage = content.homepage;
  const navigation = homepage.navigationLinks.filter((link) => link.visible).sort((left, right) => left.order - right.order);
  const heroCampaign = homepage.campaigns
    .filter((campaign) => campaign.visible)
    .sort((left, right) => left.order - right.order)[0] || defaultContent.homepage.campaigns[0];
  const paths = homepage.paths.filter((path) => path.visible).sort((left, right) => left.order - right.order);
  const categories = homepage.categories.filter((category) => category.visible).sort((left, right) => left.order - right.order);

  const eligibleIdeas = useMemo(() => communityIdeas
    .filter((idea) => (
      idea.visibility === "Public"
      && !idea.hidden
      && idea.imageUrls.length > 0
      && Boolean(reviewSummary(idea))
      && ideaScore(idea) >= homepage.communityMinimumScore
    ))
    .sort((left, right) => {
      if (left.homepageFeatured !== right.homepageFeatured) return Number(right.homepageFeatured) - Number(left.homepageFeatured);
      if (left.homepageFeatured && right.homepageFeatured) {
        const orderGap = (left.homepageFeaturedOrder || 99) - (right.homepageFeaturedOrder || 99);
        if (orderGap !== 0) return orderGap;
      }
      const scoreGap = ideaScore(right) - ideaScore(left);
      if (scoreGap !== 0) return scoreGap;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    })
    .slice(0, homepage.communityLimit), [communityIdeas, homepage.communityLimit, homepage.communityMinimumScore]);

  const featuredCases = useMemo(() => content.cases
    .filter((story) => story.visible)
    .sort((left, right) => {
      if (left.featured !== right.featured) return Number(right.featured) - Number(left.featured);
      return left.order - right.order;
    })
    .slice(0, homepage.caseLimit), [content.cases, homepage.caseLimit]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pb-28 text-[#101828] md:pb-0">
      <header className="sticky top-0 z-50 border-b border-[#e4e7ec] bg-white/96 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="TYORA home">
            {content.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.logoImage} alt="" className="size-8 rounded-md object-cover" />
            ) : (
              <span className="grid size-8 place-items-center rounded-md bg-[#101828] text-white"><Sparkles size={16} /></span>
            )}
            <span className="text-lg font-bold tracking-normal text-[#101828]">TYORA</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary navigation">
            {navigation.map((link) => (
              <Link key={link.id} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-[#475467] transition hover:bg-[#f2f4f7] hover:text-[#101828]">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <SiteSearch className="hidden w-44 xl:block" />
            <CommunityUserMenu loginClassName="inline-flex min-h-10 items-center rounded-md border border-[#d0d5dd] px-3 text-sm font-semibold text-[#344054]" />
            <Link href={heroCampaign.primaryCtaHref} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#155eef] px-4 text-sm font-semibold text-white transition hover:bg-[#004eeb]">
              {heroCampaign.primaryCtaText} <ArrowRight size={15} />
            </Link>
          </div>

          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="grid size-11 place-items-center rounded-md border border-[#d0d5dd] text-[#101828] md:hidden" aria-expanded={mobileMenuOpen} aria-label="Toggle navigation">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileMenuOpen ? (
          <nav className="border-t border-[#e4e7ec] bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-lg gap-1">
              {navigation.map((link) => (
                <Link key={link.id} href={link.href} onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold text-[#344054] hover:bg-[#f2f4f7]">
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="relative h-[calc(100svh-112px)] min-h-[520px] max-h-[680px] overflow-hidden border-b border-[#dfe3e8] md:h-[calc(100vh-128px)] md:min-h-[520px] md:max-h-[640px]" aria-labelledby="homepage-campaign-title">
        <CmsImage
          image={heroCampaign.image}
          fallbackAlt="TYORA manufacturing campaign"
          sizes="100vw"
          priority
          className="absolute inset-0 size-full rounded-none"
          imageClassName="object-cover"
        />
        <div className="absolute inset-0 bg-white/76" />
        <div className="relative mx-auto flex h-full max-w-[1280px] items-center px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl py-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-[#155eef]">
              <span>{heroCampaign.eyebrow}</span>
              {heroCampaign.badge ? <span className="rounded-md border border-[#b2ccff] bg-white/90 px-2 py-1 text-[#1849a9]">{heroCampaign.badge}</span> : null}
            </div>
            <h1 id="homepage-campaign-title" className="mt-5 max-w-[18ch] text-4xl font-bold leading-[1.08] text-[#101828] sm:text-5xl lg:text-6xl">
              {heroCampaign.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#344054] sm:text-lg sm:leading-8">{heroCampaign.description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={heroCampaign.primaryCtaHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#155eef] px-5 text-sm font-semibold text-white transition hover:bg-[#004eeb]">
                <Upload size={17} /> {heroCampaign.primaryCtaText} <ArrowRight size={16} />
              </Link>
              {heroCampaign.secondaryCtaText ? (
                <Link href={heroCampaign.secondaryCtaHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#98a2b3] bg-white/88 px-5 text-sm font-semibold text-[#101828] transition hover:bg-white">
                  {heroCampaign.secondaryCtaText} <ArrowRight size={16} />
                </Link>
              ) : null}
            </div>
            {heroCampaign.disclosure ? <p className="mt-4 text-xs font-medium text-[#667085]">{heroCampaign.disclosure}</p> : null}
          </div>
        </div>
      </section>

      <section className="border-b border-[#e4e7ec] bg-[#f8fafc]" aria-labelledby="assessment-title">
        <div className="mx-auto grid max-w-[1280px] gap-6 px-5 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-[#155eef]">{homepage.assessmentEyebrow}</p>
            <h2 id="assessment-title" className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{homepage.assessmentTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#475467] sm:text-base">{homepage.assessmentDescription}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {homepage.assessmentPoints.map((point) => (
              <div key={point} className="flex min-h-12 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-semibold text-[#344054]">
                <Check size={16} className="shrink-0 text-[#0f766e]" /> {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ideas-and-cases" className="scroll-mt-20 border-b border-[#e4e7ec] bg-white" aria-labelledby="ideas-cases-title">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-[#155eef]">{homepage.communityEyebrow}</p>
              <h2 id="ideas-cases-title" className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{homepage.communityTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-[#475467] sm:text-base">{homepage.communityDescription}</p>
            </div>
            <Link href={homepage.communityCtaHref} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-md border border-[#d0d5dd] px-4 text-sm font-semibold text-[#344054] hover:bg-[#f8fafc] sm:self-auto">
              {homepage.communityCtaText} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {eligibleIdeas.map((idea) => <CommunityCard key={idea.id} idea={idea} />)}
            {featuredCases.map((story) => <CaseCard key={story.id} story={story} />)}
          </div>

          {!communityLoading && eligibleIdeas.length === 0 ? (
            <div className="mt-6 flex items-start gap-3 border-l-2 border-[#b2ccff] pl-4 text-sm text-[#475467]">
              <ImageIcon size={18} className="mt-0.5 shrink-0 text-[#155eef]" />
              <div><p className="font-semibold text-[#101828]">{homepage.communityEmptyTitle}</p><p className="mt-1">{homepage.communityEmptyBody}</p></div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-[#e4e7ec] bg-[#f8fafc]" aria-labelledby="paths-title">
        <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 id="paths-title" className="text-3xl font-bold leading-tight sm:text-4xl">{homepage.pathsTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-[#475467] sm:text-base">{homepage.pathsDescription}</p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {paths.map((path) => {
              const Icon = iconMap[path.icon] || Boxes;
              return (
                <Link key={path.id} href={path.href} className="group flex min-h-56 flex-col rounded-lg border border-[#d0d5dd] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#84adff] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                  <span className="grid size-11 place-items-center rounded-md bg-[#eff4ff] text-[#155eef]"><Icon size={22} /></span>
                  <h3 className="mt-5 text-xl font-semibold">{path.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#475467]">{path.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#155eef]">{path.ctaText} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="border-b border-[#e4e7ec] bg-white" aria-labelledby="categories-title">
          <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <h2 id="categories-title" className="text-2xl font-bold sm:text-3xl">{homepage.categoriesTitle}</h2>
              <p className="max-w-xl text-sm leading-6 text-[#667085]">{homepage.categoriesNote}</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {categories.map((category) => (
                <Link key={category.id} href={category.href} className="group overflow-hidden rounded-lg border border-[#d0d5dd] bg-white">
                  {category.image.visible && category.image.desktopUrl ? (
                    <CmsImage image={category.image} fallbackAlt={category.name} sizes="(max-width: 767px) 50vw, 220px" className="aspect-[4/3] w-full rounded-none" />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center bg-[#f2f4f7] text-[#667085]"><PackageCheck size={25} /></div>
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold leading-5 group-hover:text-[#155eef]">{category.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">{category.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-[#d0d5dd] bg-[#f8fafc]" aria-labelledby="source-process-title">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-[#155eef]">{homepage.sourceEyebrow}</p>
            <h2 id="source-process-title" className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{homepage.sourceTitle}</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#475467] sm:text-base">{homepage.sourceDescription}</p>
            <Link href={homepage.sourceCtaHref} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#101828] px-4 text-sm font-semibold text-white hover:bg-[#1d2939]">
              {homepage.sourceCtaText} <ArrowRight size={16} />
            </Link>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {homepage.sourceSteps.map((step, index) => {
              const icons = [Upload, SearchCheck, ShieldCheck];
              const Icon = icons[index] || PackageCheck;
              return (
                <li key={`${step.title}-${index}`} className="min-h-52 rounded-lg border border-[#d0d5dd] bg-white p-4">
                  <span className="flex items-center justify-between"><span className="text-xs font-bold text-[#155eef]">0{index + 1}</span><Icon size={20} className="text-[#344054]" /></span>
                  <h3 className="mt-8 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-[#101828] text-white" aria-labelledby="final-cta-title">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-8 px-5 py-14 sm:px-6 lg:flex-row lg:items-end lg:px-8 lg:py-18">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-[#84adff]">{homepage.finalEyebrow}</p>
            <h2 id="final-cta-title" className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{homepage.finalTitle}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d0d5dd] sm:text-base">{homepage.finalDescription}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href={homepage.finalPrimaryCtaHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#155eef] px-5 text-sm font-semibold text-white hover:bg-[#004eeb]">
              {homepage.finalPrimaryCtaText} <ArrowRight size={16} />
            </Link>
            <Link href={homepage.finalSecondaryCtaHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#667085] px-5 text-sm font-semibold text-white hover:bg-[#1d2939]">
              {homepage.finalSecondaryCtaText} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e4e7ec] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-8 text-sm text-[#667085] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="font-bold text-[#101828]">TYORA</p><p className="mt-1 max-w-md">{content.footerSlogan}</p></div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/service-scope">Service Scope</Link>
            <Link href="/me">My TYORA</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
