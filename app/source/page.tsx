import SourceClient from "./source-client";

export const metadata = {
  title: "Source This Product | TYORA",
  description: "Upload a product reference for an initial China supplier and factory-pricing assessment.",
  alternates: { canonical: "/source" }
};

export default function SourcePage() {
  return <SourceClient />;
}
