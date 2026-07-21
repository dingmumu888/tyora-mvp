import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileLock2,
  Files,
  MapPin,
  PackageSearch,
  ShieldCheck
} from "lucide-react";
import { GET as getCustomInquiryApi } from "@/app/api/community/custom/[id]/route";
import type { CustomInquiry, TyoraReview } from "@/lib/community";
import type { ApiSuccess } from "@/lib/server/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Private Custom Inquiry | My TYORA",
  description: "View your private TYORA Custom inquiry.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true
  }
};

async function loadAuthorizedInquiry(id: string) {
  const safeId = id.trim();
  if (!safeId) notFound();

  const response = await getCustomInquiryApi(
    new Request(`https://tyora.internal/api/community/custom/${encodeURIComponent(safeId)}`, {
      cache: "no-store"
    }),
    { params: Promise.resolve({ id: safeId }) }
  );

  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Private Custom inquiry is temporarily unavailable.");

  const payload = await response.json() as ApiSuccess<CustomInquiry>;
  if (!payload.success || !payload.data) {
    throw new Error("Private Custom inquiry is temporarily unavailable.");
  }
  return payload.data;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function customerStatus(status: string) {
  if (status === "Submitted" || status === "Need Information") return "Needs Reply";
  return status;
}

function assessmentRows(assessment?: Partial<TyoraReview>) {
  if (!assessment) return [];
  return [
    ["Manufacturing feasibility", assessment.manufacturingFeasible],
    ["Estimated cost range", assessment.estimatedCostRange],
    ["Estimated MOQ", assessment.estimatedMoq],
    ["Assumptions", assessment.assumptions],
    ["Confidence", assessment.confidence],
    ["Recommended next step", assessment.recommendedNextStep]
  ].filter((row): row is [string, string] => Boolean(row[1]));
}

export default async function PrivateCustomInquiryPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiry = await loadAuthorizedInquiry(id);
  const reviewRows = assessmentRows(inquiry.assessmentSnapshot);
  const detailRows = [
    { label: "Category", value: inquiry.category, icon: PackageSearch },
    { label: "Quantity", value: inquiry.quantity, icon: Files },
    { label: "Budget", value: inquiry.budget, icon: CircleDollarSign },
    { label: "Target market", value: inquiry.targetMarket, icon: MapPin },
    { label: "Timeline", value: inquiry.timeline, icon: Clock3 },
    { label: "Submitted", value: dateLabel(inquiry.createdAt), icon: CalendarDays }
  ].filter((item) => item.value);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] pb-[calc(8.75rem+env(safe-area-inset-bottom))] text-[#101216] md:pb-16">
      <header className="sticky top-0 z-30 border-b border-[#dfe6ef] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link
            href="/me#custom-inquiries"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#344054] transition hover:bg-[#f2f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            My TYORA
          </Link>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#eef7f4] px-3 text-xs font-semibold text-[#0f766e]">
            <FileLock2 size={15} aria-hidden="true" />
            Private
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="border-b border-[#dfe6ef] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fff7e6] px-3 py-1.5 text-xs font-semibold text-[#9a5b00]">
              {customerStatus(inquiry.status)}
            </span>
            <span className="rounded-full border border-[#cfe7df] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f766e]">
              Private and confidential
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{inquiry.productName}</h1>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#59616e] sm:text-base">
            {inquiry.productDescription}
          </p>
        </section>

        <section aria-labelledby="inquiry-details" className="py-6">
          <h2 id="inquiry-details" className="text-lg font-semibold">Submission details</h2>
          <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-[#dfe6ef] bg-[#dfe6ef] sm:grid-cols-2 lg:grid-cols-3">
            {detailRows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0 bg-white p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-[#667085]">
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-2 break-words text-sm font-semibold text-[#101216]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {inquiry.nextStep ? (
          <section aria-labelledby="next-step" className="border-y border-[#dfe6ef] py-6">
            <h2 id="next-step" className="text-lg font-semibold">TYORA update</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#475467]">{inquiry.nextStep}</p>
          </section>
        ) : null}

        {reviewRows.length ? (
          <section aria-labelledby="assessment" className="border-b border-[#dfe6ef] py-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={19} className="text-[#0f766e]" aria-hidden="true" />
              <h2 id="assessment" className="text-lg font-semibold">Approved Idea assessment</h2>
            </div>
            <dl className="mt-4 divide-y divide-[#e4e8ef] border-y border-[#e4e8ef]">
              {reviewRows.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
                  <dt className="text-sm font-semibold text-[#344054]">{label}</dt>
                  <dd className="whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{value}</dd>
                </div>
              ))}
            </dl>
            {inquiry.assessmentSnapshot?.disclaimer ? (
              <p className="mt-4 text-xs leading-5 text-[#667085]">{inquiry.assessmentSnapshot.disclaimer}</p>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="private-files" className="py-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="private-files" className="text-lg font-semibold">Private files</h2>
              <p className="mt-1 text-xs leading-5 text-[#667085]">
                Files are available only to you and authorized TYORA staff.
              </p>
            </div>
            <span className="text-sm font-semibold text-[#344054]">{inquiry.fileCount}</span>
          </div>
          {inquiry.fileCount ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Array.from({ length: inquiry.fileCount }, (_, index) => (
                <a
                  key={index}
                  href={`/api/community/custom/${encodeURIComponent(inquiry.id)}/files/${index}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-[#dfe6ef] bg-white px-4 text-sm font-semibold text-[#101216] transition hover:border-[#a8c5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                >
                  <FileLock2 size={17} className="text-[#315fbd]" aria-hidden="true" />
                  Open private file {index + 1}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-[#cfd7e3] bg-white px-4 py-5 text-sm text-[#667085]">
              No files were submitted with this inquiry.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
