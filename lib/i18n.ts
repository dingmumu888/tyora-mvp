import { defaultContent, LeadStatus, SiteContent } from "@/lib/storage";

export type Language = "en" | "zh";

export const languageKey = "idea2product-language";

export const zhContent: SiteContent = {
  ...defaultContent,
  heroTitle: "今天你想做什么产品？",
  heroSubtitle:
    "我们帮助创业者通过中国可信制造伙伴，把想法变成可制造的真实产品。",
  tagline: "把你的产品想法变成现实。",
  founderText:
    "我帮助创业者和产品创作者，通过中国制造网络把想法变成真实产品。TYORA 支持完整产品旅程：从想法验证、制造伙伴匹配，到样品确认、生产协调、质量控制和交付。",
  pricing: [
    {
      ...defaultContent.pricing[0],
      name: "免费制造可行性评估",
      price: "免费",
      features: ["产品可行性评估", "MOQ 起订量建议", "预估生产成本区间", "初步开发建议"]
    },
    {
      ...defaultContent.pricing[1],
      name: "项目开发包",
      price: "$149 项目订金",
      note: "如果项目进入生产，订金可抵扣后续服务费。",
      features: ["制造伙伴调研", "报价收集", "伙伴对比", "制造建议"]
    },
    {
      ...defaultContent.pricing[2],
      name: "生产管理",
      price: "5% 服务费",
      note: "最低 $100。无隐藏工厂加价，你始终知道真实工厂价格。",
      features: ["制造伙伴沟通", "样品协调", "质检支持", "生产跟进", "发货协调"]
    }
  ],
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
    additionalRequirements: "Additional Requirements",
    additionalRequirementsPlaceholder:
      "Materials, dimensions, logo printing, packaging, certifications, colors, functionality, etc.",
    aiGeneratedImage: "AI Generated Image",
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
    closeQuestionnaire: "Close questionnaire",
    concept: "Concept",
    contactLinks: "Contact Links",
    continue: "Continue",
    delivery: "Delivery",
    design: "Design",
    designPrompt: "Image, PDF, CAD, or rough concept",
    designType: "Design Type",
    doYouHaveDesign: "Do you already have a design?",
    email: "Email",
    estimatedBudget: "What is your estimated project budget?",
    estimatedQuantity: "Estimated Order Quantity?",
    existingReference: "Existing Product Reference",
    factoryNext: "Manufacturing fit, sample plan, target quote",
    featuresOnePerLine: "Features, one per line",
    finalProduct: "Final Product",
    founderName: "Founder name",
    founderText: "Founder text",
    fromIdea: "From Idea To Real Product.",
    helpCards: [
      ["Idea Validation", "Avoid expensive mistakes before production."],
      ["Manufacturing Partner Matching", "Connect with suitable manufacturing partners."],
      ["Production Management", "We coordinate communication, samples, and production."],
      ["Quality Assurance", "Reduce manufacturing risks before shipment."]
    ],
    helpTitle: "How TYORA Helps",
    heroBadge: "Product Development Partner for makers, sellers, and launch teams",
    homeText: "Homepage Text",
    howVideoTitle: "See How Your Idea Becomes A Product",
    image: "Image",
    immediately: "Immediately",
    inspectionVideo: "Inspection Video",
    internationalCourier: "International courier fees may apply.",
    justIdea: "Just An Idea",
    language: "中文",
    leadEmpty: "No submissions yet. Complete the homepage questionnaire to create a lead.",
    leadIntro: "Leads submitted from the chat-style questionnaire.",
    linkedIn: "LinkedIn",
    liveVideoCall: "Live Video Call",
    magneticPrompt: "I want to create a magnetic phone stand...",
    manufactureQuestion: "What would you like to manufacture?",
    manufacturePlaceholder: "Describe the product, who it is for, and what makes it different.",
    no: "No",
    note: "Note",
    packaging: "Packaging",
    pdf: "PDF",
    petPrompt: "I need a custom pet accessory...",
    photoPlaceholder: "Photo placeholder",
    planName: "Plan name",
    price: "Price",
    pricingSection: "Pricing Section",
    positioningHeadlineA: "We Don't Help You Find Factories.",
    positioningHeadlineB: "We Help You Build Products.",
    positioningText:
      "From product validation to manufacturing, quality control, and delivery, TYORA supports your entire product journey.",
    pricingSubtitle: "Simple, transparent, and project-based pricing.",
    pricingTitle: "Product Development Support",
    primaryGoal: "Primary goal",
    processVideoUrl: "Process video URL",
    production: "Production",
    productJourney: "Your Product Journey",
    projectBrief: "Product brief",
    projectIntake: "Project intake",
    projectReceived: "Project Received",
    projectReceivedText:
      "Thank you for submitting your project. A manufacturing specialist will review your requirements and contact you within 24 hours.",
    projectSubmissions: "Project Submissions",
    prototype: "Prototype",
    qualifiedConversation: "Qualified WhatsApp conversation",
    quantity: "Quantity",
    quoteDeposit: "$1,000-$5,000",
    researchingOnly: "Researching Only",
    restoreDefaults: "Restore Defaults",
    saveChanges: "Save Changes",
    saveFailed: "Save failed. The browser storage may be full; try removing a large uploaded image.",
    saved: "Saved",
    sample: "Sample",
    sampleNeed: "Do you need a sample before production?",
    sampleReview: "How would you like to review your sample?",
    sampleStage: "Sample Stage",
    sampleVerification: "Sample Verification",
    seeEditable: "Each project moves from concept to prototype to final product.",
    shipSample: "Ship Sample To Me",
    sketch: "Sketch",
    startTimeline: "When would you like to start production?",
    status: "Status",
    submitIdea: "Submit Your Idea",
    submitProject: "Submit Project",
    supplierMatching: "Manufacturing Partner",
    timeline: "Timeline",
    thirtySecond: "30-second overview",
    uploadDesign: "Upload Design",
    uploadFounderPhoto: "Upload founder photo",
    videoFounder: "Video & Founder",
    videoUrlPlaceholder: "Paste YouTube, Vimeo, or hosted video URL",
    viewSite: "View site",
    whatsApp: "WhatsApp",
    whatsAppLink: "WhatsApp link",
    within30: "Within 30 Days",
    within90: "Within 90 Days",
    yes: "Yes",
    journeyDetails: [
      "Submit your product concept, AI image, sketch, reference product, or CAD file.",
      "We review manufacturability, materials, production method, MOQ, and project risks.",
      "We match your project with suitable manufacturing partners in China.",
      "We help coordinate sampling, production, communication, and inspection.",
      "We assist with packaging, logistics coordination, and global delivery."
    ],
    footerLine: "We don't just manufacture products. We help bring ideas to life.",
    trustBadges: [
      "Product Development Partner",
      "Transparent Factory Pricing",
      "Dedicated Project Manager",
      "Worldwide Delivery Support"
    ],
    trustCards: [
      ["Transparent Pricing", "You pay manufacturers directly."],
      ["Dedicated Project Manager", "One contact throughout the project."],
      ["Risk Reduction", "Prototype verification and quality inspections."],
      ["Global Support", "Worldwide logistics coordination."]
    ],
    trustTitle: "Why Entrepreneurs Choose TYORA",
    pricingProofA: "No hidden factory markups.",
    pricingProofB: "You always know the real factory price.",
    videoSubtitle: "Watch how TYORA helps transform ideas into manufacturable products."
  },
  zh: {
    admin: "后台",
    additionalRequirements: "其他需求",
    additionalRequirementsPlaceholder:
      "材质、尺寸、Logo 印刷、包装、认证、颜色、功能要求等。",
    aiGeneratedImage: "AI 生成图",
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
    closeQuestionnaire: "关闭问卷",
    concept: "概念图",
    contactLinks: "联系方式",
    continue: "继续",
    delivery: "交付",
    design: "设计",
    designPrompt: "图片、PDF、CAD 或粗略想法",
    designType: "设计类型",
    doYouHaveDesign: "你现在已有设计资料吗？",
    email: "邮箱",
    estimatedBudget: "你的项目预算大概是多少？",
    estimatedQuantity: "预计订单数量？",
    existingReference: "现有产品参考",
    factoryNext: "制造适配、样品方案、目标报价",
    featuresOnePerLine: "功能/包含内容，每行一条",
    finalProduct: "成品",
    founderName: "创始人姓名",
    founderText: "创始人介绍",
    fromIdea: "从想法到真实产品。",
    helpCards: [
      ["想法验证", "在生产前避免昂贵错误。"],
      ["制造伙伴匹配", "连接合适的制造伙伴。"],
      ["生产管理", "我们协调沟通、样品和生产。"],
      ["质量保障", "在出货前降低制造风险。"]
    ],
    helpTitle: "TYORA 如何帮助你",
    heroBadge: "为创客、卖家和新品团队打造的产品开发伙伴",
    homeText: "首页文案",
    howVideoTitle: "看看你的想法如何变成产品",
    image: "图片",
    immediately: "立即开始",
    inspectionVideo: "验货视频",
    internationalCourier: "国际快递费用可能另行产生。",
    justIdea: "只有一个想法",
    language: "EN",
    leadEmpty: "还没有提交记录。完成首页问卷后，这里会出现线索。",
    leadIntro: "来自聊天式问卷的项目线索。",
    linkedIn: "LinkedIn",
    liveVideoCall: "视频会议",
    magneticPrompt: "我想做一个磁吸手机支架...",
    manufactureQuestion: "你想生产什么产品？",
    manufacturePlaceholder: "描述产品、目标用户，以及它有什么不同。",
    no: "否",
    note: "备注",
    packaging: "包装",
    pdf: "PDF",
    petPrompt: "我需要一个定制宠物配件...",
    photoPlaceholder: "照片占位",
    planName: "方案名称",
    price: "价格",
    pricingSection: "价格模块",
    positioningHeadlineA: "我们不是帮你找工厂。",
    positioningHeadlineB: "我们帮你把产品做出来。",
    positioningText:
      "从产品验证到制造、质量控制和交付，TYORA 支持你的完整产品旅程。",
    pricingSubtitle: "简单、透明、按项目计费。",
    pricingTitle: "产品开发支持",
    primaryGoal: "核心目标",
    processVideoUrl: "流程视频链接",
    production: "生产",
    productJourney: "你的产品旅程",
    projectBrief: "产品简报",
    projectIntake: "项目问卷",
    projectReceived: "项目已收到",
    projectReceivedText: "感谢提交项目。制造顾问会审核你的需求，并在 24 小时内联系你。",
    projectSubmissions: "项目提交记录",
    prototype: "样品",
    qualifiedConversation: "获得高质量 WhatsApp 咨询",
    quantity: "数量",
    quoteDeposit: "$1,000-$5,000",
    researchingOnly: "只是调研",
    restoreDefaults: "恢复默认",
    saveChanges: "保存修改",
    saveFailed: "保存失败。浏览器存储可能已满，请尝试移除较大的上传图片。",
    saved: "已保存",
    sample: "样品",
    sampleNeed: "量产前需要先做样品吗？",
    sampleReview: "你希望如何确认样品？",
    sampleStage: "样品阶段",
    sampleVerification: "样品确认",
    seeEditable: "每个项目都从概念走向样品，再走向真实成品。",
    shipSample: "寄样给我",
    sketch: "手绘草图",
    startTimeline: "你希望什么时候开始生产？",
    status: "状态",
    submitIdea: "提交你的想法",
    submitProject: "提交项目",
    supplierMatching: "制造伙伴",
    timeline: "时间计划",
    thirtySecond: "30 秒流程视频",
    uploadDesign: "上传设计",
    uploadFounderPhoto: "上传创始人照片",
    videoFounder: "视频与创始人",
    videoUrlPlaceholder: "粘贴 YouTube、Vimeo 或托管视频链接",
    viewSite: "查看前台",
    whatsApp: "WhatsApp",
    whatsAppLink: "WhatsApp 链接",
    within30: "30 天内",
    within90: "90 天内",
    yes: "是",
    journeyDetails: [
      "提交产品概念、AI 图片、手绘草图、参考产品或 CAD 文件。",
      "我们评估可制造性、材料、生产方式、MOQ 和项目风险。",
      "为你的项目匹配中国合适的制造伙伴。",
      "协助协调打样、生产、沟通和验货。",
      "协助包装、物流协调和全球交付。"
    ],
    footerLine: "我们不只是制造产品，我们帮助想法落地。",
    trustBadges: ["产品开发伙伴", "透明工厂价格", "专属项目经理", "全球交付支持"],
    trustCards: [
      ["透明价格", "你直接向制造方付款。"],
      ["专属项目经理", "一个联系人跟进整个项目。"],
      ["风险降低", "样品确认和质量检查。"],
      ["全球支持", "全球物流协调。"]
    ],
    trustTitle: "为什么创业者选择 TYORA",
    pricingProofA: "无隐藏工厂加价。",
    pricingProofB: "你始终知道真实工厂价格。",
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
