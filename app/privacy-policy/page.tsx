import type { Metadata } from "next";
import LegalPageShell, { LegalSection } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | TYORA",
  description: "How TYORA handles website, community, sourcing, and product-development information."
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="This policy explains what information TYORA receives, why it is used, and the choices available when you use our community, sourcing, or product-development services."
      updatedAt="July 15, 2026"
    >
      <LegalSection title="Information we receive">
        <p>
          We may receive account and contact details, including your name, email address, WhatsApp number, country, and profile information. We also receive product descriptions, quantities, budgets, links, images, designs, documents, quotations, and other files you choose to submit.
        </p>
        <p>
          Community activity such as posts, comments, likes, and expressions of interest is also recorded. Basic technical and usage data may be collected to secure the service, understand performance, and improve the website.
        </p>
      </LegalSection>

      <LegalSection title="Public and private submissions">
        <p>
          Content submitted as a public idea may be displayed on TYORA, indexed by search engines, and shared by other visitors. Do not include confidential information in a public post.
        </p>
        <p>
          Private sourcing and custom-product submissions are not intentionally published. Access is limited to authorized TYORA personnel and service providers who need the information to review or support the request.
        </p>
      </LegalSection>

      <LegalSection title="How information is used">
        <p>
          Information is used to operate accounts and community features, respond to inquiries, assess product requirements, identify supplier options, coordinate samples or production work, provide customer support, prevent abuse, and maintain business records.
        </p>
      </LegalSection>

      <LegalSection title="When information is shared">
        <p>
          We do not sell personal information. Relevant project details may be shared with factories, inspectors, logistics providers, hosting providers, email providers, and other service partners when reasonably necessary for the service you requested. We aim to limit each disclosure to the information needed for that purpose.
        </p>
        <p>
          Information may also be disclosed when required by law, to protect rights or safety, or as part of a business reorganization subject to appropriate safeguards.
        </p>
      </LegalSection>

      <LegalSection title="Storage, retention, and international processing">
        <p>
          TYORA uses third-party infrastructure to store and process information. Because TYORA supports international customers and works with suppliers in China, information may be processed in countries other than your own.
        </p>
        <p>
          Records are retained for as long as reasonably needed to provide the service, support repeat orders, resolve disputes, meet legal or accounting obligations, and protect the service. Retention periods vary by record type and project status.
        </p>
      </LegalSection>

      <LegalSection title="Security and your choices">
        <p>
          We use access controls and technical safeguards appropriate to the information handled, but no online system can guarantee absolute security. You may ask to access, correct, or delete eligible personal information, subject to legal and operational retention requirements.
        </p>
        <p>
          The service is intended for business users and is not directed to children. Please contact us if you believe a child has submitted personal information.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
