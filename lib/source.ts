export const sourceNeedTypes = [
  "Find supplier",
  "Get better price",
  "Request sample",
  "Managed sourcing"
] as const;

export const sourceStatuses = [
  "New",
  "Checking Supplier",
  "Quoted",
  "Sample Requested",
  "Factory Introduced",
  "Managed Sourcing",
  "Completed"
] as const;

export type SourceNeedType = (typeof sourceNeedTypes)[number];
export type SourceStatus = (typeof sourceStatuses)[number];

export type SourceRequest = {
  id: string;
  productName: string;
  description: string;
  productLink?: string;
  material?: string;
  quantity: string;
  targetPrice?: string;
  destinationCountry: string;
  email?: string;
  whatsapp?: string;
  needTypes: SourceNeedType[];
  imageUrl?: string;
  imageUrls?: string[];
  status: SourceStatus;
  internalNotes?: string;
  publicShowcaseConsent: boolean;
  publicShowcasePublished: boolean;
  publicShowcaseTitle?: string;
  publicShowcaseSummary?: string;
  publicShowcaseCountry?: string;
  publicShowcaseQuantity?: string;
  publicShowcaseImageIndex?: number;
  publicSupplierCount?: number;
  publicQuoteCount?: number;
  publicShowcasePublishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicSourceActivity = {
  id: string;
  title: string;
  summary: string;
  countryLabel?: string;
  quantityLabel?: string;
  needTypes: SourceNeedType[];
  status: SourceStatus;
  imageUrl?: string;
  supplierCount?: number;
  quoteCount?: number;
  updatedAt: string;
  isDemo: boolean;
};

export function normalizeSourceStatus(value: unknown): SourceStatus {
  return sourceStatuses.includes(value as SourceStatus) ? (value as SourceStatus) : "New";
}

export function normalizeSourceNeedTypes(value: unknown): SourceNeedType[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is SourceNeedType => sourceNeedTypes.includes(item as SourceNeedType))
    .slice(0, sourceNeedTypes.length);
}
