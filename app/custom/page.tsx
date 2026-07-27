import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { getCommunitySession } from "@/lib/server/community-auth";
import { getEligibleCustomIdeaContext } from "@/lib/server/custom-inquiry-store";
import { getContent } from "@/lib/server/data-store";
import CustomInquiryClient from "./custom-inquiry-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Custom Product Development | TYORA",
  description: "Send a private custom product project to TYORA for manufacturability, MOQ, mold, sample, and budget review."
};

export default async function CustomPage({ searchParams }: { searchParams: Promise<{ idea?: string }> }) {
  const [content, session, params] = await Promise.all([
    getContent(),
    getCommunitySession(),
    searchParams
  ]);
  const ideaSlug = typeof params.idea === "string" ? params.idea.trim().slice(0, 220) : "";
  const eligibleIdea = session && ideaSlug
    ? await getEligibleCustomIdeaContext(ideaSlug, session.userId)
    : null;
  const categories = content.homepage.categories
    .filter((category) => category.visible)
    .sort((left, right) => left.order - right.order)
    .map((category) => category.name);
  const pricing = content.pricing.filter((plan) => plan.visible).sort((left, right) => left.order - right.order);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_42%,#f7f5f0_100%)] pb-28 text-[#101216] md:pb-16">
      <header className="sticky top-0 z-40 border-b border-[#e4e8ef]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold">TYORA</Link>
          <nav className="hidden items-center gap-1 text-sm font-semibold text-[#59616e] md:flex">
            <Link href="/ask" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Ideas</Link>
            <Link href="/source" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">Source</Link>
            <Link href="/custom" className="rounded-full bg-[#101216] px-3 py-2 text-white">Custom</Link>
            <Link href="/me" className="rounded-full px-3 py-2 hover:bg-[#f3f5f8]">My TYORA</Link>
          </nav>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-3 text-xs font-semibold"><LockKeyhole size={14} /> Private</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-10">
        <div className="self-start rounded-[24px] border border-[#dfe6ef] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-[#315fbd]">{content.customPage.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">{content.customPage.title}</h1>
          <p className="mt-4 text-sm leading-7 text-[#59616e]">{content.customPage.subtitle}</p>
          <div className="mt-5 rounded-2xl border border-[#cfe7df] bg-[#f2fbf7] p-4">
            <ShieldCheck size={18} className="text-[#0f766e]" />
            <p className="mt-2 text-sm leading-6 text-[#315f56]">{content.customPage.privacyNote}</p>
          </div>
        </div>
        <CustomInquiryClient
          content={content.customPage}
          communityContent={content.communityPage}
          categories={categories}
          eligibleIdea={eligibleIdea}
          signedIn={Boolean(session)}
          sessionEmail={session?.email}
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-[#dfe6ef] bg-white p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">{content.pricingTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[#59616e]">{content.pricingSubtitle}</p>
          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            {pricing.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
                <p className="text-sm font-semibold text-[#315fbd]">{plan.name}</p>
                <p className="mt-2 text-xl font-semibold">{plan.price}</p>
                <p className="mt-2 text-sm leading-6 text-[#69707d]">{plan.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
