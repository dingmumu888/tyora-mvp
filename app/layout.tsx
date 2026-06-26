import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TYORA | Turn Your Product Idea Into Reality",
  description:
    "A modern product development partner helping entrepreneurs turn ideas into manufacturable products through trusted manufacturing partners in China.",
  keywords: [
    "product development",
    "manufacturing China",
    "prototype manufacturing",
    "Kickstarter products",
    "Amazon seller product creation"
  ],
  openGraph: {
    title: "TYORA",
    description: "Turn Your Product Idea Into Reality.",
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
      <body>{children}</body>
    </html>
  );
}
