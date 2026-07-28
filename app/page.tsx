import type { Metadata } from "next";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" }
};

export default function Home() {
  return <HomeClient />;
}
