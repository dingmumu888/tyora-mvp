import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function PrivateCustomInquiryNotFound() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] px-4 pb-[calc(8.75rem+env(safe-area-inset-bottom))] pt-20 text-[#101216] md:pb-16">
      <section className="mx-auto max-w-lg border-y border-[#dfe6ef] bg-white px-5 py-10 text-center sm:px-8">
        <FileQuestion className="mx-auto text-[#667085]" size={30} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Private inquiry not found</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          This inquiry is unavailable or you do not have permission to view it.
        </p>
        <Link
          href="/me#custom-inquiries"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101216] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
        >
          Back to My TYORA
        </Link>
      </section>
    </main>
  );
}
