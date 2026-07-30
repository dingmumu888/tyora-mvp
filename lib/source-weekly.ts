import type { PublicLanguage } from "@/lib/public-i18n";

export const sourceWeeklyStatuses = ["DRAFT", "LIVE", "UNPUBLISHED"] as const;
export type SourceWeeklyStatus = (typeof sourceWeeklyStatuses)[number];

export type PublicSourceWeeklyProduct = {
  id: string;
  productCode: string;
  title: string;
  titleZh?: string;
  summary?: string;
  summaryZh?: string;
  factoryPrice?: string;
  moq?: string;
  imageUrl: string;
  interestCount: number;
  publishedAt?: string;
  expiresAt?: string;
};

export type AdminSourceWeeklyProduct = PublicSourceWeeklyProduct & {
  imageObjectPath: string;
  status: SourceWeeklyStatus;
  purgeAt?: string;
  createdAt: string;
  updatedAt: string;
};

type SourceWeeklyCopy = {
  eyebrow: string;
  title: string;
  description: string;
  specificProduct: string;
  estimatedFactoryPrice: string;
  moq: string;
  updated: string;
  interested: string;
  cta: string;
  loading: string;
  emptyTitle: string;
  emptyDescription: string;
  unableToOpen: string;
};

export const sourceWeeklyCopy: Record<PublicLanguage, SourceWeeklyCopy> = {
  en: {
    eyebrow: "TYORA WEEKLY PICKS",
    title: "This week's hot products",
    description: "Fresh product opportunities selected for online sellers and retail buyers. Updated every week.",
    specificProduct: "Already have a product in mind?",
    estimatedFactoryPrice: "Est. factory price",
    moq: "MOQ",
    updated: "Updated",
    interested: "people interested",
    cta: "Get price & factory details",
    loading: "Loading this week's products...",
    emptyTitle: "This week's picks are being prepared.",
    emptyDescription: "New product opportunities will appear here after TYORA completes the supplier check.",
    unableToOpen: "Unable to open WhatsApp. Please try again."
  },
  "zh-CN": {
    eyebrow: "TYORA 每周选品",
    title: "本周爆款",
    description: "为电商卖家和实体店买家筛选的新产品机会，每周更新。",
    specificProduct: "已经有想找的产品？",
    estimatedFactoryPrice: "参考出厂价",
    moq: "起订量",
    updated: "更新时间",
    interested: "人对此感兴趣",
    cta: "获取价格与工厂资料",
    loading: "正在加载本周产品……",
    emptyTitle: "本周选品正在准备中。",
    emptyDescription: "TYORA 完成供应商核查后，新的产品机会会显示在这里。",
    unableToOpen: "暂时无法打开 WhatsApp，请重试。"
  },
  es: {
    eyebrow: "SELECCIÓN SEMANAL DE TYORA",
    title: "Productos destacados de esta semana",
    description: "Nuevas oportunidades para vendedores en línea y compradores minoristas. Actualización semanal.",
    specificProduct: "¿Ya tienes un producto en mente?",
    estimatedFactoryPrice: "Precio estimado de fábrica",
    moq: "Pedido mínimo",
    updated: "Actualizado",
    interested: "personas interesadas",
    cta: "Obtener precio y datos de fábrica",
    loading: "Cargando los productos de esta semana...",
    emptyTitle: "Estamos preparando la selección semanal.",
    emptyDescription: "Las nuevas oportunidades aparecerán aquí tras la verificación de proveedores.",
    unableToOpen: "No se pudo abrir WhatsApp. Inténtalo de nuevo."
  },
  fr: {
    eyebrow: "SÉLECTION HEBDOMADAIRE TYORA",
    title: "Produits tendance de la semaine",
    description: "De nouvelles opportunités pour vendeurs en ligne et détaillants, mises à jour chaque semaine.",
    specificProduct: "Vous avez déjà un produit en tête ?",
    estimatedFactoryPrice: "Prix usine estimé",
    moq: "Commande min.",
    updated: "Mis à jour",
    interested: "personnes intéressées",
    cta: "Obtenir prix et informations usine",
    loading: "Chargement des produits de la semaine...",
    emptyTitle: "La sélection de la semaine est en préparation.",
    emptyDescription: "Les nouvelles opportunités apparaîtront après vérification des fournisseurs.",
    unableToOpen: "Impossible d’ouvrir WhatsApp. Réessayez."
  },
  de: {
    eyebrow: "TYORA WOCHENAUSWAHL",
    title: "Trendprodukte dieser Woche",
    description: "Neue Produktchancen für Onlinehändler und Einzelhandel, wöchentlich aktualisiert.",
    specificProduct: "Sie haben bereits ein Produkt im Sinn?",
    estimatedFactoryPrice: "Geschätzter Werkspreis",
    moq: "Mindestmenge",
    updated: "Aktualisiert",
    interested: "Interessenten",
    cta: "Preis & Fabrikdetails erhalten",
    loading: "Produkte dieser Woche werden geladen...",
    emptyTitle: "Die Wochenauswahl wird vorbereitet.",
    emptyDescription: "Neue Produktchancen erscheinen nach der Lieferantenprüfung.",
    unableToOpen: "WhatsApp konnte nicht geöffnet werden. Bitte erneut versuchen."
  },
  pt: {
    eyebrow: "SELEÇÃO SEMANAL TYORA",
    title: "Produtos em alta desta semana",
    description: "Novas oportunidades para vendedores online e varejistas, atualizadas semanalmente.",
    specificProduct: "Já tem um produto em mente?",
    estimatedFactoryPrice: "Preço estimado de fábrica",
    moq: "Pedido mínimo",
    updated: "Atualizado",
    interested: "pessoas interessadas",
    cta: "Obter preço e dados da fábrica",
    loading: "Carregando os produtos desta semana...",
    emptyTitle: "A seleção desta semana está sendo preparada.",
    emptyDescription: "Novas oportunidades aparecerão após a verificação dos fornecedores.",
    unableToOpen: "Não foi possível abrir o WhatsApp. Tente novamente."
  }
};

export function localizedWeeklyProduct(
  product: PublicSourceWeeklyProduct,
  language: PublicLanguage
) {
  const useChinese = language === "zh-CN";
  return {
    title: useChinese && product.titleZh ? product.titleZh : product.title,
    summary: useChinese && product.summaryZh ? product.summaryZh : product.summary
  };
}
