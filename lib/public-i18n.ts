import type { HomepageContent } from "@/lib/storage";

export const publicLanguageStorageKey = "tyora-public-language";
export const publicLanguageQueryKey = "lang";

export const publicLanguages = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "zh-CN", label: "简体中文", shortLabel: "中" },
  { code: "es", label: "Español", shortLabel: "ES" },
  { code: "fr", label: "Français", shortLabel: "FR" },
  { code: "de", label: "Deutsch", shortLabel: "DE" },
  { code: "pt", label: "Português", shortLabel: "PT" }
] as const;

export type PublicLanguage = (typeof publicLanguages)[number]["code"];

type HomeTranslation = {
  navigation: Record<string, string>;
  communityEyebrow: string;
  communityTitle: string;
  communityDescription: string;
  communityCtaText: string;
  communityEmptyTitle: string;
  communityEmptyBody: string;
  postIdea: string;
  sourceProduct: string;
  communityIdea: string;
  tyoraReview: string;
  openIdea: string;
  viewCase: string;
  recent: string;
  campaign: {
    eyebrow: string;
    badge: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
    disclosure: string;
  };
  assessment: {
    eyebrow: string;
    title: string;
    description: string;
    points: string[];
  };
  pathsTitle: string;
  pathsDescription: string;
  paths: Record<string, { title: string; description: string; ctaText: string }>;
  categoriesTitle: string;
  categoriesNote: string;
  categories: Record<string, { name: string; description: string }>;
  categoryLabel: string;
  source: {
    eyebrow: string;
    title: string;
    description: string;
    ctaText: string;
    steps: Array<{ title: string; description: string }>;
  };
  final: {
    eyebrow: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
};

type CommonTranslation = {
  chooseLanguage: string;
  search: string;
  searchResults: string;
  noResults: string;
  emailLogin: string;
  rememberLogin: string;
  editProfile: string;
  profile: string;
  privacy: string;
  terms: string;
  serviceScope: string;
  myTyora: string;
  home: string;
  ideas: string;
  source: string;
  submit: string;
  account: string;
  publicIdea: string;
  publicIdeaSubtitle: string;
  privateCustom: string;
  privateCustomSubtitle: string;
  sourceExisting: string;
  sourceExistingSubtitle: string;
};

export type PublicLocaleCopy = {
  common: CommonTranslation;
  home: HomeTranslation;
};

const en: PublicLocaleCopy = {
  common: {
    chooseLanguage: "Choose language",
    search: "Search",
    searchResults: "Search results",
    noResults: "No results found.",
    emailLogin: "Email Login",
    rememberLogin: "Stay signed in on this browser for 30 days. Sign out when using a shared device.",
    editProfile: "Edit profile",
    profile: "Profile",
    privacy: "Privacy",
    terms: "Terms",
    serviceScope: "Service Scope",
    myTyora: "My TYORA",
    home: "Home",
    ideas: "Ideas",
    source: "Source",
    submit: "Submit",
    account: "Account",
    publicIdea: "Public Idea",
    publicIdeaSubtitle: "Share a product idea for community and TYORA review.",
    privateCustom: "Private Custom Review",
    privateCustomSubtitle: "Send a confidential concept directly to TYORA.",
    sourceExisting: "Source Existing Product",
    sourceExistingSubtitle: "Upload a product reference for supplier check."
  },
  home: {
    navigation: {
      ideas: "Ideas",
      custom: "Custom Manufacturing",
      source: "Source Products",
      process: "How It Works",
      pricing: "Pricing",
      account: "My TYORA"
    },
    communityEyebrow: "Ideas & Manufacturing Evidence",
    communityTitle: "See what people want to build and how TYORA reviews it.",
    communityDescription: "This feed combines eligible public community ideas with clearly labelled TYORA-owned case content.",
    communityCtaText: "Browse All Ideas",
    communityEmptyTitle: "No eligible public ideas yet.",
    communityEmptyBody: "TYORA cases and current product campaigns remain available while the community feed is empty.",
    postIdea: "Post Your Idea",
    sourceProduct: "Source a Product",
    communityIdea: "Community Idea",
    tyoraReview: "TYORA Review",
    openIdea: "Open Idea",
    viewCase: "View TYORA Case",
    recent: "Recently",
    campaign: {
      eyebrow: "Current Hot-Product Campaign",
      badge: "Stress-relief desk toy",
      title: "Build the next tactile desk toy.",
      description: "Upload your fidget, stress-relief, or desk-toy concept. TYORA reviews feasibility, likely cost range, and MOQ before you decide whether to develop it.",
      primary: "Upload Your Idea",
      secondary: "View Manufacturing Cases",
      disclosure: "TYORA campaign concept. Manufacturing review required."
    },
    assessment: {
      eyebrow: "Initial Manufacturing Assessment",
      title: "Know what is realistic before spending on development.",
      description: "TYORA gives a limited early view of the manufacturing path using the product information you provide.",
      points: ["Manufacturing feasibility", "Estimated cost range", "Estimated MOQ"]
    },
    pathsTitle: "Choose the right starting point.",
    pathsDescription: "Start publicly with an idea, privately with custom development, or with an existing product reference.",
    paths: {
      ideas: { title: "Ideas", description: "Share an AI design, sketch, or reference image for an initial manufacturing assessment.", ctaText: "Upload Your Idea" },
      source: { title: "Source", description: "Upload an existing product and let TYORA check suitable China supplier options.", ctaText: "Find a Supplier" },
      custom: { title: "Custom", description: "Send a confidential product concept for private manufacturing review and development support.", ctaText: "Start Custom Project" }
    },
    categoriesTitle: "Product Categories TYORA Reviews",
    categoriesNote: "TYORA initially reviews non-powered accessories, desktop products, and branded gifts. Compliance-sensitive products require separate review.",
    categories: {
      "phone-accessories": { name: "Phone & Device Accessories", description: "Non-powered cases, stands, mounts, cable organizers, and related accessories." },
      "desktop-office": { name: "Desktop & Office Accessories", description: "Organizers, risers, stands, tactile desk products, and workplace tools." },
      "custom-gifts": { name: "Custom Gifts", description: "Branded gifts, promotional products, presentation packaging, and keepsakes." }
    },
    categoryLabel: "TYORA Category",
    source: {
      eyebrow: "Source Existing Products",
      title: "Already found a product? Check the supplier path.",
      description: "Upload a photo or link. TYORA checks product fit, suitable supplier options, and estimated China factory pricing.",
      ctaText: "Request Product Match",
      steps: [
        { title: "Upload a reference", description: "Send product photos or a link with the target quantity." },
        { title: "Confirm the requirement", description: "TYORA reviews the product details and supplier fit." },
        { title: "Choose the next step", description: "Continue with factory introduction or managed sourcing." }
      ]
    },
    final: {
      eyebrow: "Ready for the next manufacturing decision?",
      title: "Start with the product information you already have.",
      description: "A sketch, AI image, product photo, or short description is enough to begin the right TYORA path.",
      primary: "Upload Your Idea",
      secondary: "Start Private Custom Review"
    }
  }
};

const zhCN: PublicLocaleCopy = {
  common: {
    chooseLanguage: "选择语言", search: "搜索", searchResults: "搜索结果", noResults: "未找到结果。", emailLogin: "邮箱登录",
    rememberLogin: "登录成功后，此浏览器将保持登录 30 天。使用公共设备时请记得退出登录。",
    editProfile: "编辑资料",
    profile: "个人资料", privacy: "隐私政策", terms: "使用条款", serviceScope: "服务范围", myTyora: "我的 TYORA",
    home: "首页", ideas: "创意", source: "找货", submit: "发布", account: "账户",
    publicIdea: "公开创意", publicIdeaSubtitle: "分享产品创意，获得社区和 TYORA 的评估。",
    privateCustom: "私密定制评估", privateCustomSubtitle: "将保密产品概念直接发送给 TYORA。",
    sourceExisting: "寻找现有产品", sourceExistingSubtitle: "上传产品参考，核查供应商。"
  },
  home: {
    navigation: { ideas: "创意案例", custom: "定制生产", source: "产品找货", process: "服务流程", pricing: "价格", account: "我的 TYORA" },
    communityEyebrow: "创意与制造案例",
    communityTitle: "看看大家想做什么，以及 TYORA 如何进行制造评估。",
    communityDescription: "这里汇集通过审核的公开创意，以及明确标注的 TYORA 自有案例。",
    communityCtaText: "浏览全部创意", communityEmptyTitle: "暂时还没有符合条件的公开创意。",
    communityEmptyBody: "社区内容为空时，您仍可查看 TYORA 案例和当前产品活动。",
    postIdea: "发布你的创意", sourceProduct: "寻找现有产品", communityIdea: "社区创意", tyoraReview: "TYORA 评估",
    openIdea: "查看创意", viewCase: "查看 TYORA 案例", recent: "刚刚",
    campaign: {
      eyebrow: "当前热门产品活动", badge: "解压桌面玩具", title: "打造下一款有触感的桌面玩具。",
      description: "上传你的指尖玩具、解压玩具或桌面玩具概念。TYORA 会先评估可制造性、可能的成本区间和起订量，再由你决定是否继续开发。",
      primary: "上传你的创意", secondary: "查看制造案例", disclosure: "TYORA 活动概念，需经过制造评估。"
    },
    assessment: {
      eyebrow: "初步制造评估", title: "投入开发费用前，先了解什么是现实可行的。",
      description: "TYORA 根据你提供的产品信息，对制造路径进行有限的早期判断。",
      points: ["制造可行性", "预计成本区间", "预计起订量"]
    },
    pathsTitle: "选择适合你的起点。",
    pathsDescription: "你可以公开发布创意、私密进行定制开发，或从现有产品参考开始找货。",
    paths: {
      ideas: { title: "创意", description: "分享 AI 设计、草图或参考图片，获得初步制造评估。", ctaText: "上传创意" },
      source: { title: "找货", description: "上传现有产品，由 TYORA 核查合适的中国供应商方案。", ctaText: "寻找供应商" },
      custom: { title: "定制", description: "私密提交产品概念，获得制造评估与开发支持。", ctaText: "启动定制项目" }
    },
    categoriesTitle: "TYORA 可评估的产品类别",
    categoriesNote: "现阶段优先评估非通电配件、桌面产品和品牌礼品；涉及合规的产品需单独审核。",
    categories: {
      "phone-accessories": { name: "手机与设备配件", description: "非通电保护壳、支架、固定座、理线器及相关配件。" },
      "desktop-office": { name: "桌面与办公配件", description: "收纳、增高架、支架、触感桌面产品及办公工具。" },
      "custom-gifts": { name: "定制礼品", description: "品牌礼品、促销品、展示包装和纪念品。" }
    },
    categoryLabel: "TYORA 产品类别",
    source: {
      eyebrow: "寻找现有产品", title: "已经找到产品？先核查供应商路径。",
      description: "上传图片或链接，TYORA 将核查产品匹配度、合适的供应商方案和预估中国工厂价格。",
      ctaText: "申请产品匹配",
      steps: [
        { title: "上传参考", description: "发送产品图片或链接，并说明目标数量。" },
        { title: "确认需求", description: "TYORA 核查产品细节及供应商匹配度。" },
        { title: "选择下一步", description: "继续选择工厂介绍或托管采购。" }
      ]
    },
    final: {
      eyebrow: "准备做出下一步制造决定了吗？", title: "从你现有的产品信息开始。",
      description: "草图、AI 图片、产品照片或简短描述，都足以开始合适的 TYORA 路径。",
      primary: "上传你的创意", secondary: "开始私密定制评估"
    }
  }
};

const es: PublicLocaleCopy = {
  common: {
    chooseLanguage: "Elegir idioma", search: "Buscar", searchResults: "Resultados de búsqueda", noResults: "No se encontraron resultados.", emailLogin: "Acceso por email",
    rememberLogin: "Mantén la sesión iniciada en este navegador durante 30 días. Cierra la sesión en dispositivos compartidos.",
    editProfile: "Editar perfil",
    profile: "Perfil", privacy: "Privacidad", terms: "Términos", serviceScope: "Alcance del servicio", myTyora: "Mi TYORA",
    home: "Inicio", ideas: "Ideas", source: "Abastecer", submit: "Publicar", account: "Cuenta",
    publicIdea: "Idea pública", publicIdeaSubtitle: "Comparte una idea para que la comunidad y TYORA la revisen.",
    privateCustom: "Revisión privada", privateCustomSubtitle: "Envía un concepto confidencial directamente a TYORA.",
    sourceExisting: "Buscar un producto", sourceExistingSubtitle: "Sube una referencia para verificar proveedores."
  },
  home: {
    navigation: { ideas: "Ideas", custom: "Fabricación a medida", source: "Buscar productos", process: "Cómo funciona", pricing: "Precios", account: "Mi TYORA" },
    communityEyebrow: "Ideas y evidencia de fabricación",
    communityTitle: "Descubre lo que otros quieren fabricar y cómo lo evalúa TYORA.",
    communityDescription: "Este contenido reúne ideas públicas aprobadas y casos propios de TYORA claramente identificados.",
    communityCtaText: "Ver todas las ideas", communityEmptyTitle: "Aún no hay ideas públicas elegibles.",
    communityEmptyBody: "Mientras tanto, puedes explorar los casos y campañas actuales de TYORA.",
    postIdea: "Publica tu idea", sourceProduct: "Buscar un producto", communityIdea: "Idea de la comunidad", tyoraReview: "Evaluación de TYORA",
    openIdea: "Abrir idea", viewCase: "Ver caso de TYORA", recent: "Recientemente",
    campaign: {
      eyebrow: "Campaña de producto destacada", badge: "Juguete antiestrés de escritorio", title: "Crea el próximo juguete táctil de escritorio.",
      description: "Sube tu concepto de juguete antiestrés o de escritorio. TYORA evalúa viabilidad, coste probable y cantidad mínima antes de que decidas desarrollarlo.",
      primary: "Sube tu idea", secondary: "Ver casos de fabricación", disclosure: "Concepto de campaña de TYORA. Requiere evaluación de fabricación."
    },
    assessment: {
      eyebrow: "Evaluación inicial de fabricación", title: "Descubre qué es viable antes de invertir en desarrollo.",
      description: "TYORA ofrece una primera orientación limitada sobre la ruta de fabricación con la información que facilites.",
      points: ["Viabilidad de fabricación", "Rango de coste estimado", "Cantidad mínima estimada"]
    },
    pathsTitle: "Elige el mejor punto de partida.",
    pathsDescription: "Empieza públicamente con una idea, de forma privada con desarrollo a medida o con una referencia de producto existente.",
    paths: {
      ideas: { title: "Ideas", description: "Comparte un diseño de IA, boceto o imagen para una evaluación inicial de fabricación.", ctaText: "Sube tu idea" },
      source: { title: "Abastecimiento", description: "Sube un producto existente para que TYORA busque proveedores adecuados en China.", ctaText: "Buscar proveedor" },
      custom: { title: "A medida", description: "Envía un concepto confidencial para una revisión privada y apoyo de desarrollo.", ctaText: "Iniciar proyecto" }
    },
    categoriesTitle: "Categorías que evalúa TYORA",
    categoriesNote: "TYORA evalúa primero accesorios sin alimentación, productos de escritorio y regalos de marca. Los productos regulados requieren revisión aparte.",
    categories: {
      "phone-accessories": { name: "Accesorios para teléfonos y dispositivos", description: "Fundas, soportes, monturas y organizadores de cables sin alimentación." },
      "desktop-office": { name: "Accesorios de escritorio y oficina", description: "Organizadores, elevadores, soportes y herramientas de trabajo." },
      "custom-gifts": { name: "Regalos personalizados", description: "Regalos de marca, artículos promocionales, embalajes y recuerdos." }
    },
    categoryLabel: "Categoría TYORA",
    source: {
      eyebrow: "Buscar productos existentes", title: "¿Ya encontraste un producto? Comprueba la ruta de proveedores.",
      description: "Sube una foto o enlace. TYORA revisa el producto, las opciones de proveedores y el precio estimado de fábrica en China.",
      ctaText: "Solicitar coincidencia",
      steps: [
        { title: "Sube una referencia", description: "Envía fotos o un enlace con la cantidad objetivo." },
        { title: "Confirma el requisito", description: "TYORA revisa los detalles y el ajuste del proveedor." },
        { title: "Elige el siguiente paso", description: "Continúa con presentación de fábrica o abastecimiento gestionado." }
      ]
    },
    final: {
      eyebrow: "¿Listo para la siguiente decisión de fabricación?", title: "Empieza con la información que ya tienes.",
      description: "Un boceto, una imagen de IA, una foto o una descripción breve bastan para comenzar.",
      primary: "Sube tu idea", secondary: "Iniciar revisión privada"
    }
  }
};

const fr: PublicLocaleCopy = {
  common: {
    chooseLanguage: "Choisir la langue", search: "Rechercher", searchResults: "Résultats de recherche", noResults: "Aucun résultat.", emailLogin: "Connexion par e-mail",
    rememberLogin: "Restez connecté sur ce navigateur pendant 30 jours. Déconnectez-vous sur un appareil partagé.",
    editProfile: "Modifier le profil",
    profile: "Profil", privacy: "Confidentialité", terms: "Conditions", serviceScope: "Périmètre du service", myTyora: "Mon TYORA",
    home: "Accueil", ideas: "Idées", source: "Sourcing", submit: "Publier", account: "Compte",
    publicIdea: "Idée publique", publicIdeaSubtitle: "Partagez une idée pour l’avis de la communauté et de TYORA.",
    privateCustom: "Étude privée", privateCustomSubtitle: "Envoyez un concept confidentiel directement à TYORA.",
    sourceExisting: "Sourcer un produit", sourceExistingSubtitle: "Ajoutez une référence pour vérifier les fournisseurs."
  },
  home: {
    navigation: { ideas: "Idées", custom: "Fabrication sur mesure", source: "Sourcing produit", process: "Fonctionnement", pricing: "Tarifs", account: "Mon TYORA" },
    communityEyebrow: "Idées et preuves de fabrication",
    communityTitle: "Découvrez ce que les créateurs veulent fabriquer et comment TYORA l’évalue.",
    communityDescription: "Ce fil réunit des idées publiques approuvées et des cas TYORA clairement identifiés.",
    communityCtaText: "Voir toutes les idées", communityEmptyTitle: "Aucune idée publique admissible pour le moment.",
    communityEmptyBody: "Les cas et campagnes TYORA restent accessibles en attendant.",
    postIdea: "Publier votre idée", sourceProduct: "Sourcer un produit", communityIdea: "Idée de la communauté", tyoraReview: "Avis TYORA",
    openIdea: "Voir l’idée", viewCase: "Voir le cas TYORA", recent: "Récemment",
    campaign: {
      eyebrow: "Campagne produit du moment", badge: "Objet de bureau antistress", title: "Créez le prochain objet tactile de bureau.",
      description: "Ajoutez votre concept de fidget ou d’objet antistress. TYORA étudie la faisabilité, le coût probable et la quantité minimale avant votre décision.",
      primary: "Ajouter votre idée", secondary: "Voir les cas de fabrication", disclosure: "Concept de campagne TYORA. Étude de fabrication requise."
    },
    assessment: {
      eyebrow: "Évaluation initiale de fabrication", title: "Sachez ce qui est réaliste avant d’investir dans le développement.",
      description: "TYORA fournit une première vue limitée du parcours de fabrication à partir de vos informations.",
      points: ["Faisabilité de fabrication", "Fourchette de coût estimée", "Quantité minimale estimée"]
    },
    pathsTitle: "Choisissez le bon point de départ.",
    pathsDescription: "Commencez publiquement avec une idée, en privé avec un développement sur mesure ou avec une référence existante.",
    paths: {
      ideas: { title: "Idées", description: "Partagez un design IA, un croquis ou une image pour une première évaluation.", ctaText: "Ajouter votre idée" },
      source: { title: "Sourcing", description: "Ajoutez un produit existant afin que TYORA vérifie les fournisseurs adaptés en Chine.", ctaText: "Trouver un fournisseur" },
      custom: { title: "Sur mesure", description: "Envoyez un concept confidentiel pour une étude privée et un accompagnement.", ctaText: "Démarrer le projet" }
    },
    categoriesTitle: "Catégories étudiées par TYORA",
    categoriesNote: "TYORA étudie d’abord les accessoires non alimentés, les produits de bureau et les cadeaux de marque. Les produits réglementés sont examinés séparément.",
    categories: {
      "phone-accessories": { name: "Accessoires téléphone et appareils", description: "Coques, supports, fixations et organiseurs de câbles non alimentés." },
      "desktop-office": { name: "Accessoires de bureau", description: "Organiseurs, rehausseurs, supports et outils de travail." },
      "custom-gifts": { name: "Cadeaux personnalisés", description: "Cadeaux de marque, objets promotionnels, emballages et souvenirs." }
    },
    categoryLabel: "Catégorie TYORA",
    source: {
      eyebrow: "Sourcer un produit existant", title: "Vous avez trouvé un produit ? Vérifiez le parcours fournisseur.",
      description: "Ajoutez une photo ou un lien. TYORA vérifie le produit, les fournisseurs possibles et le prix usine estimé en Chine.",
      ctaText: "Demander une vérification",
      steps: [
        { title: "Ajoutez une référence", description: "Envoyez des photos ou un lien avec la quantité visée." },
        { title: "Confirmez le besoin", description: "TYORA vérifie les détails et l’adéquation fournisseur." },
        { title: "Choisissez la suite", description: "Continuez avec une mise en relation ou un sourcing géré." }
      ]
    },
    final: {
      eyebrow: "Prêt pour la prochaine décision de fabrication ?", title: "Commencez avec les informations déjà disponibles.",
      description: "Un croquis, une image IA, une photo ou une brève description suffit pour commencer.",
      primary: "Ajouter votre idée", secondary: "Démarrer une étude privée"
    }
  }
};

const de: PublicLocaleCopy = {
  common: {
    chooseLanguage: "Sprache wählen", search: "Suchen", searchResults: "Suchergebnisse", noResults: "Keine Ergebnisse gefunden.", emailLogin: "E-Mail-Anmeldung",
    rememberLogin: "Bleibe in diesem Browser 30 Tage angemeldet. Melde dich auf gemeinsam genutzten Geräten ab.",
    editProfile: "Profil bearbeiten",
    profile: "Profil", privacy: "Datenschutz", terms: "Bedingungen", serviceScope: "Leistungsumfang", myTyora: "Mein TYORA",
    home: "Start", ideas: "Ideen", source: "Sourcing", submit: "Veröffentlichen", account: "Konto",
    publicIdea: "Öffentliche Idee", publicIdeaSubtitle: "Teile eine Produktidee zur Prüfung durch Community und TYORA.",
    privateCustom: "Private Prüfung", privateCustomSubtitle: "Sende ein vertrauliches Konzept direkt an TYORA.",
    sourceExisting: "Produkt sourcen", sourceExistingSubtitle: "Lade eine Referenz zur Lieferantenprüfung hoch."
  },
  home: {
    navigation: { ideas: "Ideen", custom: "Sonderanfertigung", source: "Produkte sourcen", process: "So funktioniert es", pricing: "Preise", account: "Mein TYORA" },
    communityEyebrow: "Ideen und Fertigungsnachweise",
    communityTitle: "Sieh, was andere herstellen möchten und wie TYORA es bewertet.",
    communityDescription: "Dieser Feed verbindet geprüfte öffentliche Ideen mit klar gekennzeichneten TYORA-Fallbeispielen.",
    communityCtaText: "Alle Ideen ansehen", communityEmptyTitle: "Noch keine geeigneten öffentlichen Ideen.",
    communityEmptyBody: "TYORA-Fälle und aktuelle Produktkampagnen bleiben verfügbar.",
    postIdea: "Idee veröffentlichen", sourceProduct: "Produkt sourcen", communityIdea: "Community-Idee", tyoraReview: "TYORA-Bewertung",
    openIdea: "Idee öffnen", viewCase: "TYORA-Fall ansehen", recent: "Kürzlich",
    campaign: {
      eyebrow: "Aktuelle Produktkampagne", badge: "Anti-Stress-Schreibtischspielzeug", title: "Entwickle das nächste haptische Schreibtischspielzeug.",
      description: "Lade dein Fidget- oder Anti-Stress-Konzept hoch. TYORA prüft Machbarkeit, mögliche Kosten und Mindestmenge, bevor du weiterentwickelst.",
      primary: "Idee hochladen", secondary: "Fertigungsfälle ansehen", disclosure: "TYORA-Kampagnenkonzept. Fertigungsprüfung erforderlich."
    },
    assessment: {
      eyebrow: "Erste Fertigungsbewertung", title: "Kläre die Machbarkeit, bevor du in Entwicklung investierst.",
      description: "TYORA gibt anhand deiner Produktinformationen eine begrenzte erste Einschätzung des Fertigungswegs.",
      points: ["Fertigungs­machbarkeit", "Geschätzte Kostenspanne", "Geschätzte Mindestmenge"]
    },
    pathsTitle: "Wähle den richtigen Startpunkt.",
    pathsDescription: "Starte öffentlich mit einer Idee, privat mit einer Sonderentwicklung oder mit einer vorhandenen Produktreferenz.",
    paths: {
      ideas: { title: "Ideen", description: "Teile ein KI-Design, eine Skizze oder ein Referenzbild für eine erste Fertigungsbewertung.", ctaText: "Idee hochladen" },
      source: { title: "Sourcing", description: "Lade ein vorhandenes Produkt hoch und TYORA prüft passende Lieferanten in China.", ctaText: "Lieferanten finden" },
      custom: { title: "Sonderanfertigung", description: "Sende ein vertrauliches Konzept zur privaten Prüfung und Entwicklungsunterstützung.", ctaText: "Projekt starten" }
    },
    categoriesTitle: "Von TYORA geprüfte Produktkategorien",
    categoriesNote: "TYORA prüft zunächst Zubehör ohne Strom, Schreibtischprodukte und Werbegeschenke. Regulierte Produkte werden separat geprüft.",
    categories: {
      "phone-accessories": { name: "Telefon- und Gerätezubehör", description: "Hüllen, Ständer, Halterungen und Kabelorganisatoren ohne Strom." },
      "desktop-office": { name: "Schreibtisch- und Bürozubehör", description: "Organizer, Erhöhungen, Ständer und Arbeitsplatzwerkzeuge." },
      "custom-gifts": { name: "Individuelle Geschenke", description: "Werbegeschenke, Promotionartikel, Präsentationsverpackungen und Andenken." }
    },
    categoryLabel: "TYORA-Kategorie",
    source: {
      eyebrow: "Bestehende Produkte sourcen", title: "Produkt schon gefunden? Prüfe den Lieferantenweg.",
      description: "Lade ein Foto oder einen Link hoch. TYORA prüft Produktpassung, Lieferantenoptionen und geschätzte Fabrikpreise in China.",
      ctaText: "Produktprüfung anfragen",
      steps: [
        { title: "Referenz hochladen", description: "Sende Fotos oder einen Link mit der Zielmenge." },
        { title: "Anforderung bestätigen", description: "TYORA prüft Details und Lieferantenpassung." },
        { title: "Nächsten Schritt wählen", description: "Weiter mit Fabrikvermittlung oder betreutem Sourcing." }
      ]
    },
    final: {
      eyebrow: "Bereit für die nächste Fertigungsentscheidung?", title: "Beginne mit den Produktinformationen, die du schon hast.",
      description: "Eine Skizze, ein KI-Bild, ein Produktfoto oder eine kurze Beschreibung reicht für den Start.",
      primary: "Idee hochladen", secondary: "Private Prüfung starten"
    }
  }
};

const pt: PublicLocaleCopy = {
  common: {
    chooseLanguage: "Escolher idioma", search: "Pesquisar", searchResults: "Resultados da pesquisa", noResults: "Nenhum resultado encontrado.", emailLogin: "Entrar com e-mail",
    rememberLogin: "Mantenha a sessão iniciada neste navegador por 30 dias. Saia da conta em dispositivos compartilhados.",
    editProfile: "Editar perfil",
    profile: "Perfil", privacy: "Privacidade", terms: "Termos", serviceScope: "Escopo do serviço", myTyora: "Meu TYORA",
    home: "Início", ideas: "Ideias", source: "Fornecimento", submit: "Publicar", account: "Conta",
    publicIdea: "Ideia pública", publicIdeaSubtitle: "Compartilhe uma ideia para análise da comunidade e da TYORA.",
    privateCustom: "Análise privada", privateCustomSubtitle: "Envie um conceito confidencial diretamente à TYORA.",
    sourceExisting: "Encontrar produto", sourceExistingSubtitle: "Envie uma referência para verificar fornecedores."
  },
  home: {
    navigation: { ideas: "Ideias", custom: "Fabricação personalizada", source: "Encontrar produtos", process: "Como funciona", pricing: "Preços", account: "Meu TYORA" },
    communityEyebrow: "Ideias e evidências de fabricação",
    communityTitle: "Veja o que as pessoas querem fabricar e como a TYORA avalia.",
    communityDescription: "Este feed reúne ideias públicas aprovadas e casos próprios da TYORA claramente identificados.",
    communityCtaText: "Ver todas as ideias", communityEmptyTitle: "Ainda não há ideias públicas elegíveis.",
    communityEmptyBody: "Enquanto isso, os casos e campanhas atuais da TYORA continuam disponíveis.",
    postIdea: "Publique sua ideia", sourceProduct: "Encontrar um produto", communityIdea: "Ideia da comunidade", tyoraReview: "Análise da TYORA",
    openIdea: "Abrir ideia", viewCase: "Ver caso TYORA", recent: "Recentemente",
    campaign: {
      eyebrow: "Campanha de produto em destaque", badge: "Brinquedo de mesa antiestresse", title: "Crie o próximo brinquedo tátil de mesa.",
      description: "Envie seu conceito de fidget ou brinquedo antiestresse. A TYORA avalia viabilidade, custo provável e pedido mínimo antes da sua decisão.",
      primary: "Enviar sua ideia", secondary: "Ver casos de fabricação", disclosure: "Conceito de campanha TYORA. Requer análise de fabricação."
    },
    assessment: {
      eyebrow: "Avaliação inicial de fabricação", title: "Saiba o que é viável antes de investir no desenvolvimento.",
      description: "A TYORA oferece uma visão inicial limitada do caminho de fabricação com base nas informações fornecidas.",
      points: ["Viabilidade de fabricação", "Faixa de custo estimada", "Pedido mínimo estimado"]
    },
    pathsTitle: "Escolha o ponto de partida certo.",
    pathsDescription: "Comece publicamente com uma ideia, em privado com desenvolvimento personalizado ou com uma referência existente.",
    paths: {
      ideas: { title: "Ideias", description: "Compartilhe um design de IA, esboço ou imagem para uma avaliação inicial.", ctaText: "Enviar sua ideia" },
      source: { title: "Fornecimento", description: "Envie um produto existente para a TYORA verificar fornecedores adequados na China.", ctaText: "Encontrar fornecedor" },
      custom: { title: "Personalizado", description: "Envie um conceito confidencial para análise privada e apoio ao desenvolvimento.", ctaText: "Iniciar projeto" }
    },
    categoriesTitle: "Categorias avaliadas pela TYORA",
    categoriesNote: "A TYORA avalia primeiro acessórios sem alimentação, produtos de mesa e brindes de marca. Produtos regulados exigem análise separada.",
    categories: {
      "phone-accessories": { name: "Acessórios para telefone e dispositivos", description: "Capas, suportes, montagens e organizadores de cabos sem alimentação." },
      "desktop-office": { name: "Acessórios de mesa e escritório", description: "Organizadores, elevadores, suportes e ferramentas de trabalho." },
      "custom-gifts": { name: "Brindes personalizados", description: "Brindes de marca, produtos promocionais, embalagens e lembranças." }
    },
    categoryLabel: "Categoria TYORA",
    source: {
      eyebrow: "Encontrar produtos existentes", title: "Já encontrou um produto? Verifique o caminho do fornecedor.",
      description: "Envie uma foto ou link. A TYORA verifica o produto, fornecedores adequados e o preço estimado de fábrica na China.",
      ctaText: "Solicitar verificação",
      steps: [
        { title: "Envie uma referência", description: "Envie fotos ou um link com a quantidade desejada." },
        { title: "Confirme a necessidade", description: "A TYORA verifica os detalhes e a adequação do fornecedor." },
        { title: "Escolha o próximo passo", description: "Continue com indicação de fábrica ou sourcing gerenciado." }
      ]
    },
    final: {
      eyebrow: "Pronto para a próxima decisão de fabricação?", title: "Comece com as informações que você já possui.",
      description: "Um esboço, imagem de IA, foto do produto ou descrição curta é suficiente para começar.",
      primary: "Enviar sua ideia", secondary: "Iniciar análise privada"
    }
  }
};

export const publicLocaleCopy: Record<PublicLanguage, PublicLocaleCopy> = {
  en,
  "zh-CN": zhCN,
  es,
  fr,
  de,
  pt
};

export function normalizePublicLanguage(value?: string | null): PublicLanguage | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
  return publicLanguages.find((language) => language.code.toLowerCase() === normalized)?.code || null;
}

export function detectBrowserLanguage(languages: readonly string[]): PublicLanguage {
  for (const language of languages) {
    const exact = normalizePublicLanguage(language);
    if (exact) return exact;
    const base = language.split("-")[0]?.toLowerCase();
    const baseMatch = publicLanguages.find((item) => item.code.toLowerCase() === base);
    if (baseMatch) return baseMatch.code;
  }
  return "en";
}

export function localizeHomepage(homepage: HomepageContent, language: PublicLanguage): HomepageContent {
  if (language === "en") return homepage;
  const copy = publicLocaleCopy[language].home;
  return {
    ...homepage,
    navigationLinks: homepage.navigationLinks.map((link) => ({
      ...link,
      label: copy.navigation[link.id] || link.label
    })),
    campaigns: homepage.campaigns.map((campaign, index) => index === 0 ? {
      ...campaign,
      eyebrow: copy.campaign.eyebrow,
      badge: copy.campaign.badge,
      title: copy.campaign.title,
      description: copy.campaign.description,
      primaryCtaText: copy.campaign.primary,
      secondaryCtaText: copy.campaign.secondary,
      disclosure: copy.campaign.disclosure
    } : campaign),
    assessmentEyebrow: copy.assessment.eyebrow,
    assessmentTitle: copy.assessment.title,
    assessmentDescription: copy.assessment.description,
    assessmentPoints: copy.assessment.points,
    communityEyebrow: copy.communityEyebrow,
    communityTitle: copy.communityTitle,
    communityDescription: copy.communityDescription,
    communityCtaText: copy.communityCtaText,
    communityEmptyTitle: copy.communityEmptyTitle,
    communityEmptyBody: copy.communityEmptyBody,
    pathsTitle: copy.pathsTitle,
    pathsDescription: copy.pathsDescription,
    paths: homepage.paths.map((path) => {
      const translated = copy.paths[path.id];
      return translated ? { ...path, ...translated } : path;
    }),
    categoriesTitle: copy.categoriesTitle,
    categoriesNote: copy.categoriesNote,
    categories: homepage.categories.map((category) => {
      const translated = copy.categories[category.id];
      return translated ? { ...category, ...translated } : category;
    }),
    sourceEyebrow: copy.source.eyebrow,
    sourceTitle: copy.source.title,
    sourceDescription: copy.source.description,
    sourceCtaText: copy.source.ctaText,
    sourceSteps: copy.source.steps,
    finalEyebrow: copy.final.eyebrow,
    finalTitle: copy.final.title,
    finalDescription: copy.final.description,
    finalPrimaryCtaText: copy.final.primary,
    finalSecondaryCtaText: copy.final.secondary
  };
}
