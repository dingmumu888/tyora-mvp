import type { Metadata } from "next";
import CommunityProfileGate from "@/components/community-profile-gate";
import MobileBottomTabs from "@/components/mobile-bottom-tabs";
import AnalyticsPageTracker from "@/components/analytics-page-tracker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tyora.io"),
  title: "TYORA | Product Development & Manufacturing in China",
  description:
    "TYORA helps small brands develop, source, and manufacture consumer products in China with transparent factory pricing and flexible project support.",
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
      "TYORA helps small brands develop, source, and manufacture consumer products in China with transparent factory pricing and flexible project support.",
    type: "website",
    url: "/"
  },
  alternates: {
    canonical: "/"
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
