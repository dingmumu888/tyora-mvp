import { defaultContent, LeadStatus, SiteContent } from "@/lib/storage";

export type Language = "en" | "zh";

export const languageKey = "idea2product-language";

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
      name: "制造评估",
      subtitle: "包含工厂匹配",
      priceLabel: "一次性项目启动费",
      price: "$149 USD",
      description: "适合希望在工厂介绍后自行管理生产的创业者。",
      features: ["制造可行性评估", "工厂匹配", "最多 5 家合适工厂推荐", "工厂信息和联系方式", "如果没有找到合适工厂，继续推荐工厂"],
      exclusions: ["工厂沟通", "价格谈判", "样品检查", "生产跟进", "工厂审核", "发货协调"],
      bottomNote: "我们介绍合适工厂后，你将直接与工厂合作。"
    },
    {
      ...defaultContent.pricing[1],
      name: "全程项目管理",
      subtitle: "我们成为你在中国的制造代表。",
      badge: "推荐",
      priceLabel: "项目启动",
      price: "$149 USD",
      priceSuffix: "+\n定制服务费",
      description: "我们代表你管理制造流程。\n\n你仍然掌控并审批关键决策。",
      highlightBanner: "我们保护你的时间、预算和产品。",
      note: "定制服务费\n生产开始前报价。",
      features: ["包含制造评估的全部内容", "工厂沟通", "需求确认", "工厂验证（需要时）", "价格谈判", "样品检查", "生产跟进", "质量跟进", "发货协调"]
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
      ["Logistics Support", "Coordinate packaging, documents, and global delivery."]
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
      "TYORA supports product development from validation and planning to production, quality assurance, and delivery.",
    pricingSubtitle: "Choose the level of support that's right for your project.",
    pricingTitle: "Choose How You'd Like to Work With TYORA",
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
    seeEditable: "Each project moves from concept to prototype to final product.",
    sketch: "Sketch",
    status: "Status",
    startWhatsAppChat: "Start WhatsApp Chat",
    submitIdea: "Submit Your Idea",
    supplierMatching: "Manufacturing Partner",
    timeline: "Timeline",
    thirtySecond: "30-second overview",
    uploadDesign: "Upload Design",
    uploadIdeaSubtitle: "An AI image, sketch, reference photo or CAD file is enough to get started.",
    uploadYourIdea: "Upload your idea",
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
      "We coordinate packaging, logistics, and worldwide delivery."
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
      ["Transparent Pricing", "You pay manufacturers directly."],
      ["Dedicated Project Manager", "One contact throughout the project."],
      ["Risk Reduction", "Prototype verification and quality inspections."],
      ["Global Support", "Worldwide logistics coordination."]
    ],
    trustTitle: "Why Entrepreneurs Choose TYORA",
    pricingProofA: "Choose the level of support that fits your project.",
    pricingProofB:
      "Whether you manage production yourself or prefer TYORA to manage everything, you'll always receive transparent advice and independent factory recommendations.",
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
      ["物流支持", "协调包装、文件和全球交付。"]
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
      "TYORA 支持从产品验证、制造规划到生产、质量保障和交付的产品开发流程。",
    pricingSubtitle: "选择适合你项目的支持级别。",
    pricingTitle: "选择你希望如何与 TYORA 合作",
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
    uploadYourIdea: "Upload your idea",
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
      "协助包装、物流协调和全球交付。"
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
    pricingProofA: "选择适合你项目的支持级别。",
    pricingProofB: "无论你自行管理生产，还是希望 TYORA 全程管理，你都会获得透明建议和独立工厂推荐。",
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

export function saveLanguage(_language: Language) {
  return;
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
