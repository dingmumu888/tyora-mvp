import type { Metadata } from "next";
import CommunityProfileGate from "@/components/community-profile-gate";
import MobileBottomTabs from "@/components/mobile-bottom-tabs";
import AnalyticsPageTracker from "@/components/analytics-page-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "TYORA | Find the right factory in China",
  description:
    "Factory sourcing and manufacturing support for US founders before manufacturing mistakes get expensive.",
  keywords: [
    "product development",
    "manufacturing China",
    "prototype manufacturing",
    "Kickstarter products",
    "Amazon seller product creation"
  ],
  openGraph: {
    title: "TYORA",
    description: "Find the right factory in China — before manufacturing mistakes get expensive.",
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
