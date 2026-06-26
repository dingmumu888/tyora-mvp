export type EditableCard = {
  title: string;
  description: string;
};

export type VideoSettings = {
  title: string;
  subtitle: string;
  sourceType: "upload" | "youtube" | "vimeo";
  videoUrl: string;
  uploadedVideoFile: string;
  coverImage: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
};

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  note?: string;
  features: string[];
  ctaText: string;
  visible: boolean;
  order: number;
};

export type CaseStudyStatus =
  | "Concept"
  | "Prototype Approved"
  | "In Production"
  | "Delivered";

export type CaseStudy = {
  id: string;
  name: string;
  slug: string;
  status: CaseStudyStatus;
  country: string;
  category: string;
  shortDescription: string;
  concept: string;
  prototype: string;
  final: string;
  conceptImage: string;
  prototypeImage: string;
  finalImage: string;
  visible: boolean;
  order: number;
};

export type SiteContent = {
  brandName: string;
  logoImage: string;
  favicon: string;
  whatsappLink: string;
  callLink: string;
  linkedInLink: string;
  email: string;
  heroTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPlaceholders: string[];
  ctaText: string;
  tagline: string;
  footerSlogan: string;
  videoUrl: string;
  video: VideoSettings;
  founderName: string;
  founderTitle: string;
  founderText: string;
  founderPhoto: string;
  pricingTitle: string;
  pricingSubtitle: string;
  pricingProofA: string;
  pricingProofB: string;
  trustBadges: string[];
  positioningHeadlineA: string;
  positioningHeadlineB: string;
  positioningText: string;
  journeySteps: EditableCard[];
  helpCards: EditableCard[];
  pricing: PricingPlan[];
  cases: CaseStudy[];
};

export type MediaType = "image" | "video" | "pdf";

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Quoting"
  | "Sample Stage"
  | "Production"
  | "Shipment"
  | "Completed"
  | "Lost";

export type LeadPriority = "Low" | "Medium" | "High" | "Urgent";
export type TeamRole = "Admin" | "Project Manager" | "Viewer";

export type InternalNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type StatusHistoryItem = {
  id: string;
  label: string;
  actor: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: TeamRole;
  active: boolean;
};

export type Lead = {
  id: string;
  customerName?: string;
  company?: string;
  email?: string;
  country?: string;
  category?: string;
  productIdea: string;
  designType: string;
  quantity: string;
  budget: string;
  timeline: string;
  sampleRequirement: string;
  sampleReview?: string;
  additionalRequirements: string;
  uploadedFile?: string;
  uploadedFiles?: string[];
  submissionDate: string;
  status: LeadStatus;
  ownerId?: string;
  priority?: LeadPriority;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  internalNoteEntries?: InternalNote[];
  statusHistory?: StatusHistoryItem[];
  internalNotes?: string;
};

export const contentKey = "idea2product-content";
export const leadsKey = "idea2product-leads";
export const mediaKey = "idea2product-media";
export const teamMembersKey = "idea2product-team-members";
export const adminSessionKey = "idea2product-admin-session";

export const defaultTeamMembers: TeamMember[] = [
  { id: "adam", name: "Adam", avatar: "A", email: "adam@tyora.co", role: "Admin", active: true },
  { id: "jack", name: "Jack", avatar: "J", email: "jack@tyora.co", role: "Project Manager", active: true },
  { id: "lucy", name: "Lucy", avatar: "L", email: "lucy@tyora.co", role: "Project Manager", active: true },
  { id: "kevin", name: "Kevin", avatar: "K", email: "kevin@tyora.co", role: "Project Manager", active: true }
];

export const defaultContent: SiteContent = {
  brandName: "TYORA",
  logoImage: "",
  favicon: "",
  whatsappLink: "https://wa.me/15550000000",
  callLink: "https://cal.com/idea2product/intro",
  linkedInLink: "https://www.linkedin.com/",
  email: "hello@idea2product.co",
  heroTagline: "Product Development Partner for makers, sellers, and launch teams",
  heroTitle: "Turn Your Product Idea Into Reality.",
  heroSubtitle:
    "Upload your idea. We'll help you turn it into a manufacturable product through trusted manufacturing partners in China.",
  heroPlaceholders: [
    "Describe the product you want to create..."
  ],
  ctaText: "Start Your Project",
  tagline: "Turn Your Product Idea Into Reality.",
  footerSlogan: "We don't just manufacture products. We help bring ideas to life.",
  videoUrl: "",
  video: {
    title: "See How Your Idea Becomes A Product",
    subtitle: "Watch how TYORA helps transform ideas into manufacturable products.",
    sourceType: "upload",
    videoUrl: "",
    uploadedVideoFile: "",
    coverImage: "",
    autoplay: false,
    muted: true,
    loop: false
  },
  founderName: "Adam",
  founderTitle: "Meet Your Product Partner",
  founderPhoto: "",
  founderText:
    "I help entrepreneurs transform product ideas into manufacturable products through trusted manufacturing partners in China. Every project is personally reviewed.",
  pricingTitle: "Product Development Support",
  pricingSubtitle: "Simple, transparent, and project-based pricing.",
  pricingProofA: "No hidden factory markups.",
  pricingProofB: "You always know the real factory price.",
  trustBadges: [
    "Product Development",
    "Manufacturing Partner Matching",
    "Prototype Management",
    "Quality Inspection",
    "Production Follow-up",
    "Shipping Support"
  ],
  positioningHeadlineA: "We Don't Help You Find Factories.",
  positioningHeadlineB: "We Help You Build Products.",
  positioningText:
    "From product validation to manufacturing, quality control, and delivery, TYORA supports your entire product journey.",
  journeySteps: [
    {
      title: "Idea",
      description: "Submit your product concept, AI image, sketch, reference product, or CAD file."
    },
    {
      title: "Development",
      description: "We review manufacturability, materials, production method, MOQ, and project risks."
    },
    {
      title: "Manufacturing Partner",
      description: "We match your project with suitable manufacturing partners in China."
    },
    {
      title: "Production Management",
      description: "We help coordinate sampling, production, communication, and inspection."
    },
    {
      title: "Delivery",
      description: "We assist with packaging, logistics coordination, and global delivery."
    }
  ],
  helpCards: [
    { title: "Idea Validation", description: "Avoid expensive mistakes before production." },
    { title: "Manufacturing Partner Matching", description: "Connect with suitable manufacturing partners." },
    { title: "Production Management", description: "We coordinate communication, samples, and production." },
    { title: "Quality Assurance", description: "Reduce manufacturing risks before shipment." }
  ],
  pricing: [
    {
      id: "assessment",
      name: "Free Manufacturing Assessment",
      price: "Free",
      ctaText: "Start Assessment",
      visible: true,
      order: 1,
      features: [
        "Product feasibility review",
        "MOQ guidance",
        "Estimated production cost range",
        "Initial development suggestions"
      ]
    },
    {
      id: "development",
      name: "Project Development Package",
      price: "$149 Project Deposit",
      note: "Deposit is credited toward future service fees if production proceeds.",
      ctaText: "Start Project",
      visible: true,
      order: 2,
      features: [
        "Partner research",
        "Quotation collection",
        "Partner comparison",
        "Manufacturing recommendations"
      ]
    },
    {
      id: "production",
      name: "Production Management",
      price: "5% Service Fee",
      note: "Minimum $100. No hidden factory markups. You always know the real factory price.",
      ctaText: "Discuss Production",
      visible: true,
      order: 3,
      features: [
        "Manufacturing partner communication",
        "Sample coordination",
        "Quality inspection support",
        "Production follow-up",
        "Shipping coordination"
      ]
    }
  ],
  cases: [
    {
      id: "magnetic-phone-stand",
      name: "Magnetic Phone Stand",
      slug: "magnetic-phone-stand",
      status: "Delivered",
      country: "United States",
      category: "Consumer Electronics",
      shortDescription: "A foldable magnetic phone stand developed from concept to shipment.",
      concept: "Concept",
      prototype: "Prototype",
      final: "Final Product",
      conceptImage: "",
      prototypeImage: "",
      finalImage: "",
      visible: true,
      order: 1
    },
    {
      id: "capybara-night-light",
      name: "Capybara Night Light",
      slug: "capybara-night-light",
      status: "In Production",
      country: "United States",
      category: "Home & Lifestyle",
      shortDescription: "A playful night light prepared for small-batch production.",
      concept: "Concept",
      prototype: "Prototype",
      final: "Final Product",
      conceptImage: "",
      prototypeImage: "",
      finalImage: "",
      visible: true,
      order: 2
    },
    {
      id: "pet-grooming-tool",
      name: "Pet Grooming Tool",
      slug: "pet-grooming-tool",
      status: "Prototype Approved",
      country: "United States",
      category: "Pet Products",
      shortDescription: "A pet care product refined through prototype review.",
      concept: "Concept",
      prototype: "Prototype",
      final: "Final Product",
      conceptImage: "",
      prototypeImage: "",
      finalImage: "",
      visible: true,
      order: 3
    }
  ]
};

const legacyContent = {
  heroTitle: "What Product Do You Want To Create Today?",
  ctaText: "Continue",
  heroSubtitle:
    "Upload your design or describe your idea. We help turn it into a real product through trusted manufacturing partners in China.",
  heroSubtitleV2:
    "We help entrepreneurs turn ideas into manufacturable products through trusted manufacturing partners in China.",
  founderText:
    "I help entrepreneurs and product creators turn ideas into real products by connecting them with trusted manufacturing partners in China. I personally assist with supplier sourcing, sample verification, production coordination, and logistics support."
};
const legacyHeroPlaceholders = [
  "I want to create a magnetic phone stand...",
  "I designed a capybara night light...",
  "I want to launch a Kickstarter product...",
  "I need a custom pet accessory..."
];
const legacyHeroPlaceholdersV2 = [
  "Describe your product idea...\n\nExample:\n\"I want to design a magnetic phone stand for iPhone.\""
];
const legacyTrustBadges = [
  "Product Development Partner",
  "Transparent Factory Pricing",
  "Dedicated Project Manager",
  "Worldwide Delivery Support"
];

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeCards(value: unknown, fallback: EditableCard[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.map((entry, index) => {
    const item = entry as Partial<EditableCard>;
    const fb = fallback[index] || { title: "", description: "" };
    return {
      title: stringValue(item.title, fb.title),
      description: stringValue(item.description, fb.description)
    };
  });
}

function normalizeVideo(value: unknown): VideoSettings {
  const item = value && typeof value === "object" ? (value as Partial<VideoSettings>) : {};
  const sourceType = ["upload", "youtube", "vimeo"].includes(item.sourceType || "")
    ? item.sourceType
    : defaultContent.video.sourceType;
  return {
    title: stringValue(item.title, defaultContent.video.title),
    subtitle: stringValue(item.subtitle, defaultContent.video.subtitle),
    sourceType: sourceType as VideoSettings["sourceType"],
    videoUrl: stringValue(item.videoUrl, defaultContent.video.videoUrl),
    uploadedVideoFile: stringValue(item.uploadedVideoFile, defaultContent.video.uploadedVideoFile),
    coverImage: stringValue(item.coverImage, defaultContent.video.coverImage),
    autoplay: typeof item.autoplay === "boolean" ? item.autoplay : defaultContent.video.autoplay,
    muted: typeof item.muted === "boolean" ? item.muted : defaultContent.video.muted,
    loop: typeof item.loop === "boolean" ? item.loop : defaultContent.video.loop
  };
}

function normalizePricing(value: unknown): PricingPlan[] {
  const source = Array.isArray(value) ? value : defaultContent.pricing;
  return source
    .map((entry, index) => {
      const item = entry as Partial<PricingPlan>;
      const fb = defaultContent.pricing[index] || defaultContent.pricing[0];
      return {
        id: stringValue(item.id, fb.id || cryptoSafeId("plan")),
        name: stringValue(item.name, fb.name),
        price: stringValue(item.price, fb.price),
        note: stringValue(item.note, fb.note || ""),
        features: Array.isArray(item.features)
          ? item.features.map((feature) => String(feature)).filter(Boolean)
          : fb.features,
        ctaText: stringValue(item.ctaText, fb.ctaText || "Get Started"),
        visible: typeof item.visible === "boolean" ? item.visible : fb.visible ?? true,
        order: typeof item.order === "number" ? item.order : fb.order ?? index + 1
      };
    })
    .sort((a, b) => a.order - b.order);
}

function normalizeCases(value: unknown): CaseStudy[] {
  const source = Array.isArray(value) ? value : defaultContent.cases;
  return source
    .map((entry, index) => {
      const item = entry as Partial<CaseStudy>;
      const fb = defaultContent.cases[index] || defaultContent.cases[0];
      const name = stringValue(item.name, fb.name);
      const status = ["Concept", "Prototype Approved", "In Production", "Delivered"].includes(item.status || "")
        ? item.status
        : fb.status;
      return {
        id: stringValue(item.id, fb.id || cryptoSafeId("case")),
        name,
        slug: stringValue(item.slug, fb.slug || slugify(name)),
        status: status as CaseStudyStatus,
        country: stringValue(item.country, fb.country),
        category: stringValue(item.category, fb.category),
        shortDescription: stringValue(item.shortDescription, fb.shortDescription),
        concept: stringValue(item.concept, fb.concept),
        prototype: stringValue(item.prototype, fb.prototype),
        final: stringValue(item.final, fb.final),
        conceptImage: stringValue(item.conceptImage, fb.conceptImage),
        prototypeImage: stringValue(item.prototypeImage, fb.prototypeImage),
        finalImage: stringValue(item.finalImage, fb.finalImage),
        visible: typeof item.visible === "boolean" ? item.visible : fb.visible,
        order: typeof item.order === "number" ? item.order : fb.order ?? index + 1
      };
    })
    .sort((a, b) => a.order - b.order);
}

const leadStatusOptions: LeadStatus[] = [
  "New",
  "Contacted",
  "Quoting",
  "Sample Stage",
  "Production",
  "Shipment",
  "Completed",
  "Lost"
];

const leadPriorityOptions: LeadPriority[] = ["Low", "Medium", "High", "Urgent"];
const teamRoleOptions: TeamRole[] = ["Admin", "Project Manager", "Viewer"];

function normalizeLeadStatus(value: unknown): LeadStatus {
  if (value === "Closed") {
    return "Completed";
  }
  return leadStatusOptions.includes(value as LeadStatus) ? (value as LeadStatus) : "New";
}

function normalizePriority(value: unknown): LeadPriority {
  return leadPriorityOptions.includes(value as LeadPriority) ? (value as LeadPriority) : "Medium";
}

function normalizeNotes(value: unknown, legacyNote: unknown, fallbackDate: string): InternalNote[] {
  const notes = Array.isArray(value)
    ? value
        .map((entry) => {
          const item = entry as Partial<InternalNote>;
          return {
            id: stringValue(item.id, cryptoSafeId("note")),
            author: stringValue(item.author, "Adam"),
            body: stringValue(item.body, ""),
            createdAt: stringValue(item.createdAt, fallbackDate)
          };
        })
        .filter((note) => note.body.trim())
    : [];

  if (notes.length === 0 && typeof legacyNote === "string" && legacyNote.trim()) {
    return [
      {
        id: cryptoSafeId("note"),
        author: "Adam",
        body: legacyNote,
        createdAt: fallbackDate
      }
    ];
  }

  return notes;
}

function normalizeHistory(value: unknown, fallbackDate: string): StatusHistoryItem[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        const item = entry as Partial<StatusHistoryItem>;
        return {
          id: stringValue(item.id, cryptoSafeId("history")),
          label: stringValue(item.label, "Project Updated"),
          actor: stringValue(item.actor, "TYORA"),
          createdAt: stringValue(item.createdAt, fallbackDate)
        };
      })
      .filter((item) => item.label.trim());
  }

  return [
    {
      id: cryptoSafeId("history"),
      label: "Project Submitted",
      actor: "Customer",
      createdAt: fallbackDate
    }
  ];
}

export function normalizeLead(value: unknown): Lead {
  const item = value && typeof value === "object" ? (value as Partial<Lead>) : {};
  const submissionDate = stringValue(item.submissionDate, new Date().toISOString());
  return {
    id: stringValue(item.id, cryptoSafeId("lead")),
    customerName: stringValue(item.customerName, ""),
    company: stringValue(item.company, ""),
    email: stringValue(item.email, ""),
    country: stringValue(item.country, ""),
    category: stringValue(item.category, ""),
    productIdea: stringValue(item.productIdea, ""),
    designType: stringValue(item.designType, ""),
    quantity: stringValue(item.quantity, ""),
    budget: stringValue(item.budget, ""),
    timeline: stringValue(item.timeline, ""),
    sampleRequirement: stringValue(item.sampleRequirement, ""),
    sampleReview: stringValue(item.sampleReview, ""),
    additionalRequirements: stringValue(item.additionalRequirements, ""),
    uploadedFile: stringValue(item.uploadedFile, ""),
    uploadedFiles: Array.isArray(item.uploadedFiles) ? item.uploadedFiles.map((entry) => String(entry)).filter(Boolean) : [],
    submissionDate,
    status: normalizeLeadStatus(item.status),
    ownerId: stringValue(item.ownerId, "unassigned"),
    priority: normalizePriority(item.priority),
    lastContactDate: stringValue(item.lastContactDate, ""),
    nextFollowUpDate: stringValue(item.nextFollowUpDate, ""),
    internalNotes: stringValue(item.internalNotes, ""),
    internalNoteEntries: normalizeNotes(item.internalNoteEntries, item.internalNotes, submissionDate),
    statusHistory: normalizeHistory(item.statusHistory, submissionDate)
  };
}

export function normalizeTeamMembers(value: unknown): TeamMember[] {
  const source = Array.isArray(value) ? value : defaultTeamMembers;
  return source.map((entry, index) => {
    const item = entry as Partial<TeamMember>;
    const fallback = defaultTeamMembers[index] || defaultTeamMembers[0];
    const name = stringValue(item.name, fallback.name);
    return {
      id: stringValue(item.id, slugify(name) || cryptoSafeId("member")),
      name,
      avatar: stringValue(item.avatar, name.slice(0, 1).toUpperCase()),
      email: stringValue(item.email, fallback.email),
      role: teamRoleOptions.includes(item.role as TeamRole) ? (item.role as TeamRole) : fallback.role,
      active: typeof item.active === "boolean" ? item.active : fallback.active
    };
  });
}

function cryptoSafeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function normalizeContent(value: unknown): SiteContent {
  const item = value && typeof value === "object" ? (value as Partial<SiteContent>) : {};
  const normalized: SiteContent = {
    brandName: stringValue(item.brandName, defaultContent.brandName),
    logoImage: stringValue(item.logoImage, defaultContent.logoImage),
    favicon: stringValue(item.favicon, defaultContent.favicon),
    whatsappLink: stringValue(item.whatsappLink, defaultContent.whatsappLink),
    callLink: stringValue(item.callLink, defaultContent.callLink),
    linkedInLink: stringValue(item.linkedInLink, defaultContent.linkedInLink),
    email: stringValue(item.email, defaultContent.email),
    heroTagline: stringValue(item.heroTagline, defaultContent.heroTagline),
    heroTitle: stringValue(item.heroTitle, defaultContent.heroTitle),
    heroSubtitle: stringValue(item.heroSubtitle, defaultContent.heroSubtitle),
    heroPlaceholders: Array.isArray(item.heroPlaceholders)
      ? item.heroPlaceholders.map((entry) => String(entry)).filter(Boolean)
      : defaultContent.heroPlaceholders,
    ctaText: stringValue(item.ctaText, defaultContent.ctaText),
    tagline: stringValue(item.tagline, defaultContent.tagline),
    footerSlogan: stringValue(item.footerSlogan, defaultContent.footerSlogan),
    videoUrl: stringValue(item.videoUrl, defaultContent.videoUrl),
    video: normalizeVideo(item.video),
    founderName: stringValue(item.founderName, defaultContent.founderName),
    founderTitle: stringValue(item.founderTitle, defaultContent.founderTitle),
    founderText: stringValue(item.founderText, defaultContent.founderText),
    founderPhoto: stringValue(item.founderPhoto, defaultContent.founderPhoto),
    pricingTitle: stringValue(item.pricingTitle, defaultContent.pricingTitle),
    pricingSubtitle: stringValue(item.pricingSubtitle, defaultContent.pricingSubtitle),
    pricingProofA: stringValue(item.pricingProofA, defaultContent.pricingProofA),
    pricingProofB: stringValue(item.pricingProofB, defaultContent.pricingProofB),
    trustBadges: Array.isArray(item.trustBadges)
      ? item.trustBadges.map((entry) => String(entry)).filter(Boolean)
      : defaultContent.trustBadges,
    positioningHeadlineA: stringValue(item.positioningHeadlineA, defaultContent.positioningHeadlineA),
    positioningHeadlineB: stringValue(item.positioningHeadlineB, defaultContent.positioningHeadlineB),
    positioningText: stringValue(item.positioningText, defaultContent.positioningText),
    journeySteps: normalizeCards(item.journeySteps, defaultContent.journeySteps),
    helpCards: normalizeCards(item.helpCards, defaultContent.helpCards),
    pricing: normalizePricing(item.pricing),
    cases: normalizeCases(item.cases)
  };

  if (normalized.heroSubtitle === legacyContent.heroSubtitle) {
    normalized.heroSubtitle = defaultContent.heroSubtitle;
  }
  if (normalized.heroTitle === legacyContent.heroTitle) {
    normalized.heroTitle = defaultContent.heroTitle;
  }
  if (normalized.heroSubtitle === legacyContent.heroSubtitleV2) {
    normalized.heroSubtitle = defaultContent.heroSubtitle;
  }
  if (normalized.ctaText === legacyContent.ctaText) {
    normalized.ctaText = defaultContent.ctaText;
  }
  if (normalized.heroPlaceholders.join("|") === legacyHeroPlaceholders.join("|")) {
    normalized.heroPlaceholders = defaultContent.heroPlaceholders;
  }
  if (normalized.heroPlaceholders.join("|") === legacyHeroPlaceholdersV2.join("|")) {
    normalized.heroPlaceholders = defaultContent.heroPlaceholders;
  }
  if (normalized.trustBadges.join("|") === legacyTrustBadges.join("|")) {
    normalized.trustBadges = defaultContent.trustBadges;
  }
  if (normalized.founderText === legacyContent.founderText) {
    normalized.founderText = defaultContent.founderText;
  }

  return normalized;
}

export function normalizeMedia(value: unknown): MediaAsset[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    const item = entry as Partial<MediaAsset>;
    const type = ["image", "video", "pdf"].includes(item.type || "") ? item.type : "image";
    return {
      id: stringValue(item.id, cryptoSafeId("media")),
      name: stringValue(item.name, "Untitled file"),
      url: stringValue(item.url, ""),
      type: type as MediaType,
      mimeType: stringValue(item.mimeType, ""),
      size: typeof item.size === "number" ? item.size : 0,
      createdAt: stringValue(item.createdAt, new Date().toISOString())
    };
  }).filter((asset) => asset.url);
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loadContent(): Promise<SiteContent> {
  return apiRequest<SiteContent>("/api/content");
}

export async function saveContent(content: SiteContent): Promise<SiteContent> {
  return apiRequest<SiteContent>("/api/content", {
    method: "PUT",
    body: JSON.stringify(normalizeContent(content))
  });
}

export async function resetContent(): Promise<SiteContent> {
  return apiRequest<SiteContent>("/api/content", { method: "DELETE" });
}

export async function loadLeads(): Promise<Lead[]> {
  return apiRequest<Lead[]>("/api/leads");
}

export async function saveLead(lead: Lead): Promise<Lead> {
  return apiRequest<Lead>("/api/leads", {
    method: "POST",
    body: JSON.stringify(normalizeLead(lead))
  });
}

export async function saveLeads(leads: Lead[]): Promise<Lead[]> {
  return apiRequest<Lead[]>("/api/leads", {
    method: "PUT",
    body: JSON.stringify(leads.map(normalizeLead))
  });
}

export async function loadTeamMembers(): Promise<TeamMember[]> {
  return apiRequest<TeamMember[]>("/api/team");
}

export async function saveTeamMembers(members: TeamMember[]): Promise<TeamMember[]> {
  return apiRequest<TeamMember[]>("/api/team", {
    method: "PUT",
    body: JSON.stringify(normalizeTeamMembers(members))
  });
}

export async function loadMedia(): Promise<MediaAsset[]> {
  return apiRequest<MediaAsset[]>("/api/media");
}

export async function saveMedia(media: MediaAsset[]): Promise<MediaAsset[]> {
  return apiRequest<MediaAsset[]>("/api/media", {
    method: "PUT",
    body: JSON.stringify(normalizeMedia(media))
  });
}

export async function uploadMedia(file: File): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/media/upload", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json() as Promise<MediaAsset>;
}
