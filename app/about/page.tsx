import type { Metadata } from "next";
import HomeClient from "../home-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  openGraph: { url: "/about" }
};

export default function AboutPage() {
  return <HomeClient />;
}
