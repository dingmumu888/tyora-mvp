import type { Metadata } from "next";
import LegalPageShell, { LegalSection } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service | TYORA",
  description: "General terms for TYORA community, sourcing, and product-development services.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      description="These general terms apply when you use TYORA's website, community, sourcing, or product-development services. A written project proposal may add or replace terms for a specific paid engagement."
      updatedAt="August 1, 2026"
    >
      <LegalSection title="Service relationship">
        <p>
          TYORA provides product assessment, supplier sourcing, factory coordination, sampling support, production follow-up, quality support, and related consulting services. TYORA is not the manufacturer, freight carrier, customs broker, marketplace, insurer, or legal adviser unless a written agreement expressly states otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Initial assessments and quotations">
        <p>
          An initial assessment reflects the information available at the time and is not a final production quote or guarantee. Feasibility, MOQ, tooling, samples, timing, and cost may change after specifications, materials, compliance requirements, or supplier feedback are confirmed.
        </p>
        <p>
          A paid project begins only after scope, service fee, expected third-party costs, and payment terms are agreed in writing.
        </p>
      </LegalSection>

      <LegalSection title="Factory costs and payments">
        <p>
          No hidden product markup. You see the factory quotation and pay a clearly agreed TYORA service fee. Customers may pay an approved factory or service provider directly when that payment path is agreed. TYORA does not advance customer funds or finance factory orders.
        </p>
        <p>
          Tooling, samples, inspection, storage, shipping, taxes, duties, certification, and other third-party costs remain the customer&apos;s responsibility unless the written proposal says otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Factories and other third parties">
        <p>
          TYORA evaluates and coordinates third-party providers but does not control every action they take. Supplier availability, raw-material pricing, lead times, test results, transport, and government requirements can change. Replacement or corrective support depends on the written scope and the circumstances of the project.
        </p>
      </LegalSection>

      <LegalSection title="Customer responsibilities">
        <p>
          You are responsible for providing accurate specifications, lawful content, timely approvals, and sufficient funds. You are also responsible for product safety, intellectual-property clearance, labeling, certification, import compliance, taxes, duties, insurance, and market suitability unless a written agreement assigns a specific task to TYORA.
        </p>
      </LegalSection>

      <LegalSection title="Community and submitted content">
        <p>
          You retain ownership of content you submit. For public posts, you grant TYORA a non-exclusive license to host, display, format, translate, moderate, and share that content only as reasonably needed to operate, protect, and promote the service. You must have the right to submit the text, images, and designs and must not post confidential, unlawful, infringing, or abusive material.
        </p>
        <p>
          A public post is visible to everyone and is not a confidential disclosure to TYORA. It may be searched, shared, reposted, discussed, or imitated by third parties, and public disclosure may affect patent or trade-secret protection. TYORA does not guarantee that public content will remain exclusive or cannot be copied. If an idea is not protected or contains confidential drawings, structures, specifications, suppliers, or costs, use a private submission or do not publish it yet.
        </p>
        <p>
          Private submissions are handled as private business inquiries and may be shared only as reasonably needed to assess or perform the requested service. Suspected infringement or misuse may be reported through the post-reporting tools or TYORA contact channels. TYORA may moderate reported content and provide an appeal or correction path where appropriate.
        </p>
      </LegalSection>

      <LegalSection title="Cancellations, refunds, and changes">
        <p>
          Cancellation and refund eligibility depend on the written service scope, work already completed, supplier information already released, and non-refundable costs already paid to third parties. Any approved refund excludes costs that cannot be recovered.
        </p>
        <p>
          TYORA may update these terms for future use of the service. Material changes will be reflected by the date shown on this page.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
