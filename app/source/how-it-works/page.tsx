import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Factory, ShieldCheck } from "lucide-react";
import CommunityUserMenu from "@/components/community-user-menu";

export const metadata: Metadata = {
  title: "How TYORA Source Works | TYORA",
  description: "Full TYORA Source process for supplier introduction and managed sourcing."
};

const supplierSteps = [
  {
    title: "Submit product request",
    text: "Upload product photo, category, quantity, and contact information."
  },
  {
    title: "Free product match & quote",
    text: "TYORA checks matching China supplier options and estimated factory pricing for free."
  },
  {
    title: "Product confirmation",
    text: "We send product photos, key specs, estimated price, MOQ, and availability for your confirmation."
  },
  {
    title: "Service fee confirmation",
    text: "If you want supplier contact, TYORA confirms the Supplier Introduction fee before releasing any contact details. Fee: 3%-5% of estimated order value, minimum $199."
  },
  {
    title: "Supplier contact release",
    text: "After payment, TYORA provides the verified supplier contact and basic sourcing notes."
  },
  {
    title: "You deal directly with the supplier",
    text: "You communicate, negotiate, order, and pay the supplier directly."
  },
  {
    title: "Replacement support",
    text: "If the supplier becomes unavailable or the contact is invalid shortly after release, TYORA will help find one replacement supplier for free."
  }
];

const managedSteps = [
  {
    title: "Submit product request",
    text: "Upload product photo, category, quantity, and contact information."
  },
  {
    title: "Free product match & quote",
    text: "TYORA checks supplier options, estimated factory pricing, MOQ, and feasibility for free."
  },
  {
    title: "Transparent sourcing plan",
    text: "Before payment, TYORA confirms product specs, supplier option, estimated factory price, MOQ, lead time, sample plan, inspection plan, shipping option, and TYORA service fee."
  },
  {
    title: "No hidden markup commitment",
    text: "TYORA does not mark up product costs. You pay the factory price plus a transparent service fee. Upon request, we can provide supplier quote screenshots, order payment screenshots, or relevant order communication records so you can verify factory pricing. Sensitive supplier or unrelated information may be hidden when needed."
  },
  {
    title: "Order starts only after your approval",
    text: "TYORA places the order only after you approve the product photos/video, specifications, price, reference sample plan, and payment plan."
  },
  {
    title: "Payment structure",
    text: "Standard payment: 30% product deposit, 100% TYORA service fee, and reference sample, inspection, or shipping costs if applicable. The remaining product balance is paid before shipment or as required by the supplier."
  },
  {
    title: "Reference sample confirmation",
    text: "For every Managed Sourcing order, TYORA purchases a reference sample before production, even if the sample is not shipped overseas. Sample cost and sample shipping are paid by the buyer at actual cost, with no markup from TYORA. The reference sample is linked to your order/customer ID and kept by TYORA for future inspection and reorders for as long as reasonably practical. Production starts only after you approve the sample photos/video or written specifications."
  },
  {
    title: "Production follow-up",
    text: "TYORA follows production progress and keeps you updated on key milestones, timing, packaging, and required details."
  },
  {
    title: "Pre-shipment inspection",
    text: "Before shipment, TYORA checks the goods by photos/video against the approved sample or confirmed specifications. We do not ship until you confirm the inspection result."
  },
  {
    title: "Issue handling before shipment",
    text: "If goods clearly do not match the approved sample or specifications before shipment, TYORA coordinates correction, remake, replacement, or refund negotiation with the supplier before goods are shipped."
  },
  {
    title: "Shipping coordination",
    text: "After your confirmation, TYORA ships the goods to your freight forwarder or helps coordinate shipping. Customs duties, import taxes, destination fees, and carrier delays are buyer responsibility unless separately agreed."
  }
];

export default function SourceHowItWorksPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_42%,#f7f5f0_100%)] text-[#101216]">
      <header className="sticky top-0 z-40 border-b border-[#e4e8ef]/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/source" className="inline-flex items-center gap-2 text-sm font-semibold text-[#59616e] hover:text-[#101216]">
            <ArrowLeft size={16} /> Back to Source
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold">TYORA</Link>
            <div className="hidden md:block">
              <CommunityUserMenu loginClassName="inline-flex h-10 items-center rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#101216] shadow-sm transition hover:bg-[#f6f7fb]" />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="text-sm font-semibold uppercase tracking-normal text-[#315fbd]">TYORA Source</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
          How TYORA Source Works
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#59616e]">
          A transparent sourcing process for buyers who want China factory pricing without hidden product markup.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#supplier-introduction" className="rounded-full bg-[#101216] px-4 py-2 text-sm font-semibold text-white">
            Supplier Introduction
          </a>
          <a href="#managed-sourcing" className="rounded-full border border-[#dfe6ef] bg-white px-4 py-2 text-sm font-semibold text-[#101216]">
            Managed Sourcing
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-14 sm:px-6 lg:px-8">
        <ProcessSection
          id="supplier-introduction"
          icon={<Factory size={20} />}
          label="Supplier Introduction"
          title="For buyers who want to work directly with the factory."
          summary="TYORA finds and confirms a supplier. After payment, you receive the verified contact and continue directly with the supplier."
          steps={supplierSteps}
          note="Once supplier contact is released, the introduction fee is non-refundable. TYORA does not guarantee final deal success, supplier behavior, price changes, or future stock after direct introduction."
        />

        <ProcessSection
          id="managed-sourcing"
          icon={<ShieldCheck size={20} />}
          label="Managed Sourcing"
          title="For buyers who want TYORA to manage negotiation, samples, inspection, and shipping coordination."
          summary="TYORA gives you factory-price transparency, purchases a reference sample at actual cost, follows production, checks goods before shipment, and coordinates shipping after your confirmation."
          steps={managedSteps}
          note="TYORA does not mark up product costs. Service fees and third-party costs may be non-refundable once work has started or payments have been made to suppliers, inspectors, or logistics providers."
        />
      </section>
    </main>
  );
}

function ProcessSection({
  id,
  icon,
  label,
  title,
  summary,
  steps,
  note
}: {
  id: string;
  icon: ReactNode;
  label: string;
  title: string;
  summary: string;
  steps: Array<{ title: string; text: string }>;
  note: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[28px] border border-[#dfe6ef] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f2f7ff] text-[#315fbd]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-[#315fbd]">{label}</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#59616e]">{summary}</p>
        </div>
      </div>

      <ol className="mt-6 grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-3xl border border-[#e7edf5] bg-[#fbfcfe] p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#101216] text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#101216]">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#69707d]">{step.text}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-3xl border border-[#cfe7df] bg-[#f2fbf7] p-4 text-sm leading-6 text-[#315f56]">
        <span className="font-semibold text-[#0f766e]">Important note: </span>
        {note}
      </p>

      <div className="mt-5">
        <Link href="/source#source-form" className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]">
          Start with a free product match <CheckCircle2 size={16} />
        </Link>
      </div>
    </section>
  );
}
