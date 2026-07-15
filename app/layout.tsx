import type { Metadata } from "next";
import CommunityProfileGate from "@/components/community-profile-gate";
import MobileBottomTabs from "@/components/mobile-bottom-tabs";
import AnalyticsPageTracker from "@/components/analytics-page-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "TYORA | Product Development & Manufacturing in China",
  description:
    "Product development, factory sourcing, and small-batch manufacturing support in China for overseas small brands and sellers.",
  keywords: [
    "product development",
    "manufacturing China",
    "prototype manufacturing",
    "Kickstarter products",
    "Amazon seller product creation"
  ],
  openGraph: {
    title: "TYORA | Product Development & Manufacturing in China",
    description:
      "Product development, factory sourcing, and small-batch manufacturing support in China for overseas small brands and sellers.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AnalyticsPageTracker />
        {children}
        <CommunityProfileGate />
        <MobileBottomTabs />
      </body>
    </html>
  );
}
