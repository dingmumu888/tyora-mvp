import type { Metadata } from "next";
import CommunityProfileGate from "@/components/community-profile-gate";
import MobileBottomTabs from "@/components/mobile-bottom-tabs";
import AnalyticsPageTracker from "@/components/analytics-page-tracker";
import PublicLanguageProvider from "@/components/public-language-provider";
import CommunitySessionSync from "@/components/community-session-sync";
import "@fontsource-variable/reddit-sans/wght.css";
import "@fontsource-variable/noto-sans-sc/wght.css";
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
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" data-theme="light" className="notranslate tyora-light">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body>
        <PublicLanguageProvider>
          <CommunitySessionSync />
          <AnalyticsPageTracker />
          {children}
          <CommunityProfileGate />
          <MobileBottomTabs />
        </PublicLanguageProvider>
      </body>
    </html>
  );
}
