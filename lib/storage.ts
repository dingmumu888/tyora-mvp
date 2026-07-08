import { normalizeWhatsAppUrl, WHATSAPP_URL } from "@/lib/whatsapp";

export type EditableCard = {
  title: string;
  description: string;
};

export type SourcePageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  statLabel: string;
  secondaryStatValue: string;
  secondaryStatLabel: string;
  sampleNote: string;
  disclaimer: string;
  successTitle: string;
  successBody: string;
  supportCards: EditableCard[];
};

export type MobileTabsContent = {
  community: string;
  source: string;
  create: string;
  build: string;
  profile: string;
  startDiscussion: string;
  startDiscussionSubtitle: string;
  sourceProduct: string;
  sourceProductSubtitle: string;
};

export type ModuleVisibility = {
  source: boolean;
  journeys: boolean;
  successStories: boolean;
  build: boolean;
  pricing: boolean;
  founder: boolean;
  faq: boolean;
  finalCta: boolean;
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
  subtitle?: string;
  price: string;
  priceLabel?: string;
  priceSuffix?: string;
  description?: string;
  badge?: string;
  highlightBanner?: string;
  note?: string;
  features: string[];
  exclusions?: string[];
  bottomNote?: string;
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
  sourcePage: SourcePageContent;
  mobileTabs: MobileTabsContent;
  moduleVisibility: ModuleVisibility;
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
  whatsappLink: WHATSAPP_URL,
  callLink: "https://cal.com/idea2product/intro",
  linkedInLink: "https://www.linkedin.com/",
  email: "hello@idea2product.co",
  heroTagline: "Factory sourcing and manufacturing support for US founders",
  heroTitle: "Find the right factory in China — before manufacturing mistakes get expensive.",
  heroSubtitle:
    "TYORA helps US product founders validate manufacturability, compare factory fit, manage samples, and avoid costly production mistakes before committing to a supplier.",
  heroPlaceholders: [
    "Enter your product name..."
  ],
  ctaText: "Start WhatsApp Chat",
  tagline: "Find the right factory in China before manufacturing mistakes get expensive.",
  footerSlogan: "Product development and China manufacturing support for US founders.",
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
  founderTitle: "Built for founders who need more than a factory list",
  founderPhoto: "",
  founderText:
    "TYORA helps US founders turn early product ideas into production-ready plans. We review manufacturability, identify the right manufacturing path, coordinate with China-based partners, and help reduce the risk that comes with building a product overseas.",
  pricingTitle: "Choose the support level that fits your launch",
  pricingSubtitle: "Start with a manufacturing review, then decide whether you want TYORA to manage the project with you.",
  pricingProofA: "Start lean. Scale support when the project is ready.",
  pricingProofB:
    "Whether you want factory recommendations or hands-on production support, TYORA gives you transparent guidance before you commit to manufacturing.",
  trustBadges: [
    "US Founder-Focused",
    "China Manufacturing Network",
    "Prototype & Sample Support",
    "Factory Matching",
    "Production Follow-up",
    "Quality & Shipping Support"
  ],
  positioningHeadlineA: "We do not just help you find factories.",
  positioningHeadlineB: "We help you build products.",
  positioningText:
    "A factory can quote what you ask for. TYORA helps you clarify what should be built, how it should be made, which supplier is the right fit, and what needs to be checked before money, time, and inventory are at risk.",
  journeySteps: [
    {
      title: "Send your product idea",
      description: "Share a product name, sketch, AI image, reference product, PDF, or CAD file."
    },
    {
      title: "We review manufacturability",
      description: "TYORA checks feasibility, materials, production method, likely cost drivers, and project risks."
    },
    {
      title: "We map the manufacturing path",
      description: "We identify the factory type, sample plan, tooling needs, MOQ realities, and next decisions."
    },
    {
      title: "Build, check, and deliver",
      description: "For managed projects, TYORA supports samples, factory communication, production follow-up, quality checks, and delivery."
    }
  ],
  helpCards: [
    { title: "Product development review", description: "Turn a rough idea into a clearer product direction before talking to factories." },
    { title: "Manufacturing strategy", description: "Understand materials, processes, MOQ, sample needs, tooling, and avoidable risk." },
    { title: "Factory matching", description: "Find manufacturing partners in China that fit the product, category, and project stage." },
    { title: "Managed production support", description: "Get help with samples, factory communication, production follow-up, quality checks, and shipping." }
  ],
  sourcePage: {
    eyebrow: "Source This Product",
    title: "Found a product? Let TYORA check China supplier options.",
    subtitle: "Upload a reference image or product link. TYORA will help check supplier options and estimated China pricing.",
    ctaText: "Get FREE Supplier Check",
    statLabel: "Supplier checks requested",
    secondaryStatValue: "FREE",
    secondaryStatLabel: "Initial supplier check",
    sampleNote: "Sample support is free. You only pay sample cost and international shipping.",
    disclaimer: "No exact price or supplier is guaranteed before supplier confirmation. TYORA will confirm sample cost and international shipping before payment.",
    successTitle: "Source request received.",
    successBody: "TYORA will review supplier options and estimated China pricing.",
    supportCards: [
      { title: "Find supplier options", description: "We look for China suppliers that match the product reference." },
      { title: "Check estimated pricing", description: "Pricing depends on material, quantity, packaging and supplier response." },
      { title: "Sample support", description: "Sample support is free. You only pay sample cost and international shipping." },
      { title: "Two service paths", description: "Factory introduction or managed sourcing with quality and shipping support." }
    ]
  },
  mobileTabs: {
    community: "Community",
    source: "Source",
    create: "Post",
    build: "Build",
    profile: "Profile",
    startDiscussion: "Start Discussion",
    startDiscussionSubtitle: "Share a product idea with the community.",
    sourceProduct: "Source Product",
    sourceProductSubtitle: "Upload a product reference for supplier check."
  },
  moduleVisibility: {
    source: true,
    journeys: true,
    successStories: true,
    build: true,
    pricing: true,
    founder: true,
    faq: true,
    finalCta: true
  },
  pricing: [
    {
      id: "manufacturing-review",
      name: "Manufacturing Review",
      subtitle: "Factory Matching Included",
      priceLabel: "One-Time Project Kickoff Fee",
      price: "$149 USD",
      description:
        "Best for founders who prefer to manage manufacturing themselves after factory introduction.",
      ctaText: "Start Review",
      visible: true,
      order: 1,
      features: [
        "Manufacturing feasibility review",
        "Factory matching",
        "Up to 5 suitable factory recommendations",
        "Factory information and contact details",
        "Continued factory recommendations if no suitable factory is found"
      ],
      exclusions: [
        "Factory communication",
        "Price negotiation",
        "Sample inspection",
        "Production monitoring",
        "Factory audit",
        "Shipping coordination"
      ],
      bottomNote: "After we introduce the right factory, you work directly with them."
    },
    {
      id: "full-project-management",
      name: "Full Project Management",
      subtitle: "We become your manufacturing representative in China.",
      badge: "Recommended",
      priceLabel: "Project Kickoff",
      price: "$149 USD",
      priceSuffix: "+\nCustom Service Fee",
      description:
        "We manage the manufacturing process on your behalf.\n\nYou stay in control and approve the key decisions.",
      highlightBanner: "We protect your time, your budget, and your product.",
      note: "Custom Service Fee\nQuoted before production begins.",
      ctaText: "Start Project",
      visible: true,
      order: 2,
      features: [
        "Everything in Manufacturing Review",
        "Factory communication",
        "Requirement confirmation",
        "Factory verification (when required)",
        "Price negotiation",
        "Sample inspection",
        "Production follow-up",
        "Quality follow-up",
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
  ctaTextV2: "Start Your Project",
  heroSubtitle:
    "Upload your design or describe your idea. We help turn it into a real product through trusted manufacturing partners in China.",
  heroSubtitleV2:
    "We help entrepreneurs turn ideas into manufacturable products through trusted manufacturing partners in China.",
  founderText:
    "I help entrepreneurs and product creators turn ideas into real products by connecting them with trusted manufacturing partners in China. I personally assist with supplier sourcing, sample verification, production coordination, and logistics support."
};
const previousDefaultContent = {
  heroTagline: "Product Development Partner for makers, sellers, and launch teams",
  heroTitle: "Turn Your Product Idea Into Reality.",
  heroSubtitle:
    "Start a discussion. We'll help you turn the idea into a manufacturable product through trusted manufacturing partners in China.",
  tagline: "Turn Your Product Idea Into Reality.",
  footerSlogan: "We don't just manufacture products. We help bring ideas to life.",
  founderTitle: "Meet Your Product Partner",
  founderText:
    "I help entrepreneurs transform product ideas into manufacturable products through trusted manufacturing partners in China. Every project is personally reviewed.",
  pricingTitle: "Choose How You'd Like to Work With TYORA",
  pricingSubtitle: "Choose the level of support that's right for your project.",
  pricingProofA: "Choose the level of support that fits your project.",
  pricingProofB:
    "Whether you manage production yourself or prefer TYORA to manage everything, you'll always receive transparent advice and independent factory recommendations.",
  positioningHeadlineA: "How TYORA Helps",
  positioningHeadlineB: "",
  positioningText:
    "TYORA supports product development from validation and planning to production, quality assurance, and delivery."
};
const productionSavedHeroContent = {
  heroTagline: "FROM IDEA TO MANUFACTURING",
  heroTitle: ["Turn your product idea", "into a manufacturable product."].join(" "),
  heroSubtitle:
    "Whether your idea started with AI, a sketch, or a simple concept, TYORA transforms it into a manufacturable product through trusted manufacturing partners in China."
};
const previousDefaultTrustBadges = [
  "Product Development",
  "Manufacturing Partner Matching",
  "Prototype Management",
  "Quality Inspection",
  "Production Follow-up",
  "Shipping Support"
];
const previousDefaultJourneySteps = [
  "Share Your Idea|Share your product idea, AI concept, sketch, reference product, or CAD file.",
  "Product Review|We evaluate feasibility, materials, manufacturing methods, costs, and risks.",
  "Manufacturing Strategy|We identify the right manufacturing solution for your product.",
  "Prototype|We coordinate prototyping, testing, revisions, and production readiness.",
  "Production|We manage production, quality inspections, and manufacturing progress.",
  "Delivery|We coordinate packaging, logistics, and worldwide delivery."
];
const productionSavedJourneySteps = [
  "Product Idea|Share your idea, AI concept, sketch, reference product, or CAD file.",
  "Manufacturing Strategy|We define the best manufacturing strategy based on your product, budget, timeline, and production goals.",
  "Factory Selection|We select manufacturing partners that best fit your product requirements.",
  "Production Management|We coordinate sampling, production, communication, and quality control.",
  "Delivery|We coordinate packaging, logistics, shipping documentation, and global delivery."
];
const previousDefaultHelpCards = [
  "Product Validation|Avoid costly mistakes before production.",
  "Manufacturing Planning|Plan the right manufacturing approach before committing to production.",
  "Project Management|Coordinate communication, samples, timelines, and production progress.",
  "Quality Assurance|Reduce manufacturing risks before shipment.",
  "Logistics Support|Coordinate packaging, documents, and global delivery."
];
const legacyHeroPlaceholders = [
  "I want to create a magnetic phone stand...",
  "I designed a capybara night light...",
  "I want to launch a Kickstarter product...",
  "I need a custom pet accessory..."
];
const legacyHeroPlaceholdersV2 = [
  "Describe your product idea...\n\nExample:\n\"I want to design a magnetic phone stand for iPhone.\""
];
const legacyHeroPlaceholdersV3 = [
  "Describe the product you want to create..."
];
const legacyTrustBadges = [
  "Product Development Partner",
  "Transparent Factory Pricing",
  "Dedicated Project Manager",
  "Worldwide Delivery Support"
];
const legacyJourneySteps = [
  "Idea|Submit your product concept, AI image, sketch, reference product, or CAD file.",
  "Development|We review manufacturability, materials, production method, MOQ, and project risks.",
  "Manufacturing Partner|We match your project with suitable manufacturing partners in China.",
  "Production Management|We help coordinate sampling, production, communication, and inspection.",
  "Delivery|We assist with packaging, logistics coordination, and global delivery."
];
const legacyHelpCards = [
  "Idea Validation|Avoid expensive mistakes before production.",
  "Manufacturing Partner Matching|Connect with suitable manufacturing partners.",
  "Production Management|We coordinate communication, samples, and production.",
  "Quality Assurance|Reduce manufacturing risks before shipment."
];
const legacyPricingTitles = [
  "Free Manufacturing Assessment|Free",
  "Project Development Package|$149 Project Deposit",
  "Production Management|Service Fee"
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

function normalizeSourcePage(value: unknown): SourcePageContent {
  const item = value && typeof value === "object" ? (value as Partial<SourcePageContent>) : {};
  return {
    eyebrow: stringValue(item.eyebrow, defaultContent.sourcePage.eyebrow),
    title: stringValue(item.title, defaultContent.sourcePage.title),
    subtitle: stringValue(item.subtitle, defaultContent.sourcePage.subtitle),
    ctaText: stringValue(item.ctaText, defaultContent.sourcePage.ctaText),
    statLabel: stringValue(item.statLabel, defaultContent.sourcePage.statLabel),
    secondaryStatValue: stringValue(item.secondaryStatValue, defaultContent.sourcePage.secondaryStatValue),
    secondaryStatLabel: stringValue(item.secondaryStatLabel, defaultContent.sourcePage.secondaryStatLabel),
    sampleNote: stringValue(item.sampleNote, defaultContent.sourcePage.sampleNote),
    disclaimer: stringValue(item.disclaimer, defaultContent.sourcePage.disclaimer),
    successTitle: stringValue(item.successTitle, defaultContent.sourcePage.successTitle),
    successBody: stringValue(item.successBody, defaultContent.sourcePage.successBody),
    supportCards: normalizeCards(item.supportCards, defaultContent.sourcePage.supportCards)
  };
}

function normalizeMobileTabs(value: unknown): MobileTabsContent {
  const item = value && typeof value === "object" ? (value as Partial<MobileTabsContent>) : {};
  return {
    community: stringValue(item.community, defaultContent.mobileTabs.community),
    source: stringValue(item.source, defaultContent.mobileTabs.source),
    create: stringValue(item.create, defaultContent.mobileTabs.create),
    build: stringValue(item.build, defaultContent.mobileTabs.build),
    profile: stringValue(item.profile, defaultContent.mobileTabs.profile),
    startDiscussion: stringValue(item.startDiscussion, defaultContent.mobileTabs.startDiscussion),
    startDiscussionSubtitle: stringValue(item.startDiscussionSubtitle, defaultContent.mobileTabs.startDiscussionSubtitle),
    sourceProduct: stringValue(item.sourceProduct, defaultContent.mobileTabs.sourceProduct),
    sourceProductSubtitle: stringValue(item.sourceProductSubtitle, defaultContent.mobileTabs.sourceProductSubtitle)
  };
}

function normalizeModuleVisibility(value: unknown): ModuleVisibility {
  const item = value && typeof value === "object" ? (value as Partial<ModuleVisibility>) : {};
  return {
    source: typeof item.source === "boolean" ? item.source : defaultContent.moduleVisibility.source,
    journeys: typeof item.journeys === "boolean" ? item.journeys : defaultContent.moduleVisibility.journeys,
    successStories: typeof item.successStories === "boolean" ? item.successStories : defaultContent.moduleVisibility.successStories,
    build: typeof item.build === "boolean" ? item.build : defaultContent.moduleVisibility.build,
    pricing: typeof item.pricing === "boolean" ? item.pricing : defaultContent.moduleVisibility.pricing,
    founder: typeof item.founder === "boolean" ? item.founder : defaultContent.moduleVisibility.founder,
    faq: typeof item.faq === "boolean" ? item.faq : defaultContent.moduleVisibility.faq,
    finalCta: typeof item.finalCta === "boolean" ? item.finalCta : defaultContent.moduleVisibility.finalCta
  };
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
        subtitle: stringValue(item.subtitle, fb.subtitle || ""),
        price: stringValue(item.price, fb.price),
        priceLabel: stringValue(item.priceLabel, fb.priceLabel || ""),
        priceSuffix: stringValue(item.priceSuffix, fb.priceSuffix || ""),
        description: stringValue(item.description, fb.description || ""),
        badge: stringValue(item.badge, fb.badge || ""),
        highlightBanner: stringValue(item.highlightBanner, fb.highlightBanner || ""),
        note: stringValue(item.note, fb.note || ""),
        features: Array.isArray(item.features)
          ? item.features.map((feature) => String(feature)).filter(Boolean)
          : fb.features,
        exclusions: Array.isArray(item.exclusions)
          ? item.exclusions.map((feature) => String(feature)).filter(Boolean)
          : fb.exclusions || [],
        bottomNote: stringValue(item.bottomNote, fb.bottomNote || ""),
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
    whatsappLink: normalizeWhatsAppUrl(stringValue(item.whatsappLink, defaultContent.whatsappLink)),
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
    cases: normalizeCases(item.cases),
    sourcePage: normalizeSourcePage(item.sourcePage),
    mobileTabs: normalizeMobileTabs(item.mobileTabs),
    moduleVisibility: normalizeModuleVisibility(item.moduleVisibility)
  };

  if (normalized.heroSubtitle === legacyContent.heroSubtitle) {
    normalized.heroSubtitle = defaultContent.heroSubtitle;
  }
  if (normalized.heroTagline === previousDefaultContent.heroTagline) {
    normalized.heroTagline = defaultContent.heroTagline;
  }
  if (normalized.heroTagline === productionSavedHeroContent.heroTagline) {
    normalized.heroTagline = defaultContent.heroTagline;
  }
  if (normalized.heroTitle === legacyContent.heroTitle) {
    normalized.heroTitle = defaultContent.heroTitle;
  }
  if (normalized.heroTitle === previousDefaultContent.heroTitle) {
    normalized.heroTitle = defaultContent.heroTitle;
  }
  if (normalized.heroTitle === productionSavedHeroContent.heroTitle) {
    normalized.heroTitle = defaultContent.heroTitle;
  }
  if (normalized.heroSubtitle === legacyContent.heroSubtitleV2) {
    normalized.heroSubtitle = defaultContent.heroSubtitle;
  }
  if (normalized.heroSubtitle === previousDefaultContent.heroSubtitle) {
    normalized.heroSubtitle = defaultContent.heroSubtitle;
  }
  if (normalized.heroSubtitle === productionSavedHeroContent.heroSubtitle) {
    normalized.heroSubtitle = defaultContent.heroSubtitle;
  }
  if (normalized.ctaText === legacyContent.ctaText) {
    normalized.ctaText = defaultContent.ctaText;
  }
  if (normalized.ctaText === legacyContent.ctaTextV2) {
    normalized.ctaText = defaultContent.ctaText;
  }
  if (normalized.heroPlaceholders.join("|") === legacyHeroPlaceholders.join("|")) {
    normalized.heroPlaceholders = defaultContent.heroPlaceholders;
  }
  if (normalized.heroPlaceholders.join("|") === legacyHeroPlaceholdersV2.join("|")) {
    normalized.heroPlaceholders = defaultContent.heroPlaceholders;
  }
  if (normalized.heroPlaceholders.join("|") === legacyHeroPlaceholdersV3.join("|")) {
    normalized.heroPlaceholders = defaultContent.heroPlaceholders;
  }
  if (normalized.trustBadges.join("|") === legacyTrustBadges.join("|")) {
    normalized.trustBadges = defaultContent.trustBadges;
  }
  if (normalized.trustBadges.join("|") === previousDefaultTrustBadges.join("|")) {
    normalized.trustBadges = defaultContent.trustBadges;
  }
  if (normalized.tagline === previousDefaultContent.tagline) {
    normalized.tagline = defaultContent.tagline;
  }
  if (normalized.footerSlogan === previousDefaultContent.footerSlogan) {
    normalized.footerSlogan = defaultContent.footerSlogan;
  }
  if (normalized.founderTitle === previousDefaultContent.founderTitle) {
    normalized.founderTitle = defaultContent.founderTitle;
  }
  if (normalized.founderText === legacyContent.founderText) {
    normalized.founderText = defaultContent.founderText;
  }
  if (normalized.founderText === previousDefaultContent.founderText) {
    normalized.founderText = defaultContent.founderText;
  }
  if (normalized.positioningHeadlineA === previousDefaultContent.positioningHeadlineA) {
    normalized.positioningHeadlineA = defaultContent.positioningHeadlineA;
  }
  if (normalized.positioningHeadlineB === previousDefaultContent.positioningHeadlineB) {
    normalized.positioningHeadlineB = defaultContent.positioningHeadlineB;
  }
  if (normalized.positioningText === previousDefaultContent.positioningText) {
    normalized.positioningText = defaultContent.positioningText;
  }
  if (normalized.positioningHeadlineA === "We Don't Help You Find Factories.") {
    normalized.positioningHeadlineA = defaultContent.positioningHeadlineA;
  }
  if (normalized.positioningHeadlineB === "We Help You Build Products.") {
    normalized.positioningHeadlineB = defaultContent.positioningHeadlineB;
  }
  if (
    normalized.positioningText ===
    "From product validation to manufacturing, quality control, and delivery, TYORA supports your entire product journey."
  ) {
    normalized.positioningText = defaultContent.positioningText;
  }
  if (normalized.journeySteps.map((card) => `${card.title}|${card.description}`).join("||") === legacyJourneySteps.join("||")) {
    normalized.journeySteps = defaultContent.journeySteps;
  }
  if (normalized.journeySteps.map((card) => `${card.title}|${card.description}`).join("||") === previousDefaultJourneySteps.join("||")) {
    normalized.journeySteps = defaultContent.journeySteps;
  }
  if (normalized.journeySteps.map((card) => `${card.title}|${card.description}`).join("||") === productionSavedJourneySteps.join("||")) {
    normalized.journeySteps = defaultContent.journeySteps;
  }
  if (normalized.helpCards.map((card) => `${card.title}|${card.description}`).join("||") === legacyHelpCards.join("||")) {
    normalized.helpCards = defaultContent.helpCards;
  }
  if (normalized.helpCards.map((card) => `${card.title}|${card.description}`).join("||") === previousDefaultHelpCards.join("||")) {
    normalized.helpCards = defaultContent.helpCards;
  }
  if (normalized.pricingTitle === previousDefaultContent.pricingTitle) {
    normalized.pricingTitle = defaultContent.pricingTitle;
    normalized.pricingSubtitle = defaultContent.pricingSubtitle;
    normalized.pricingProofA = defaultContent.pricingProofA;
    normalized.pricingProofB = defaultContent.pricingProofB;
  }
  if (
    normalized.pricingTitle === "Product Development Support" ||
    normalized.pricing.map((plan) => `${plan.name}|${plan.price.replace(/\d+% /g, "")}`).join("||") === legacyPricingTitles.join("||")
  ) {
    normalized.pricingTitle = defaultContent.pricingTitle;
    normalized.pricingSubtitle = defaultContent.pricingSubtitle;
    normalized.pricingProofA = defaultContent.pricingProofA;
    normalized.pricingProofB = defaultContent.pricingProofB;
    normalized.pricing = defaultContent.pricing;
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

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Server returned an invalid response (${response.status}).`);
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success) {
      return envelope.data;
    }
    throw new Error(envelope.message || `Request failed (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }

  return payload as T;
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  return parseApiResponse<T>(response);
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
    return parseApiResponse<MediaAsset>(response);
  }

  return parseApiResponse<MediaAsset>(response);
}

export async function uploadProjectFile(file: File): Promise<{ name: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/leads/upload", {
    method: "POST",
    body: formData
  });

  return parseApiResponse<{ name: string; url: string }>(response);
}
