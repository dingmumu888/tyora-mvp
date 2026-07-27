import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { getContent } from "@/lib/server/data-store";
import CommunityImage from "@/components/community-image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContent();
  const story = content.cases.find((item) => item.visible && item.slug === slug);
  return { title: story ? `${story.name} | TYORA Case` : "TYORA Case", description: story?.shortDescription || "TYORA manufacturing case." };
}

export default async function TyoraCaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContent();
  const story = content.cases.find((item) => item.visible && item.slug === slug);
  if (!story) notFound();
  const images = [story.coverImage.desktopUrl, story.conceptImage, story.prototypeImage, story.manufacturingImage, story.finalImage].filter((value, index, list) => value && list.indexOf(value) === index);
  const reviewRows = [
    ["Manufacturing review", story.manufacturingReview],
    ["Suggested material", story.suggestedMaterial],
    ["Suggested process", story.suggestedProcess],
    ["MOQ", story.moq],
    ["Timeline", story.timeline]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const processRows = [["Concept", story.concept], ["Prototype", story.prototype], ["Manufacturing", story.manufacturing], ["Outcome", story.final]].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f6f7fb_38%,#f7f5f0_100%)] pb-28 text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e8ebef] bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4"><Link href="/ask" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Ask TYORA</Link><span className="rounded-full bg-[#101216] px-3 py-1 text-xs font-semibold text-white">{story.badgeLabel || "TYORA Case"}</span></div></header>
      <article className="mx-auto max-w-3xl space-y-3 px-3 py-3 sm:px-5">
        <section className="rounded-[24px] border border-[#e4e8ef] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-[#2563eb]">{story.category}</span><span className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-[#667085]">{story.status}</span>{story.projectType === "Demonstration Project" ? <span className="rounded-full bg-[#fff7d6] px-2.5 py-1 text-[#8a5a00]">Demonstration Project</span> : <span className="rounded-full bg-[#e8f8ef] px-2.5 py-1 text-[#15803d]">Real Project</span>}</div>
          <h1 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl">{story.name}</h1>
          <p className="mt-3 text-base leading-7 text-[#343b47]">{story.shortDescription}</p>
          {images.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{images.map((image, index) => <CommunityImage key={image} src={image} alt={`${story.name} ${index + 1}`} className={`${index === 0 ? "col-span-2 sm:col-span-2" : ""} aspect-square w-full overflow-hidden rounded-[16px] object-cover`} fallbackClassName="size-full" />)}</div> : null}
        </section>
        <section className="rounded-[18px] border border-[#99f6e4] bg-white p-4 shadow-sm shadow-[#14b8a6]/10"><div className="flex items-center gap-2"><Sparkles size={18} className="text-[#14b8a6]" /><h2 className="text-base font-semibold text-[#0f766e]">TYORA Case Review</h2></div><dl className="mt-3 grid gap-2 sm:grid-cols-2">{reviewRows.map(([label, value]) => <div key={label} className="rounded-2xl border border-[#d5f5ec] p-3"><dt className="text-xs font-semibold uppercase text-[#0f766e]">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6">{value}</dd></div>)}</dl>{story.projectType === "Demonstration Project" ? <p className="mt-3 rounded-2xl border border-[#fde7b1] bg-[#fffaf0] p-3 text-xs leading-5 text-[#7c5a16]">This is a TYORA demonstration project, not a verified customer production result.</p> : null}</section>
        {processRows.length > 0 ? <section className="rounded-[18px] border border-[#e4e8ef] bg-white p-4"><h2 className="text-lg font-semibold">Project path</h2><div className="mt-3 grid gap-2">{processRows.map(([label, value], index) => <div key={label} className="grid grid-cols-[32px_1fr] gap-3 rounded-2xl bg-[#f8fafc] p-3"><span className="flex size-8 items-center justify-center rounded-full bg-[#101216] text-xs font-semibold text-white">{index + 1}</span><div><h3 className="text-sm font-semibold">{label}</h3><p className="mt-1 text-sm leading-6 text-[#59616e]">{value}</p></div></div>)}</div></section> : null}
        <Link href={story.ctaHref} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">{story.ctaText} <ArrowRight size={16} /></Link>
      </article>
    </main>
  );
}
