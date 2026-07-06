import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TYORA Privacy Policy",
  description: "TYORA Privacy Policy for website visitors and project inquiries."
};

export default function PrivacyPolicyPage() {
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
          TYORA Privacy Policy
        </h1>
        <p className="mt-5 text-base leading-7 text-[#59616e]">
          TYORA keeps data collection minimal. We collect only the information needed to
          understand your product inquiry and start a business conversation.
        </p>

        <div className="mt-8 space-y-4 text-sm leading-7 text-[#59616e]">
          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Information We Collect</h2>
            <p className="mt-2">
              We may collect the product name or description you enter, optional uploaded
              reference files, and contact details shared through WhatsApp or direct
              communication. We do not ask for sensitive personal data on the homepage.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">How We Use Information</h2>
            <p className="mt-2">
              We use submitted information to review your product idea, discuss
              manufacturing feasibility, coordinate project communication, and improve
              TYORA&apos;s business services.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Data Storage</h2>
            <p className="mt-2">
              TYORA does not intentionally store sensitive data. Project information is
              handled for business inquiry purposes and kept only as long as reasonably
              needed for communication, support, and operational records.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Sharing</h2>
            <p className="mt-2">
              We do not sell personal information. When needed, project details may be
              shared with manufacturing or service partners only to evaluate or support a
              requested project.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm shadow-[#101216]/4">
            <h2 className="text-lg font-semibold text-[#101216]">Contact</h2>
            <p className="mt-2">
              For privacy questions, contact TYORA through the email or WhatsApp details
              listed on the website.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
