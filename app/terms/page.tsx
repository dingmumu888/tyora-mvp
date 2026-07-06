import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TYORA Terms of Service",
  description: "TYORA Terms of Service for manufacturing consulting inquiries."
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef6ff_0,#f6f7fb_36%,#f7f5f0_100%)] text-[#101216]">
      <header className="border-b border-[#eef1f4] bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-semibold tracking-normal">
            TYORA
            <span className="block text-[10px] font-medium uppercase text-[#69707d]">
              Idea2Product
            </span>
          </Link>
          <Link href="/" className="text-sm font-medium text-[#59616e] hover:text-[#101216]">
            Back to Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="mb-3 text-sm font-medium uppercase tracking-normal text-[#69707d]">
          Legal
        </p>
        <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
          TYORA Terms of Service
        </h1>
        <p className="mt-5 text-base leading-7 text-[#59616e]">
          These terms apply to TYORA website inquiries and manufacturing consulting
          services. By contacting TYORA, you agree to work with us in a clear,
          project-based business process.
        </p>

        <div className="mt-8 space-y-4 text-sm leading-7 text-[#59616e]">
          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Services</h2>
            <p className="mt-2">
              TYORA provides product development support, manufacturing consulting,
              supplier coordination, quotation review, sampling guidance, production
              follow-up, and related business services.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">No Manufacturing Guarantee</h2>
            <p className="mt-2">
              TYORA helps evaluate and coordinate manufacturing projects, but we do not
              guarantee that every idea can be manufactured, approved, priced, sampled,
              or produced exactly as requested.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Pricing And Scope</h2>
            <p className="mt-2">
              Pricing, deposits, service fees, deliverables, and project scope should be
              confirmed before work begins. Factory costs, tooling, samples, shipping,
              taxes, and third-party fees may vary by project.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Customer Decisions</h2>
            <p className="mt-2">
              Customers are responsible for final approval decisions, including product
              design, supplier selection, samples, production orders, packaging,
              compliance, and launch timing.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Communication</h2>
            <p className="mt-2">
              Most project communication may happen through WhatsApp, email, or other
              agreed channels. Clear and timely communication helps reduce project risk.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
