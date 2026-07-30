import NewIdeaClient from "./new-idea-client";
import { getContent } from "@/lib/server/data-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Start a Discussion | Ask TYORA Community",
  robots: {
    index: false,
    follow: false
  }
};

export default async function NewIdeaPage() {
  const content = await getContent();

  return (
    <NewIdeaClient
      brand={{
        brandName: content.brandName,
        logoImage: content.logoImage,
        showBrandNameWithLogo: content.showBrandNameWithLogo
      }}
    />
  );
}
