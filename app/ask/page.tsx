import AskClient from "./ask-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Ask TYORA | Free Manufacturing Review",
  description: "Upload your product idea and get a free manufacturing review within 8 working hours."
};

export default function AskPage() {
  return <AskClient />;
}
