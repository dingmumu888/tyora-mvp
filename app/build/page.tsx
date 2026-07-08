import type { Metadata } from "next";
import BuildClient from "./build-client";

export const metadata: Metadata = {
  title: "Build with TYORA | Manufacturing support",
  description: "Move from product discussion to factory matching, samples, production support, quality checks and shipping with TYORA."
};

export default function BuildPage() {
  return <BuildClient />;
}
