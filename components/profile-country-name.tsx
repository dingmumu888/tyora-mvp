"use client";

import { usePublicLanguage } from "@/components/public-language-provider";
import { countryCallingCodes } from "@/lib/country-calling-codes";
import { inferProfileCountryCode } from "@/lib/profile-options";

export default function ProfileCountryName({
  countryCode,
  country
}: {
  countryCode?: string;
  country?: string;
}) {
  const { language } = usePublicLanguage();
  const code = inferProfileCountryCode(countryCode, country);
  if (!code) return <>{country || ""}</>;
  const displayNames = new Intl.DisplayNames([language], { type: "region" });
  const flag = countryCallingCodes.find((option) => option.iso === code)?.flag || "";
  return <>{flag ? `${flag} ` : ""}{displayNames.of(code) || country || code}</>;
}
