import type { Metadata } from "next";
import LegalPageShell, { LegalSection } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Service Scope | TYORA",
  description: "The general boundaries of TYORA's idea review, sourcing, and managed production support."
};

export default function ServiceScopePage() {
  return (
    <LegalPageShell
      eyebrow="Service information"
      title="Service Scope"
      description="This page explains TYORA's standard service boundaries. The written proposal for a paid project controls the final deliverables, fees, timing, and responsibilities."
      updatedAt="July 15, 2026"
    >
      <LegalSection title="Public product ideas">
        <p>
          Public idea posts allow founders to request an initial manufacturing assessment and discuss a concept with the community. TYORA may comment on apparent feasibility, MOQ, tooling, sample path, major risks, and an estimated budget range based on the information available.
        </p>
      </LegalSection>

      <LegalSection title="Private custom review">
        <p>
          Customers who do not want to publish a concept can share it privately. An initial review helps define the product and next steps; detailed design development, supplier engagement, sampling, tooling, and production work require a separately agreed scope.
        </p>
      </LegalSection>

      <LegalSection title="Source an existing product">
        <p>
          TYORA can compare a submitted reference with available supplier options and estimated factory pricing. A match depends on specifications, quantity, supplier availability, compliance requirements, and confirmation of an acceptable sample or product reference.
        </p>
      </LegalSection>

      <LegalSection title="Pricing transparency">
        <p className="font-semibold text-[var(--color-text)]">No hidden product markup.</p>
        <p>You see the factory quotation and pay a clearly agreed TYORA service fee.</p>
        <p>
          TYORA negotiates competitive factory pricing based on the confirmed product requirements, quantity, and available supplier options.
        </p>
        <p>
          Supporting factory quotations and payment records may be provided when applicable, with sensitive information redacted where necessary.
        </p>
      </LegalSection>

      <LegalSection title="Samples, production, and quality support">
        <p>
          Samples, tooling, tests, and shipping are charged according to approved third-party costs. For managed work, TYORA may coordinate supplier communication, compare an approved reference sample, follow production status, and arrange agreed inspections. Inspection reduces risk but cannot guarantee that every unit will be defect-free.
        </p>
      </LegalSection>

      <LegalSection title="Logistics boundary">
        <p>
          Unless a written proposal says otherwise, TYORA coordinates handoff to the customer&apos;s nominated freight forwarder in China. International freight, customs clearance, import duties, local delivery, insurance, and destination-country compliance remain outside the standard scope.
        </p>
      </LegalSection>

      <LegalSection title="What is not included by default">
        <p>
          Legal advice, patent or trademark clearance, laboratory certification, product liability insurance, financing, marketplace approval, sales performance, and guaranteed delivery dates are not included unless expressly listed in a written proposal.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
