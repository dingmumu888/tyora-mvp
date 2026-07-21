"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";

export default function PrivateCustomInquiryError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] px-4 pb-[calc(8.75rem+env(safe-area-inset-bottom))] pt-20 text-[#101216] md:pb-16">
      <section className="mx-auto max-w-lg border-y border-[#dfe6ef] bg-white px-5 py-10 text-center sm:px-8">
        <CircleAlert className="mx-auto text-[#b42318]" size={30} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold">Unable to load this inquiry</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Your private information remains protected. Try again or return to My TYORA.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/me#custom-inquiries"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#344054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
          >
            Back to My TYORA
          </Link>
        </div>
      </section>
    </main>
  );
}
