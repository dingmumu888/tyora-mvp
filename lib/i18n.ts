import { defaultContent, LeadStatus, SiteContent } from "@/lib/storage";

export type Language = "en" | "zh";

export const languageKey = "tyora-language";

export const zhContent: SiteContent = {
  ...defaultContent,
  heroTitle: "把你的产品想法变成现实。",
  heroSubtitle:
    "上传你的想法。我们会帮助你通过中国可信制造伙伴，把它变成可制造的真实产品。",
  heroPlaceholders: [
    "描述你想打造的产品..."
  ],
  tagline: "把你的产品想法变成现实。",
  founderText:
    "我帮助创业者和产品创作者，通过中国制造网络把想法变成真实产品。TYORA 支持完整产品旅程：从想法验证、制造伙伴匹配，到样品确认、生产协调、质量控制和交付。",
  pricing: [
    {
      ...defaultContent.pricing[0],
      name: "初步定制评估",
      subtitle: "先确认项目是否现实",
      priceLabel: "初步可行性评估",
      price: "免费",
      description: "TYORA 会确认产品能不能做、MOQ、是否需要模具、模具成本范围、是否能先做样品，以及不改设计/材质/结构前提下的预算范围。",
      ctaText: "开始初步评估",
      features: ["产品是否能做", "基于工厂反馈确认 MOQ", "是否需要模具和模具成本范围", "是否能先做样品", "项目预算区间", "主要风险和下一步建议"],
      exclusions: [],
      bottomNote: "这是初步评估，不是最终生产报价。"
    },
    {
      ...defaultContent.pricing[1],
      name: "工厂介绍",
      subtitle: "客户直接与工厂合作",
      badge: undefined,
      priceLabel: "一次性介绍费",
      price: "首单预估金额的 5%，最低 $499",
      priceSuffix: undefined,
      description: "适合希望拿到工厂联系方式，并自己管理沟通、样品和生产的客户。",
      highlightBanner: undefined,
      note: undefined,
      ctaText: "申请工厂介绍",
      features: ["工厂匹配评估", "认证工厂联系方式", "工厂信息和沟通交接", "产品成本保持出厂价", "供应商短期失效时评估替代供应商支持资格"],
      exclusions: ["后续工厂沟通", "样品跟进", "生产监督", "质量检查", "发货协调"],
      bottomNote: "TYORA 不在产品成本上加价。"
    },
    {
      ...defaultContent.pricing[2],
      name: "全程定制生产",
      subtitle: "TYORA 跟进第一次定制订单",
      badge: "推荐",
      priceLabel: "第一次定制订单",
      price: "首单金额的 15%，最低 $999",
      description: "TYORA 帮客户对比工厂方案，跟进样品和模具，管理生产、质检和发货协调。",
      highlightBanner: "选对工厂节省的成本，可能超过服务费。",
      ctaText: "开始全程定制",
      features: ["对比多个工厂方案", "推荐性价比最高的工厂", "工厂沟通", "样品和模具跟进", "价格谈判", "生产跟进", "质量检查", "发货协调", "TYORA 保留确认样品用于后续质检"],
      bottomNote: "工厂成本透明。TYORA 不在产品成本上加价。"
    },
    {
      ...defaultContent.pricing[3],
      name: "返单管理",
      subtitle: "同一个产品、同一个规格",
      priceLabel: "后续返单",
      price: "返单金额的 10%，最低 $399",
      description: "适用于同产品、同规格、同工厂的后续返单。TYORA 使用第一次确认的样品作为质量参考。",
      ctaText: "管理返单",
      features: ["不再收第一次定制开发费", "用确认样品作为质检参考", "工厂返单沟通", "基础生产监督", "与保留样品进行质量对比", "发货协调"],
      bottomNote: "如果设计、材质、包装、供应商或质量标准变化，TYORA 会重新评估价格。"
    }
  ],
  trustBadges: ["产品开发", "制造伙伴匹配", "样品管理", "质量检查", "生产跟进", "发货支持"],
  cases: [
    {
      ...defaultContent.cases[0],
      name: "磁吸手机支架",
      concept: "概念图",
      prototype: "样品图",
      final: "成品图"
    },
    {
      ...defaultContent.cases[1],
      name: "水豚小夜灯",
      concept: "概念图",
      prototype: "样品图",
      final: "成品图"
    },
    {
      ...defaultContent.cases[2],
      name: "宠物美容工具",
      concept: "概念图",
      prototype: "样品图",
      final: "成品图"
    }
  ]
};

export const ui = {
  en: {
    admin: "Admin",
    back: "Back",
    bookACall: "Book A Call",
    bookACallLink: "Book a call link",
    budget: "Budget",
    cad: "CAD",
    cadFile: "CAD File",
    capybaraPrompt: "I designed a capybara night light...",
    caseName: "Case name",
    caseStudies: "Ideas We've Helped Build",
    chatOnWhatsApp: "Chat On WhatsApp",
    chatWithUs: "Chat With Us",
    closeConversation: "Close conversation",
    concept: "Concept",
    contactLinks: "Contact Links",
    conversationStart: "Start a conversation",
    continue: "Continue",
    delivery: "Delivery",
    design: "Design",
    designPrompt: "Image, PDF, CAD, or rough concept",
    designType: "Design Type",
    email: "Email",
    factoryNext: "Manufacturing fit, sample plan, target quote",
    featuresOnePerLine: "Features, one per line",
    finalProduct: "Final Product",
    founderName: "Founder name",
    founderText: "Founder text",
    fromIdea: "From Idea To Real Product.",
    helpCards: [
      ["Product Validation", "Avoid costly mistakes before production."],
      ["Manufacturing Planning", "Plan the right manufacturing approach before committing to production."],
      ["Project Management", "Coordinate communication, samples, timelines, and production progress."],
      ["Quality Assurance", "Reduce manufacturing risks before shipment."],
      ["Logistics Support", "Coordinate packaging, documents, and handoff to the customer’s nominated freight forwarder in China."]
    ],
    helpTitle: "How TYORA Helps",
    heroBadge: "Product Development Partner for makers, sellers, and launch teams",
    homeText: "Homepage Text",
    howVideoTitle: "See How Your Idea Becomes A Product",
    image: "Image",
    immediately: "Immediately",
    language: "中文",
    leadEmpty: "No conversations yet. Start one from the homepage to create a lead.",
    leadIntro: "Leads started from the homepage conversation.",
    linkedIn: "LinkedIn",
    heroInputExample: "Example:\nMagnetic Phone Stand",
    magneticPrompt: "Describe the product you want to create...",
    manufactureQuestion: "What product would you like to build?",
    manufacturePlaceholder: "Enter your product name...\n\nExample:\nMagnetic Phone Stand",
    no: "No",
    note: "Note",
    packaging: "Packaging",
    pdf: "PDF",
    petPrompt: "I need a custom pet accessory...",
    photoPlaceholder: "Photo placeholder",
    planName: "Plan name",
    price: "Price",
    pricingSection: "Pricing Section",
    positioningHeadlineA: "How TYORA Helps",
    positioningHeadlineB: "",
    positioningText:
      "TYORA supports product development from validation and planning to production, quality assurance, and freight-forwarder handoff.",
    pricingSubtitle: "Start with an initial custom review, then choose factory introduction, managed custom production, or repeat order management.",
    pricingTitle: "Choose the right Custom support path",
    primaryGoal: "Primary goal",
    processVideoUrl: "Process video URL",
    production: "Production",
    productJourney: "How TYORA Works",
    productName: "Product Name",
    productNameExample: "Example:\nMagnetic Phone Stand",
    productNamePlaceholder: "Enter your product name...",
    productNameSubtitle: "Only the product name is needed.",
    projectBrief: "Product brief",
    projectIntake: "Project intake",
    projectReceived: "Project Received",
    projectReceivedText:
      "Thank you for submitting your project. A manufacturing specialist will review your requirements and contact you within 24 hours.",
    projectSubmissions: "Project Submissions",
    prototype: "Prototype",
    qualifiedConversation: "Qualified WhatsApp conversation",
    quantity: "Quantity",
    saveChanges: "Save Changes",
    saveFailed: "Save failed. Please check the server response and try again.",
    saved: "Saved",
    sample: "Sample",
    sampleStage: "Sample Stage",
    sampleVerification: "Sample Verification",
    seeEditable: "Examples of how ideas move from concept to prototype to final product.",
    sketch: "Sketch",
    status: "Status",
    startWhatsAppChat: "Start WhatsApp Chat",
    submitIdea: "Submit Your Idea",
    supplierMatching: "Manufacturing Partner",
    timeline: "Timeline",
    thirtySecond: "30-second overview",
    uploadDesign: "Upload Design",
    uploadIdeaSubtitle: "An AI image, sketch, reference photo or CAD file is enough to get started.",
    uploadYourIdea: "Start a Discussion",
    uploadFounderPhoto: "Upload founder photo",
    videoFounder: "Video & Founder",
    videoUrlPlaceholder: "Paste YouTube, Vimeo, or hosted video URL",
    viewSite: "View site",
    whatsApp: "WhatsApp",
    whatsAppLink: "WhatsApp link",
    within30: "Within 30 Days",
    within90: "Within 90 Days",
    aiImage: "AI Image",
    referenceImage: "Reference Image",
    cadSupported: "CAD",
    saving: "Saving...",
    yes: "Yes",
    journeyDetails: [
      "Share your product idea, AI concept, sketch, reference product, or CAD file.",
      "We evaluate feasibility, materials, manufacturing methods, costs, and risks.",
      "We identify the right manufacturing solution for your product.",
      "We coordinate prototyping, testing, revisions, and production readiness.",
      "We manage production, quality inspections, and manufacturing progress.",
      "We coordinate packaging, documents, and handoff to the customer’s nominated freight forwarder in China."
    ],
    footerLine: "We don't just manufacture products. We help bring ideas to life.",
    trustBadges: [
      "Product Development",
      "Manufacturing Partner Matching",
      "Prototype Management",
      "Quality Inspection",
      "Production Follow-up",
      "Shipping Support"
    ],
    trustCards: [
      ["Founder-Friendly Review", "Start with practical feedback before committing budget to samples or production."],
      ["China Manufacturing Context", "Get guidance on factory fit, MOQ, samples, tooling, timelines, and risk points."],
      ["Hands-On Coordination", "Use TYORA for communication, sample review, production follow-up, quality checks, and freight-forwarder coordination."],
      ["Transparent Decisions", "Stay in control while TYORA helps you understand the tradeoffs before each next step."]
    ],
    trustTitle: "Why US Product Founders Choose TYORA",
    pricingProofA: "First we confirm feasibility, MOQ, mold needs, sample path, and budget range.",
    pricingProofB:
      "No hidden product markup. You see the factory quotation and pay a clearly agreed TYORA service fee.",
    videoSubtitle: "Watch how TYORA helps transform ideas into manufacturable products."
  },
  zh: {
    admin: "后台",
    back: "返回",
    bookACall: "预约通话",
    bookACallLink: "预约通话链接",
    budget: "预算",
    cad: "CAD",
    cadFile: "CAD 文件",
    capybaraPrompt: "我设计了一个水豚小夜灯...",
    caseName: "案例名称",
    caseStudies: "我们帮助打造过的想法",
    chatOnWhatsApp: "通过 WhatsApp 沟通",
    chatWithUs: "联系我们",
    closeConversation: "关闭对话",
    concept: "概念图",
    contactLinks: "联系方式",
    conversationStart: "开始对话",
    continue: "继续",
    delivery: "交付",
    design: "设计",
    designPrompt: "图片、PDF、CAD 或粗略想法",
    designType: "设计类型",
    email: "邮箱",
    factoryNext: "制造适配、样品方案、目标报价",
    featuresOnePerLine: "功能/包含内容，每行一条",
    finalProduct: "成品",
    founderName: "创始人姓名",
    founderText: "创始人介绍",
    fromIdea: "从想法到真实产品。",
    helpCards: [
      ["产品验证", "在生产前避免高成本错误。"],
      ["制造规划", "在投入生产前规划合适的制造方式。"],
      ["项目管理", "协调沟通、样品、时间计划和生产进度。"],
      ["质量保障", "在出货前降低制造风险。"],
      ["物流支持", "协调包装、文件及交付至客户指定的中国境内货运代理。"]
    ],
    helpTitle: "TYORA 如何帮助你",
    heroBadge: "为创客、卖家和新品团队打造的产品开发伙伴",
    homeText: "首页文案",
    howVideoTitle: "看看你的想法如何变成产品",
    image: "图片",
    immediately: "立即开始",
    language: "EN",
    leadEmpty: "还没有对话记录。从首页开始对话后，这里会出现线索。",
    leadIntro: "来自首页对话的项目线索。",
    linkedIn: "LinkedIn",
    heroInputExample: "示例：\nMagnetic Phone Stand",
    magneticPrompt: "描述你想打造的产品...",
    manufactureQuestion: "你想开发什么产品？",
    manufacturePlaceholder: "Enter your product name...\n\n示例：\nMagnetic Phone Stand",
    no: "否",
    note: "备注",
    packaging: "包装",
    pdf: "PDF",
    petPrompt: "我需要一个定制宠物配件...",
    photoPlaceholder: "照片占位",
    planName: "方案名称",
    price: "价格",
    pricingSection: "价格模块",
    positioningHeadlineA: "TYORA 如何帮助你",
    positioningHeadlineB: "",
    positioningText:
      "TYORA 支持从产品验证、制造规划到生产、质量保障及货代交接的产品开发流程。",
    pricingSubtitle: "先进行初步评估，再选择工厂介绍、全程定制生产或返单管理。",
    pricingTitle: "选择适合你项目阶段的 Custom 支持方式",
    primaryGoal: "核心目标",
    processVideoUrl: "流程视频链接",
    production: "生产",
    productJourney: "TYORA 如何运作",
    productName: "Product Name",
    productNameExample: "示例：\nMagnetic Phone Stand",
    productNamePlaceholder: "Enter your product name...",
    productNameSubtitle: "只需要产品名称。",
    projectBrief: "产品简报",
    projectIntake: "项目问卷",
    projectReceived: "项目已收到",
    projectReceivedText: "感谢提交项目。制造顾问会审核你的需求，并在 24 小时内联系你。",
    projectSubmissions: "项目提交记录",
    prototype: "样品",
    qualifiedConversation: "获得高质量 WhatsApp 咨询",
    quantity: "数量",
    saveChanges: "保存修改",
    saveFailed: "保存失败。浏览器存储可能已满，请尝试移除较大的上传图片。",
    saved: "已保存",
    sample: "样品",
    sampleStage: "样品阶段",
    sampleVerification: "样品确认",
    seeEditable: "每个项目都从概念走向样品，再走向真实成品。",
    sketch: "手绘草图",
    status: "状态",
    startWhatsAppChat: "Start WhatsApp Chat",
    submitIdea: "提交你的想法",
    supplierMatching: "制造伙伴",
    timeline: "时间计划",
    thirtySecond: "30 秒流程视频",
    uploadDesign: "上传设计",
    uploadIdeaSubtitle: "AI 图片、草图、参考照片或 CAD 文件都可以开始。",
    uploadYourIdea: "Start a Discussion",
    uploadFounderPhoto: "上传创始人照片",
    videoFounder: "视频与创始人",
    videoUrlPlaceholder: "粘贴 YouTube、Vimeo 或托管视频链接",
    viewSite: "查看前台",
    whatsApp: "WhatsApp",
    whatsAppLink: "WhatsApp 链接",
    within30: "30 天内",
    within90: "90 天内",
    aiImage: "AI Image",
    referenceImage: "Reference Image",
    cadSupported: "CAD",
    saving: "Saving...",
    yes: "是",
    journeyDetails: [
      "提交产品概念、AI 图片、手绘草图、参考产品或 CAD 文件。",
      "我们评估可制造性、材料、生产方式、MOQ 和项目风险。",
      "为你的项目匹配中国合适的制造伙伴。",
      "协助协调打样、生产、沟通和验货。",
      "协助包装、文件及交付至客户指定的中国境内货运代理。"
    ],
    footerLine: "我们不只是制造产品，我们帮助想法落地。",
    trustBadges: ["产品开发", "制造伙伴匹配", "样品管理", "质量检查", "生产跟进", "发货支持"],
    trustCards: [
      ["透明价格", "你直接向制造方付款。"],
      ["专属项目经理", "一个联系人跟进整个项目。"],
      ["风险降低", "样品确认和质量检查。"],
      ["全球支持", "全球物流协调。"]
    ],
    trustTitle: "为什么创业者选择 TYORA",
    pricingProofA: "先确认能不能做、MOQ、模具需求、样品路径和预算范围。",
    pricingProofB: "产品不隐藏加价。客户可查看工厂报价，并支付事先明确约定的 TYORA 服务费。",
    videoSubtitle: "了解 TYORA 如何帮助想法变成可制造产品。"
  }
} as const;

export type UiText = (typeof ui)[Language];

const statusZh: Record<LeadStatus, string> = {
  New: "新线索",
  Contacted: "已联系",
  Quoting: "报价中",
  "Sample Stage": "样品阶段",
  Production: "生产中",
  Shipment: "发货中",
  Completed: "已完成",
  Lost: "已流失"
};

export function loadLanguage(): Language {
  return "en";
}

export function saveLanguage(language: Language) {
  void language;
}

function localizeString(current: string, englishDefault: string, chineseDefault: string) {
  return current === englishDefault ? chineseDefault : current;
}

export function localizeContent(content: SiteContent, language: Language): SiteContent {
  if (language === "en") {
    return content;
  }

  return {
    ...content,
    heroTitle: localizeString(content.heroTitle, defaultContent.heroTitle, zhContent.heroTitle),
    heroSubtitle: localizeString(
      content.heroSubtitle,
      defaultContent.heroSubtitle,
      zhContent.heroSubtitle
    ),
    heroPlaceholders:
      content.heroPlaceholders.join("|") === defaultContent.heroPlaceholders.join("|")
        ? zhContent.heroPlaceholders
        : content.heroPlaceholders,
    trustBadges:
      content.trustBadges.join("|") === defaultContent.trustBadges.join("|")
        ? zhContent.trustBadges
        : content.trustBadges,
    tagline: localizeString(content.tagline, defaultContent.tagline, zhContent.tagline),
    founderText: localizeString(
      content.founderText,
      defaultContent.founderText,
      zhContent.founderText
    ),
    pricing: content.pricing.map((plan, index) => {
      const fallback = defaultContent.pricing[index];
      const zhFallback = zhContent.pricing[index];
      if (!fallback || !zhFallback) {
        return plan;
      }
      return {
        ...plan,
        name: localizeString(plan.name, fallback.name, zhFallback.name),
        price: localizeString(plan.price, fallback.price, zhFallback.price),
        note: plan.note
          ? localizeString(plan.note, fallback.note || "", zhFallback.note || "")
          : plan.note,
        features: plan.features.map((feature, featureIndex) =>
          localizeString(
            feature,
            fallback.features[featureIndex] || "",
            zhFallback.features[featureIndex] || feature
          )
        )
      };
    }),
    cases: content.cases.map((story, index) => {
      const fallback = defaultContent.cases[index];
      const zhFallback = zhContent.cases[index];
      if (!fallback || !zhFallback) {
        return story;
      }
      return {
        ...story,
        name: localizeString(story.name, fallback.name, zhFallback.name),
        concept: localizeString(story.concept, fallback.concept, zhFallback.concept),
        prototype: localizeString(story.prototype, fallback.prototype, zhFallback.prototype),
        final: localizeString(story.final, fallback.final, zhFallback.final)
      };
    })
  };
}

export function translateStatus(status: LeadStatus, language: Language) {
  return language === "zh" ? statusZh[status] : status;
}
