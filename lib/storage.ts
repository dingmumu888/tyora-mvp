import { normalizeWhatsAppUrl, WHATSAPP_URL } from "@/lib/whatsapp";

export type EditableCard = {
  title: string;
  description: string;
};

export type CmsImageValue = {
  desktopUrl: string;
  mobileUrl: string;
  alt: string;
  objectPosition: string;
  visible: boolean;
};

export type HomepageCampaign = {
  id: string;
  active: boolean;
  eyebrow: string;
  badge: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  disclosure: string;
  image: CmsImageValue;
  visible: boolean;
  order: number;
};

export type HomepagePath = {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  icon: "idea" | "source" | "custom";
  visible: boolean;
  order: number;
};

export type HomepageCategory = {
  id: string;
  name: string;
  description: string;
  href: string;
  image: CmsImageValue;
  visible: boolean;
  order: number;
};

export type HomepageLink = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  order: number;
};

export type HomepageContent = {
  navigationLinks: HomepageLink[];
  campaigns: HomepageCampaign[];
  assessmentEyebrow: string;
  assessmentTitle: string;
  assessmentDescription: string;
  assessmentPoints: string[];
  communityEyebrow: string;
  communityTitle: string;
  communityDescription: string;
  communityCtaText: string;
  communityCtaHref: string;
  communityEmptyTitle: string;
  communityEmptyBody: string;
  communityLimit: number;
  communityMinimumScore: number;
  caseLimit: number;
  pathsTitle: string;
  pathsDescription: string;
  paths: HomepagePath[];
  categoriesTitle: string;
  categoriesNote: string;
  categories: HomepageCategory[];
  sourceEyebrow: string;
  sourceTitle: string;
  sourceDescription: string;
  sourceCtaText: string;
  sourceCtaHref: string;
  sourceSteps: EditableCard[];
  finalEyebrow: string;
  finalTitle: string;
  finalDescription: string;
  finalPrimaryCtaText: string;
  finalPrimaryCtaHref: string;
  finalSecondaryCtaText: string;
  finalSecondaryCtaHref: string;
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
  chargeTitle: string;
  chargeCards: EditableCard[];
  trustToastEnabled: boolean;
  trustToastMessages: string[];
  trustToastMinSeconds: number;
  trustToastMaxSeconds: number;
};

export type MobileTabsContent = {
  community: string;
  source: string;
  create: string;
  build: string;
  profile: string;
  startDiscussion: string;
  startDiscussionSubtitle: string;
  privateCustom: string;
  privateCustomSubtitle: string;
  sourceProduct: string;
  sourceProductSubtitle: string;
};

export type CommunityAssessmentLabels = {
  feasibility: string;
  estimatedCostRange: string;
  estimatedMoq: string;
  assumptions: string;
  confidence: string;
  assessmentStatus: string;
  disclaimer: string;
  suggestedMaterial: string;
  suggestedProcess: string;
  moldRequirement: string;
  mainRisks: string;
  recommendedNextStep: string;
  customEligibility: string;
};

export type CommunityPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  startIdeaCtaText: string;
  startIdeaCtaHref: string;
  privateCustomCtaText: string;
  privateCustomCtaHref: string;
  continueWithTyoraText: string;
  continueWithTyoraHref: string;
  startCustomProjectText: string;
  startCustomProjectHref: string;
  likeText: string;
  commentText: string;
  shareText: string;
  interestedText: string;
  assessmentDisclaimer: string;
  assessmentLabels: CommunityAssessmentLabels;
  feasibilityOptions: string[];
  confidenceOptions: string[];
  assessmentStatusOptions: string[];
  hotScoreThreshold: number;
  hotWindowDays: number;
  hotProtectionHours: number;
  commentRateLimit: number;
  reactionRateLimit: number;
  shareRateLimit: number;
  rateWindowMinutes: number;
  dailyAssessmentLimit: number;
  showCasesInFeed: boolean;
  caseLimit: number;
};

export type CustomPageContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  formTitle: string;
  formDescription: string;
  submitCtaText: string;
  successTitle: string;
  successBody: string;
  privacyNote: string;
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
  manufacturingReview: string;
  suggestedMaterial: string;
  suggestedProcess: string;
  prototype: string;
  manufacturing: string;
  final: string;
  conceptImage: string;
  prototypeImage: string;
  manufacturingImage: string;
  finalImage: string;
  coverImage: CmsImageValue;
  moq: string;
  timeline: string;
  featured: boolean;
  projectType: "Real Project" | "Demonstration Project";
  badgeLabel: string;
  ctaText: string;
  ctaHref: string;
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
  homepage: HomepageContent;
  sourcePage: SourcePageContent;
  communityPage: CommunityPageContent;
  customPage: CustomPageContent;
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

export const contentKey = "tyora-content";
export const leadsKey = "tyora-leads";
export const mediaKey = "tyora-media";
export const teamMembersKey = "tyora-team-members";
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
  callLink: "",
  linkedInLink: "",
  email: "support@tyora.io",
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
  pricingTitle: "Choose the right Custom support path",
  pricingSubtitle: "Start with an initial custom review, then choose factory introduction, managed custom production, or repeat order management.",
  pricingProofA: "First we confirm feasibility, MOQ, mold needs, sample path, and budget range.",
  pricingProofB:
    "No hidden product markup. You see the factory quotation and pay a clearly agreed TYORA service fee.",
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
      title: "Build, check, and hand off",
      description: "For managed projects, TYORA supports samples, factory communication, production follow-up, quality checks, and handoff to the customer’s nominated freight forwarder in China."
    }
  ],
  helpCards: [
    { title: "Product development review", description: "Turn a rough idea into a clearer product direction before talking to factories." },
    { title: "Manufacturing strategy", description: "Understand materials, processes, MOQ, sample needs, tooling, and avoidable risk." },
    { title: "Factory matching", description: "Find manufacturing partners in China that fit the product, category, and project stage." },
    { title: "Managed production support", description: "Get help with samples, factory communication, production follow-up, quality checks, and freight-forwarder coordination." }
  ],
  homepage: {
    navigationLinks: [
      { id: "ideas", label: "Ideas", href: "/ask", visible: true, order: 1 },
      { id: "custom", label: "Custom Manufacturing", href: "/custom", visible: true, order: 2 },
      { id: "source", label: "Source Products", href: "/source", visible: true, order: 3 },
      { id: "process", label: "How It Works", href: "/service-scope", visible: true, order: 4 },
      { id: "pricing", label: "Pricing", href: "/build#pricing", visible: true, order: 5 },
      { id: "account", label: "My TYORA", href: "/me", visible: true, order: 6 }
    ],
    campaigns: [
      {
        id: "fidget-desk-toy-campaign",
        active: true,
        eyebrow: "Current Hot-Product Campaign",
        badge: "Stress-relief desk toy",
        title: "Build the next tactile desk toy.",
        description:
          "Upload your fidget, stress-relief, or desk-toy concept. TYORA reviews feasibility, likely cost range, and MOQ before you decide whether to develop it.",
        primaryCtaText: "Upload Your Idea",
        primaryCtaHref: "/ask/new",
        secondaryCtaText: "View Manufacturing Cases",
        secondaryCtaHref: "#ideas-and-cases",
        disclosure: "TYORA campaign concept. Manufacturing review required.",
        image: {
          desktopUrl: "/images/tyora-fidget-campaign-v2.png",
          mobileUrl: "",
          alt: "Modular tactile desk-toy concepts, prototypes, material samples, and manufacturing tools",
          objectPosition: "center center",
          visible: true
        },
        visible: true,
        order: 1
      }
    ],
    assessmentEyebrow: "Initial Manufacturing Assessment",
    assessmentTitle: "Know what is realistic before spending on development.",
    assessmentDescription:
      "TYORA gives a limited early view of the manufacturing path using the product information you provide.",
    assessmentPoints: [
      "Manufacturing feasibility",
      "Estimated cost range",
      "Estimated MOQ"
    ],
    communityEyebrow: "Ideas & Manufacturing Evidence",
    communityTitle: "See what people want to build and how TYORA reviews it.",
    communityDescription:
      "This feed combines eligible public community ideas with clearly labelled TYORA-owned case content.",
    communityCtaText: "Browse All Ideas",
    communityCtaHref: "/ask",
    communityEmptyTitle: "No eligible public ideas yet.",
    communityEmptyBody:
      "TYORA cases and current product campaigns remain available while the community feed is empty.",
    communityLimit: 6,
    communityMinimumScore: 0,
    caseLimit: 3,
    pathsTitle: "Choose the right starting point.",
    pathsDescription: "Start publicly with an idea, privately with custom development, or with an existing product reference.",
    paths: [
      {
        id: "ideas",
        title: "Ideas",
        description: "Share an AI design, sketch, or reference image for an initial manufacturing assessment.",
        ctaText: "Upload Your Idea",
        href: "/ask/new",
        icon: "idea",
        visible: true,
        order: 1
      },
      {
        id: "source",
        title: "Source",
        description: "Upload an existing product and let TYORA check suitable China supplier options.",
        ctaText: "Find a Supplier",
        href: "/source",
        icon: "source",
        visible: true,
        order: 2
      },
      {
        id: "custom",
        title: "Custom",
        description: "Send a confidential product concept for private manufacturing review and development support.",
        ctaText: "Start Custom Project",
        href: "/custom",
        icon: "custom",
        visible: true,
        order: 3
      }
    ],
    categoriesTitle: "Product Categories TYORA Reviews",
    categoriesNote: "TYORA initially reviews non-powered accessories, desktop products, and branded gifts. Compliance-sensitive products require separate review.",
    categories: [
      {
        id: "phone-accessories",
        name: "Phone & Device Accessories",
        description: "Non-powered cases, stands, mounts, cable organizers, and related accessories.",
        href: "/ask?category=Phone%20%26%20Device%20Accessories",
        image: { desktopUrl: "/images/category-phone-3c-accessories-v1.png", mobileUrl: "", alt: "Non-powered phone cases, stands, mounts, and cable organizers", objectPosition: "center center", visible: true },
        visible: true,
        order: 1
      },
      {
        id: "desktop-office",
        name: "Desktop & Office Accessories",
        description: "Organizers, risers, stands, tactile desk products, and workplace tools.",
        href: "/ask?category=Office%20%26%20Desktop",
        image: { desktopUrl: "/images/category-desktop-office-v1.png", mobileUrl: "", alt: "Non-powered desktop organizers, stands, and office accessories", objectPosition: "center center", visible: true },
        visible: true,
        order: 2
      },
      {
        id: "custom-gifts",
        name: "Custom Gifts",
        description: "Branded gifts, promotional products, presentation packaging, and keepsakes.",
        href: "/ask?category=Gifts",
        image: { desktopUrl: "/images/category-custom-gifts-v1.png", mobileUrl: "", alt: "Custom gift concepts, promotional products, and presentation packaging", objectPosition: "center center", visible: true },
        visible: true,
        order: 3
      },
      { id: "electronics-accessories", name: "Compliance-sensitive Accessories", description: "Powered, battery, charging, and regulated products require separate compliance review.", href: "/ask?category=Consumer%20Electronics", image: { desktopUrl: "", mobileUrl: "", alt: "", objectPosition: "center center", visible: false }, visible: false, order: 4 },
      { id: "lifestyle", name: "Lifestyle Products", description: "Additional consumer products enabled only when they match current review capacity.", href: "/ask?category=Lifestyle", image: { desktopUrl: "", mobileUrl: "", alt: "", objectPosition: "center center", visible: false }, visible: false, order: 5 },
      { id: "fashion-accessories", name: "Fashion Accessories", description: "Bags, jewelry, and wearable accessory concepts enabled separately by an administrator.", href: "/ask?category=Fashion%20Accessories", image: { desktopUrl: "", mobileUrl: "", alt: "", objectPosition: "center center", visible: false }, visible: false, order: 6 }
    ],
    sourceEyebrow: "Source Existing Products",
    sourceTitle: "Already found a product? Check the supplier path.",
    sourceDescription:
      "Upload a photo or link. TYORA checks product fit, suitable supplier options, and estimated China factory pricing.",
    sourceCtaText: "Request Product Match",
    sourceCtaHref: "/source",
    sourceSteps: [
      { title: "Upload a reference", description: "Send product photos or a link with the target quantity." },
      { title: "Confirm the requirement", description: "TYORA reviews the product details and supplier fit." },
      { title: "Choose the next step", description: "Continue with factory introduction or managed sourcing." }
    ],
    finalEyebrow: "Ready for the next manufacturing decision?",
    finalTitle: "Start with the product information you already have.",
    finalDescription: "A sketch, AI image, product photo, or short description is enough to begin the right TYORA path.",
    finalPrimaryCtaText: "Upload Your Idea",
    finalPrimaryCtaHref: "/ask/new",
    finalSecondaryCtaText: "Start Private Custom Review",
    finalSecondaryCtaHref: "/custom"
  },
  sourcePage: {
    eyebrow: "Source This Product",
    title: "Found a product? Let TYORA check China supplier options.",
    subtitle: "Upload a reference image or product link. TYORA will help check supplier options and estimated China factory pricing.",
    ctaText: "Request Product Match",
    statLabel: "Supplier requests reviewed",
    secondaryStatValue: "Initial",
    secondaryStatLabel: "Supplier assessment",
    sampleNote: "Sample costs and shipping are charged at cost when a sample is required.",
    disclaimer: "No exact price or supplier is confirmed before supplier verification. No hidden product markup. You see the factory quotation and pay a clearly agreed TYORA service fee.",
    successTitle: "Source request received.",
    successBody: "TYORA will review supplier options and estimated China pricing.",
    supportCards: [
      { title: "Find supplier options", description: "We look for China suppliers that match the product reference." },
      { title: "Check factory pricing", description: "TYORA negotiates competitive factory pricing based on the confirmed product requirements, quantity, and available supplier options." },
      { title: "Sample coordination", description: "Sample and shipping costs are disclosed and charged at cost when a sample is required." },
      { title: "Two service paths", description: "Factory introduction or managed sourcing with quality checks and freight-forwarder coordination." }
    ],
    chargeTitle: "How TYORA charges if you continue",
    chargeCards: [
      { title: "Initial supplier assessment", description: "We check supplier options and estimated China factory pricing before you choose a paid service." },
      { title: "Factory introduction", description: "If you want to talk directly with a matched factory, TYORA charges a one-time introduction fee. Product cost remains factory price." },
      { title: "Managed sourcing", description: "TYORA manages supplier communication, sample follow-up, quality checks, and freight-forwarder coordination. You see the factory quotation and pay a clearly agreed TYORA service fee." }
    ],
    trustToastEnabled: false,
    trustToastMessages: [],
    trustToastMinSeconds: 60,
    trustToastMaxSeconds: 300
  },
  communityPage: {
    eyebrow: "Ideas reviewed by TYORA",
    title: "Share a product idea and understand the manufacturing path.",
    description: "Public ideas enter moderation before publication. Approved ideas can receive a structured initial TYORA assessment.",
    startIdeaCtaText: "Upload Your Idea",
    startIdeaCtaHref: "/ask/new",
    privateCustomCtaText: "Start a Private Custom Project",
    privateCustomCtaHref: "/custom",
    continueWithTyoraText: "Continue with TYORA",
    continueWithTyoraHref: "/custom",
    startCustomProjectText: "Start Custom Project",
    startCustomProjectHref: "/custom",
    likeText: "Like",
    commentText: "Comment",
    shareText: "Share",
    interestedText: "I Want One",
    assessmentDisclaimer: "Preliminary estimate only. Final pricing, MOQ, and production feasibility depend on confirmed specifications, samples, and factory quotations.",
    assessmentLabels: {
      feasibility: "Manufacturing feasibility",
      estimatedCostRange: "Estimated cost range",
      estimatedMoq: "Estimated MOQ",
      assumptions: "Assumptions",
      confidence: "Confidence",
      assessmentStatus: "Assessment status",
      disclaimer: "Assessment disclaimer",
      suggestedMaterial: "Suggested material",
      suggestedProcess: "Suggested process",
      moldRequirement: "Mold requirement",
      mainRisks: "Main risks",
      recommendedNextStep: "Recommended next step",
      customEligibility: "Custom project eligibility"
    },
    feasibilityOptions: ["Feasible", "Feasible with changes", "More information required", "Not currently feasible"],
    confidenceOptions: ["Early indication", "Moderate confidence", "High confidence after factory feedback"],
    assessmentStatusOptions: ["Draft", "Published"],
    hotScoreThreshold: 10,
    hotWindowDays: 7,
    hotProtectionHours: 48,
    commentRateLimit: 10,
    reactionRateLimit: 30,
    shareRateLimit: 10,
    rateWindowMinutes: 10,
    dailyAssessmentLimit: 3,
    showCasesInFeed: true,
    caseLimit: 4
  },
  customPage: {
    eyebrow: "Private Custom Project",
    title: "Develop a custom product with TYORA",
    subtitle: "Send confidential product information for a private manufacturing review. Nothing submitted here is published to the community.",
    formTitle: "Start your private Custom inquiry",
    formDescription: "Share the information you already have. You can add approved public Idea context without entering it again.",
    submitCtaText: "Submit Private Custom Inquiry",
    successTitle: "Private Custom inquiry received",
    successBody: "Your private request is available in My TYORA. TYORA will review the information and update the next step there.",
    privacyNote: "Private by default. Customer designs, files, contact details, pricing discussions, and factory information are never shown on public pages."
  },
  mobileTabs: {
    community: "Home",
    source: "Source",
    create: "Submit",
    build: "Ideas",
    profile: "Account",
    startDiscussion: "Public Idea",
    startDiscussionSubtitle: "Share a product idea for community and TYORA review.",
    privateCustom: "Private Custom Review",
    privateCustomSubtitle: "Send a confidential concept directly to TYORA.",
    sourceProduct: "Source Existing Product",
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
      id: "free-custom-review",
      name: "Initial Custom Review",
      subtitle: "Before you spend money",
      priceLabel: "Initial feasibility review",
      price: "Free",
      description:
        "TYORA confirms whether the product can be made, MOQ, mold requirement, mold cost range, sample possibility, and estimated project budget before design or material changes.",
      ctaText: "Request Initial Review",
      visible: true,
      order: 1,
      features: [
        "Can this product be made?",
        "Confirmed MOQ from factory feedback",
        "Mold requirement and mold cost range",
        "Sample possibility before production",
        "Estimated budget range",
        "Main risks and suggested next step"
      ],
      bottomNote: "This is an initial review, not a final production quote."
    },
    {
      id: "factory-introduction",
      name: "Factory Introduction",
      subtitle: "Work directly with the factory",
      priceLabel: "One-time introduction fee",
      price: "5% of estimated first order value, minimum $499",
      description:
        "For customers who want verified factory contact and prefer to manage communication, samples, and production directly.",
      ctaText: "Request Introduction",
      visible: true,
      order: 2,
      features: [
        "Factory fit review",
        "Verified factory contact",
        "Factory information and communication handoff",
        "Product cost remains factory priced",
        "Replacement eligibility review if the supplier becomes unavailable shortly after release"
      ],
      exclusions: [
        "Ongoing factory communication",
        "Sample follow-up",
        "Production monitoring",
        "Quality inspection",
        "Freight-forwarder coordination"
      ],
      bottomNote: "No hidden product markup. You see the factory quotation and pay a clearly agreed TYORA service fee."
    },
    {
      id: "managed-custom-production",
      name: "Managed Custom Production",
      subtitle: "TYORA manages the first custom order",
      badge: "Recommended",
      priceLabel: "First custom order",
      price: "15% of first order value, minimum $999",
      description:
        "TYORA compares factory options, follows sampling and mold work, manages production, quality checks, and handoff to the customer’s nominated freight forwarder in China.",
      highlightBanner: "The right factory choice can save more than the service fee.",
      ctaText: "Start Managed Custom",
      visible: true,
      order: 3,
      features: [
        "Factory option comparison",
        "Competitive factory pricing based on confirmed requirements and available supplier options",
        "Factory communication",
        "Sampling and mold follow-up",
        "Price negotiation",
        "Production follow-up",
        "Quality checks",
        "Freight-forwarder coordination",
        "Approved reference sample retained by TYORA"
      ],
      bottomNote: "No hidden product markup. You see the factory quotation and pay a clearly agreed TYORA service fee."
    },
    {
      id: "repeat-order-management",
      name: "Repeat Order Management",
      subtitle: "For the same product and same specs",
      priceLabel: "Repeat orders",
      price: "10% of repeat order value, minimum $399",
      description:
        "For repeat orders of the same product, same specs, and same factory. TYORA uses the approved reference sample to help keep quality consistent.",
      ctaText: "Manage Reorder",
      visible: true,
      order: 4,
      features: [
        "No new custom development fee",
        "Approved sample used as quality reference",
        "Factory reorder communication",
        "Basic production supervision",
        "Quality comparison against retained sample",
        "Freight-forwarder coordination"
      ],
      bottomNote: "If design, material, packaging, supplier, or quality standard changes, TYORA will review pricing again."
    }
  ],
  cases: [
    {
      id: "tyora-phone-stand-demonstration",
      name: "Magnetic Phone Stand Development",
      slug: "tyora-phone-stand-demonstration",
      status: "Prototype Approved",
      country: "",
      category: "Phone & Device Accessories",
      shortDescription:
        "A TYORA demonstration case showing how a rough accessory concept can be reviewed before factory matching.",
      concept: "A compact magnetic stand intended to fold flat and support common phone sizes.",
      manufacturingReview: "The hinge, magnet stack, device clearance, and surface finish need confirmation before quotation.",
      suggestedMaterial: "CNC aluminium prototype followed by die-cast aluminium review for suitable production volume.",
      suggestedProcess: "CAD refinement, functional prototype, hinge-cycle review, then supplier quotation against confirmed dimensions.",
      prototype: "Functional form and hinge movement reviewed before production tooling decisions.",
      manufacturing: "Factory matching begins only after the dimensions, finish, magnet requirement, and target quantity are confirmed.",
      final: "Demonstration only. No customer production result is claimed.",
      conceptImage: "/images/tyora-manufacturing-campaign-v1.png",
      prototypeImage: "/images/tyora-manufacturing-campaign-v1.png",
      manufacturingImage: "/images/tyora-manufacturing-campaign-v1.png",
      finalImage: "/images/tyora-manufacturing-campaign-v1.png",
      coverImage: {
        desktopUrl: "/images/tyora-manufacturing-campaign-v1.png",
        mobileUrl: "",
        alt: "Magnetic phone stand concept and prototype on a manufacturing workbench",
        objectPosition: "center center",
        visible: true
      },
      moq: "Confirmed after material and process selection",
      timeline: "Confirmed after prototype scope",
      featured: true,
      projectType: "Demonstration Project",
        badgeLabel: "TYORA Case",
        ctaText: "Review Custom Path",
        ctaHref: "/custom",
        visible: true,
      order: 1
    },
    {
      id: "magnetic-phone-stand",
      name: "Magnetic Phone Stand",
      slug: "magnetic-phone-stand",
      status: "Delivered",
      country: "United States",
      category: "Consumer Electronics",
      shortDescription: "A foldable magnetic phone stand developed from concept to shipment.",
      concept: "Concept",
      manufacturingReview: "",
      suggestedMaterial: "",
      suggestedProcess: "",
      prototype: "Prototype",
      manufacturing: "",
      final: "Final Product",
      conceptImage: "",
      prototypeImage: "",
      manufacturingImage: "",
      finalImage: "",
      coverImage: { desktopUrl: "", mobileUrl: "", alt: "", objectPosition: "center center", visible: false },
      moq: "",
      timeline: "",
      featured: false,
      projectType: "Demonstration Project",
        badgeLabel: "TYORA Case",
        ctaText: "View Custom Manufacturing",
        ctaHref: "/custom",
        visible: false,
      order: 2
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
      manufacturingReview: "",
      suggestedMaterial: "",
      suggestedProcess: "",
      prototype: "Prototype",
      manufacturing: "",
      final: "Final Product",
      conceptImage: "",
      prototypeImage: "",
      manufacturingImage: "",
      finalImage: "",
      coverImage: { desktopUrl: "", mobileUrl: "", alt: "", objectPosition: "center center", visible: false },
      moq: "",
      timeline: "",
      featured: false,
      projectType: "Demonstration Project",
        badgeLabel: "TYORA Case",
        ctaText: "View Custom Manufacturing",
        ctaHref: "/custom",
        visible: false,
      order: 3
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
      manufacturingReview: "",
      suggestedMaterial: "",
      suggestedProcess: "",
      prototype: "Prototype",
      manufacturing: "",
      final: "Final Product",
      conceptImage: "",
      prototypeImage: "",
      manufacturingImage: "",
      finalImage: "",
      coverImage: { desktopUrl: "", mobileUrl: "", alt: "", objectPosition: "center center", visible: false },
      moq: "",
      timeline: "",
      featured: false,
      projectType: "Demonstration Project",
        badgeLabel: "TYORA Case",
        ctaText: "View Custom Manufacturing",
        ctaHref: "/custom",
        visible: false,
      order: 4
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
  pricingTitle: "Choose the right Custom support path",
  pricingSubtitle: "Start with a free custom review, then choose factory introduction, managed custom production, or repeat order management.",
  pricingProofA: "First we confirm feasibility, MOQ, mold needs, sample path, and budget range.",
  pricingProofB:
    "If you continue, TYORA charges a clear service fee. Product costs stay factory priced with no hidden markup.",
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

function publicCategoryLabel(value: unknown, fallback: string) {
  const label = stringValue(value, fallback);
  return label === "Phone & 3C Accessories" || label === "Phone Accessories"
    ? "Phone & Device Accessories"
    : label;
}

function publicCategoryHeading(value: unknown, fallback: string) {
  const heading = stringValue(value, fallback);
  return heading === "Initial Product Categories" ? "Product Categories TYORA Reviews" : heading;
}

function publicCategoryHref(value: unknown, fallback: string) {
  const href = safeCmsHref(value, fallback);
  return href === "/ask?category=Phone%20Accessories"
    ? "/ask?category=Phone%20%26%20Device%20Accessories"
    : href;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function stringListValue(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const next = value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  return next.length ? next : fallback;
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

function safeCmsImageUrl(value: unknown, fallback = "") {
  const candidate = typeof value === "string" ? value.trim() : fallback;
  if (!candidate || candidate.startsWith("data:") || candidate.startsWith("//")) return "";
  if (candidate.startsWith("/")) {
    return /\.svg(?:$|[?#])/i.test(candidate) ? "" : candidate;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || /\.svg$/i.test(url.pathname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function safeCmsHref(value: unknown, fallback: string) {
  const candidate = typeof value === "string" ? value.trim() : fallback;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  if (candidate.startsWith("#")) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function normalizeCmsImage(value: unknown, fallback: CmsImageValue): CmsImageValue {
  const item = value && typeof value === "object" ? (value as Partial<CmsImageValue>) : {};
  const objectPosition = stringValue(item.objectPosition, fallback.objectPosition).trim();
  return {
    desktopUrl: safeCmsImageUrl(item.desktopUrl, fallback.desktopUrl),
    mobileUrl: safeCmsImageUrl(item.mobileUrl, fallback.mobileUrl),
    alt: stringValue(item.alt, fallback.alt).trim().slice(0, 240),
    objectPosition: objectPosition && !/[;{}]/.test(objectPosition) ? objectPosition.slice(0, 40) : "center center",
    visible: booleanValue(item.visible, fallback.visible)
  };
}

function normalizeHomepage(value: unknown): HomepageContent {
  const item = value && typeof value === "object" ? (value as Partial<HomepageContent>) : {};
  const fallback = defaultContent.homepage;
  const campaignsSource = Array.isArray(item.campaigns) ? item.campaigns : fallback.campaigns;
  const pathsSource = Array.isArray(item.paths) ? item.paths : fallback.paths;
  const categoriesSource = Array.isArray(item.categories) ? item.categories : fallback.categories;
  const navigationSource = Array.isArray(item.navigationLinks) ? item.navigationLinks : fallback.navigationLinks;

  const navigationLinks = navigationSource.map((entry, index) => {
    const link = entry as Partial<HomepageLink>;
    const fb = fallback.navigationLinks[index] || fallback.navigationLinks[0];
    return {
      id: stringValue(link.id, fb.id || cryptoSafeId("nav")),
      label: stringValue(link.label, fb.label),
      href: safeCmsHref(link.href, fb.href),
      visible: booleanValue(link.visible, fb.visible),
      order: numberValue(link.order, fb.order || index + 1, 1, 99)
    };
  }).sort((left, right) => left.order - right.order);

  const campaigns = campaignsSource.map((entry, index) => {
    const campaign = entry as Partial<HomepageCampaign>;
    const storedId = typeof campaign.id === "string" ? campaign.id : "";
    const fb = fallback.campaigns.find((candidate) => candidate.id === storedId) || fallback.campaigns[index] || fallback.campaigns[0];
    return {
      id: stringValue(campaign.id, fb.id || cryptoSafeId("campaign")),
      active: booleanValue(campaign.active, fb.active),
      eyebrow: stringValue(campaign.eyebrow, fb.eyebrow),
      badge: stringValue(campaign.badge, fb.badge),
      title: stringValue(campaign.title, fb.title),
      description: stringValue(campaign.description, fb.description),
      primaryCtaText: stringValue(campaign.primaryCtaText, fb.primaryCtaText),
      primaryCtaHref: safeCmsHref(campaign.primaryCtaHref, fb.primaryCtaHref),
      secondaryCtaText: stringValue(campaign.secondaryCtaText, fb.secondaryCtaText),
      secondaryCtaHref: safeCmsHref(campaign.secondaryCtaHref, fb.secondaryCtaHref),
      disclosure: stringValue(campaign.disclosure, fb.disclosure),
      image: normalizeCmsImage(campaign.image, fb.image),
      visible: booleanValue(campaign.visible, fb.visible),
      order: numberValue(campaign.order, fb.order || index + 1, 1, 99)
    };
  }).sort((left, right) => left.order - right.order);

  const paths = pathsSource.map((entry, index) => {
    const path = entry as Partial<HomepagePath>;
    const fb = fallback.paths[index] || fallback.paths[0];
    const icon = ["idea", "source", "custom"].includes(path.icon || "") ? path.icon : fb.icon;
    return {
      id: stringValue(path.id, fb.id || cryptoSafeId("path")),
      title: stringValue(path.title, fb.title),
      description: stringValue(path.description, fb.description),
      ctaText: stringValue(path.ctaText, fb.ctaText),
      href: safeCmsHref(path.href, fb.href),
      icon: icon as HomepagePath["icon"],
      visible: booleanValue(path.visible, fb.visible),
      order: numberValue(path.order, fb.order || index + 1, 1, 99)
    };
  }).sort((left, right) => left.order - right.order);

  const categories = categoriesSource.map((entry, index) => {
    const category = entry as Partial<HomepageCategory>;
    const storedId = typeof category.id === "string" ? category.id : "";
    const fb = fallback.categories.find((candidate) => candidate.id === storedId) || fallback.categories[index] || fallback.categories[0];
    return {
      id: stringValue(category.id, fb.id || cryptoSafeId("category")),
      name: publicCategoryLabel(category.name, fb.name),
      description: stringValue(category.description, fb.description),
      href: publicCategoryHref(category.href, fb.href),
      image: normalizeCmsImage(category.image, fb.image),
      visible: booleanValue(category.visible, fb.visible),
      order: numberValue(category.order, fb.order || index + 1, 1, 99)
    };
  }).sort((left, right) => left.order - right.order);

  return {
    navigationLinks,
    campaigns,
    assessmentEyebrow: stringValue(item.assessmentEyebrow, fallback.assessmentEyebrow),
    assessmentTitle: stringValue(item.assessmentTitle, fallback.assessmentTitle),
    assessmentDescription: stringValue(item.assessmentDescription, fallback.assessmentDescription),
    assessmentPoints: stringListValue(item.assessmentPoints, fallback.assessmentPoints),
    communityEyebrow: stringValue(item.communityEyebrow, fallback.communityEyebrow),
    communityTitle: stringValue(item.communityTitle, fallback.communityTitle),
    communityDescription: stringValue(item.communityDescription, fallback.communityDescription),
    communityCtaText: stringValue(item.communityCtaText, fallback.communityCtaText),
    communityCtaHref: safeCmsHref(item.communityCtaHref, fallback.communityCtaHref),
    communityEmptyTitle: stringValue(item.communityEmptyTitle, fallback.communityEmptyTitle),
    communityEmptyBody: stringValue(item.communityEmptyBody, fallback.communityEmptyBody),
    communityLimit: numberValue(item.communityLimit, fallback.communityLimit, 1, 12),
    communityMinimumScore: numberValue(item.communityMinimumScore, fallback.communityMinimumScore, 0, 10000),
    caseLimit: numberValue(item.caseLimit, fallback.caseLimit, 1, 12),
    pathsTitle: stringValue(item.pathsTitle, fallback.pathsTitle),
    pathsDescription: stringValue(item.pathsDescription, fallback.pathsDescription),
    paths,
    categoriesTitle: publicCategoryHeading(item.categoriesTitle, fallback.categoriesTitle),
    categoriesNote: stringValue(item.categoriesNote, fallback.categoriesNote),
    categories,
    sourceEyebrow: stringValue(item.sourceEyebrow, fallback.sourceEyebrow),
    sourceTitle: stringValue(item.sourceTitle, fallback.sourceTitle),
    sourceDescription: stringValue(item.sourceDescription, fallback.sourceDescription),
    sourceCtaText: stringValue(item.sourceCtaText, fallback.sourceCtaText),
    sourceCtaHref: safeCmsHref(item.sourceCtaHref, fallback.sourceCtaHref),
    sourceSteps: normalizeCards(item.sourceSteps, fallback.sourceSteps),
    finalEyebrow: stringValue(item.finalEyebrow, fallback.finalEyebrow),
    finalTitle: stringValue(item.finalTitle, fallback.finalTitle),
    finalDescription: stringValue(item.finalDescription, fallback.finalDescription),
    finalPrimaryCtaText: stringValue(item.finalPrimaryCtaText, fallback.finalPrimaryCtaText),
    finalPrimaryCtaHref: safeCmsHref(item.finalPrimaryCtaHref, fallback.finalPrimaryCtaHref),
    finalSecondaryCtaText: stringValue(item.finalSecondaryCtaText, fallback.finalSecondaryCtaText),
    finalSecondaryCtaHref: safeCmsHref(item.finalSecondaryCtaHref, fallback.finalSecondaryCtaHref)
  };
}

function normalizeSourcePage(value: unknown): SourcePageContent {
  const item = value && typeof value === "object" ? (value as Partial<SourcePageContent>) : {};
  const minSeconds = numberValue(item.trustToastMinSeconds, defaultContent.sourcePage.trustToastMinSeconds, 5, 600);
  const maxSeconds = numberValue(item.trustToastMaxSeconds, defaultContent.sourcePage.trustToastMaxSeconds, 5, 600);
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
    supportCards: normalizeCards(item.supportCards, defaultContent.sourcePage.supportCards),
    chargeTitle: stringValue(item.chargeTitle, defaultContent.sourcePage.chargeTitle),
    chargeCards: normalizeCards(item.chargeCards, defaultContent.sourcePage.chargeCards),
    trustToastEnabled: booleanValue(item.trustToastEnabled, defaultContent.sourcePage.trustToastEnabled),
    trustToastMessages: stringListValue(item.trustToastMessages, defaultContent.sourcePage.trustToastMessages),
    trustToastMinSeconds: Math.min(minSeconds, maxSeconds),
    trustToastMaxSeconds: Math.max(minSeconds, maxSeconds)
  };
}

function normalizeCommunityPage(value: unknown): CommunityPageContent {
  const item = value && typeof value === "object" ? (value as Partial<CommunityPageContent>) : {};
  const fallback = defaultContent.communityPage;
  const labels = item.assessmentLabels && typeof item.assessmentLabels === "object"
    ? item.assessmentLabels as Partial<CommunityAssessmentLabels>
    : {};
  return {
    eyebrow: stringValue(item.eyebrow, fallback.eyebrow),
    title: stringValue(item.title, fallback.title),
    description: stringValue(item.description, fallback.description),
    startIdeaCtaText: stringValue(item.startIdeaCtaText, fallback.startIdeaCtaText),
    startIdeaCtaHref: safeCmsHref(item.startIdeaCtaHref, fallback.startIdeaCtaHref),
    privateCustomCtaText: stringValue(item.privateCustomCtaText, fallback.privateCustomCtaText),
    privateCustomCtaHref: safeCmsHref(item.privateCustomCtaHref, fallback.privateCustomCtaHref),
    continueWithTyoraText: stringValue(item.continueWithTyoraText, fallback.continueWithTyoraText),
    continueWithTyoraHref: safeCmsHref(item.continueWithTyoraHref, fallback.continueWithTyoraHref),
    startCustomProjectText: stringValue(item.startCustomProjectText, fallback.startCustomProjectText),
    startCustomProjectHref: safeCmsHref(item.startCustomProjectHref, fallback.startCustomProjectHref),
    likeText: stringValue(item.likeText, fallback.likeText),
    commentText: stringValue(item.commentText, fallback.commentText),
    shareText: stringValue(item.shareText, fallback.shareText),
    interestedText: stringValue(item.interestedText, fallback.interestedText),
    assessmentDisclaimer: stringValue(item.assessmentDisclaimer, fallback.assessmentDisclaimer),
    assessmentLabels: {
      feasibility: stringValue(labels.feasibility, fallback.assessmentLabels.feasibility),
      estimatedCostRange: stringValue(labels.estimatedCostRange, fallback.assessmentLabels.estimatedCostRange),
      estimatedMoq: stringValue(labels.estimatedMoq, fallback.assessmentLabels.estimatedMoq),
      assumptions: stringValue(labels.assumptions, fallback.assessmentLabels.assumptions),
      confidence: stringValue(labels.confidence, fallback.assessmentLabels.confidence),
      assessmentStatus: stringValue(labels.assessmentStatus, fallback.assessmentLabels.assessmentStatus),
      disclaimer: stringValue(labels.disclaimer, fallback.assessmentLabels.disclaimer),
      suggestedMaterial: stringValue(labels.suggestedMaterial, fallback.assessmentLabels.suggestedMaterial),
      suggestedProcess: stringValue(labels.suggestedProcess, fallback.assessmentLabels.suggestedProcess),
      moldRequirement: stringValue(labels.moldRequirement, fallback.assessmentLabels.moldRequirement),
      mainRisks: stringValue(labels.mainRisks, fallback.assessmentLabels.mainRisks),
      recommendedNextStep: stringValue(labels.recommendedNextStep, fallback.assessmentLabels.recommendedNextStep),
      customEligibility: stringValue(labels.customEligibility, fallback.assessmentLabels.customEligibility)
    },
    feasibilityOptions: stringListValue(item.feasibilityOptions, fallback.feasibilityOptions).slice(0, 12),
    confidenceOptions: stringListValue(item.confidenceOptions, fallback.confidenceOptions).slice(0, 12),
    assessmentStatusOptions: stringListValue(item.assessmentStatusOptions, fallback.assessmentStatusOptions).filter((value) => ["Draft", "Published"].includes(value)),
    hotScoreThreshold: numberValue(item.hotScoreThreshold, fallback.hotScoreThreshold, 1, 10000),
    hotWindowDays: numberValue(item.hotWindowDays, fallback.hotWindowDays, 1, 90),
    hotProtectionHours: numberValue(item.hotProtectionHours, fallback.hotProtectionHours, 1, 720),
    commentRateLimit: numberValue(item.commentRateLimit, fallback.commentRateLimit, 1, 200),
    reactionRateLimit: numberValue(item.reactionRateLimit, fallback.reactionRateLimit, 1, 500),
    shareRateLimit: numberValue(item.shareRateLimit, fallback.shareRateLimit, 1, 200),
    rateWindowMinutes: numberValue(item.rateWindowMinutes, fallback.rateWindowMinutes, 1, 1440),
    dailyAssessmentLimit: numberValue(item.dailyAssessmentLimit, fallback.dailyAssessmentLimit, 1, 100),
    showCasesInFeed: booleanValue(item.showCasesInFeed, fallback.showCasesInFeed),
    caseLimit: numberValue(item.caseLimit, fallback.caseLimit, 0, 12)
  };
}

function normalizeCustomPage(value: unknown): CustomPageContent {
  const item = value && typeof value === "object" ? (value as Partial<CustomPageContent>) : {};
  const fallback = defaultContent.customPage;
  return {
    eyebrow: stringValue(item.eyebrow, fallback.eyebrow),
    title: stringValue(item.title, fallback.title),
    subtitle: stringValue(item.subtitle, fallback.subtitle),
    formTitle: stringValue(item.formTitle, fallback.formTitle),
    formDescription: stringValue(item.formDescription, fallback.formDescription),
    submitCtaText: stringValue(item.submitCtaText, fallback.submitCtaText),
    successTitle: stringValue(item.successTitle, fallback.successTitle),
    successBody: stringValue(item.successBody, fallback.successBody),
    privacyNote: stringValue(item.privacyNote, fallback.privacyNote)
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
    privateCustom: stringValue(item.privateCustom, defaultContent.mobileTabs.privateCustom),
    privateCustomSubtitle: stringValue(item.privateCustomSubtitle, defaultContent.mobileTabs.privateCustomSubtitle),
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
      const storedId = typeof item.id === "string" ? item.id : "";
      const fb = defaultContent.cases.find((study) => study.id === storedId) || defaultContent.cases[index] || defaultContent.cases[0];
      const name = stringValue(item.name, fb.name);
      const status = ["Concept", "Prototype Approved", "In Production", "Delivered"].includes(item.status || "")
        ? item.status
        : fb.status;
      const projectType = ["Real Project", "Demonstration Project"].includes(item.projectType || "")
        ? item.projectType
        : fb.projectType;
      const legacyCover = stringValue(item.finalImage, "") || stringValue(item.prototypeImage, "") || stringValue(item.conceptImage, "");
      return {
        id: stringValue(item.id, fb.id || cryptoSafeId("case")),
        name,
        slug: stringValue(item.slug, fb.slug || slugify(name)),
        status: status as CaseStudyStatus,
        country: stringValue(item.country, fb.country),
        category: publicCategoryLabel(item.category, fb.category),
        shortDescription: stringValue(item.shortDescription, fb.shortDescription),
        concept: stringValue(item.concept, fb.concept),
        manufacturingReview: stringValue(item.manufacturingReview, fb.manufacturingReview),
        suggestedMaterial: stringValue(item.suggestedMaterial, fb.suggestedMaterial),
        suggestedProcess: stringValue(item.suggestedProcess, fb.suggestedProcess),
        prototype: stringValue(item.prototype, fb.prototype),
        manufacturing: stringValue(item.manufacturing, fb.manufacturing),
        final: stringValue(item.final, fb.final),
        conceptImage: safeCmsImageUrl(item.conceptImage, fb.conceptImage),
        prototypeImage: safeCmsImageUrl(item.prototypeImage, fb.prototypeImage),
        manufacturingImage: safeCmsImageUrl(item.manufacturingImage, fb.manufacturingImage),
        finalImage: safeCmsImageUrl(item.finalImage, fb.finalImage),
        coverImage: normalizeCmsImage(item.coverImage, {
          ...fb.coverImage,
          desktopUrl: legacyCover || fb.coverImage.desktopUrl,
          alt: fb.coverImage.alt || `${name} manufacturing case`
        }),
        moq: stringValue(item.moq, fb.moq),
        timeline: stringValue(item.timeline, fb.timeline),
        featured: booleanValue(item.featured, fb.featured),
        projectType: projectType as CaseStudy["projectType"],
        badgeLabel: stringValue(item.badgeLabel, fb.badgeLabel),
        ctaText: stringValue(item.ctaText, fb.ctaText),
        ctaHref: safeCmsHref(item.ctaHref, fb.ctaHref),
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
    brandName: "TYORA",
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
    homepage: normalizeHomepage(item.homepage),
    sourcePage: normalizeSourcePage(item.sourcePage),
    communityPage: normalizeCommunityPage(item.communityPage),
    customPage: normalizeCustomPage(item.customPage),
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
  const hasLegacyCustomPricing = normalized.pricing.some((plan) =>
    ["manufacturing-review", "full-project-management"].includes(plan.id) ||
    ["Manufacturing Review", "Full Project Management", "制造评估", "制造业回顾", "全程项目管理", "全面项目管理"].includes(plan.name) ||
    plan.price === "$149 USD" ||
    plan.price.includes("149美元")
  );

  if (
    normalized.pricingTitle === "Product Development Support" ||
    normalized.pricing.map((plan) => `${plan.name}|${plan.price.replace(/\d+% /g, "")}`).join("||") === legacyPricingTitles.join("||") ||
    hasLegacyCustomPricing
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
  return apiRequest<Lead[]>("/api/admin/leads");
}

export async function saveLead(lead: Lead): Promise<Lead> {
  return apiRequest<Lead>("/api/leads", {
    method: "POST",
    body: JSON.stringify(normalizeLead(lead))
  });
}

export async function saveLeads(leads: Lead[]): Promise<Lead[]> {
  return apiRequest<Lead[]>("/api/admin/leads", {
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
