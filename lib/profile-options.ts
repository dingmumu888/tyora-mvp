import { countryCallingCodes } from "@/lib/country-calling-codes";

export const profileIndustries = [
  { value: "ecommerce", labelKey: "industryEcommerce" },
  { value: "product-design", labelKey: "industryProductDesign" },
  { value: "physical-retail", labelKey: "industryPhysicalRetail" },
  { value: "brand-owner", labelKey: "industryBrandOwner" },
  { value: "startup", labelKey: "industryStartup" },
  { value: "content-creator", labelKey: "industryContentCreator" },
  { value: "engineering", labelKey: "industryEngineering" },
  { value: "sourcing", labelKey: "industrySourcing" },
  { value: "manufacturing", labelKey: "industryManufacturing" },
  { value: "other", labelKey: "industryOther" }
] as const;

export type ProfileIndustry = (typeof profileIndustries)[number]["value"];

export function isProfileIndustry(value: string): value is ProfileIndustry {
  return profileIndustries.some((option) => option.value === value);
}

export function profileCountryFromCode(value: string) {
  const code = value.trim().toUpperCase();
  return countryCallingCodes.find((country) => country.iso === code) || null;
}

export function inferProfileCountryCode(countryCode?: string, countryName?: string) {
  const direct = profileCountryFromCode(countryCode || "");
  if (direct) return direct.iso;
  const normalizedName = countryName?.trim().toLowerCase();
  if (!normalizedName) return "";
  return countryCallingCodes.find((country) =>
    [country.name, ...(country.aliases || [])]
      .some((name) => name.toLowerCase() === normalizedName)
  )?.iso || "";
}
