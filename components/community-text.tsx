"use client";

import { usePublicLanguage } from "@/components/public-language-provider";
import type { PublicLanguage } from "@/lib/public-i18n";

type Values = Record<string, string | number>;

const zhCN: Record<string, string> = {
  Ideas: "创意",
  Manufacturing: "制造",
  Source: "找货",
  Pricing: "价格",
  "Creator Community": "创作者社区",
  "Turn practical feedback into manufacturing confidence.": "把真实建议转化为制造产品的信心。",
  "Start a Discussion": "发起讨论",
  "Start a discussion": "发起讨论",
  "All Discussions": "全部讨论",
  "Ideas & Feedback": "创意与反馈",
  "Idea Feedback": "创意反馈",
  "Design Feedback": "设计反馈",
  "Cost & MOQ": "成本与起订量",
  "Manufacturing Advice": "制造建议",
  "Progress Update": "进展更新",
  Materials: "材料",
  Prototyping: "原型打样",
  "Find a Supplier": "寻找供应商",
  "Product stage": "产品阶段",
  Concept: "概念",
  Design: "设计",
  Review: "评估",
  Prototype: "原型",
  "Pre-production": "量产准备",
  Production: "生产",
  "Browse topics": "浏览话题",
  "Product creator community": "产品创作者社区",
  "Build it with confidence": "更有信心地把产品做出来",
  "Get practical feedback from buyers, makers, and TYORA manufacturing experts.": "获得买家、创作者和 TYORA 制造专家的实用建议。",
  "{count} ideas": "{count} 个创意",
  "{count} reviewed": "{count} 个已评估",
  "Search ideas, products, or manufacturing questions": "搜索创意、产品或制造问题",
  "Search discussions": "搜索讨论",
  Hot: "热门",
  New: "最新",
  "Most Discussed": "讨论最多",
  Unanswered: "等待回答",
  "TYORA Reviewed": "TYORA 已评估",
  "Active filters:": "当前筛选：",
  "Search: {query}": "搜索：{query}",
  Clear: "清除",
  "No discussions match this view yet.": "暂时没有符合条件的讨论。",
  "Try another filter or start the first discussion.": "可以更换筛选条件，或发起第一条讨论。",
  Discussions: "讨论",
  "TYORA Reviews": "TYORA 评估",
  Countries: "国家",
  "Needs your advice": "等待你的建议",
  "Every visible idea has received guidance.": "当前公开创意都已经获得建议。",
  "View all unanswered": "查看全部待回答",
  replies: "条回复",
  "Trending topics": "热门话题",
  "People helping": "正在提供帮助",
  "TYORA Manufacturing Team": "TYORA 制造团队",
  "Structured manufacturing assessments": "结构化制造评估",
  "Community contributor": "社区贡献者",
  "Community progress": "社区进展",
  "ideas moved beyond discussion": "个创意已进入下一阶段",
  "TYORA assessments published": "个 TYORA 评估已发布",
  "Every useful reply can move a product one step closer to manufacturing.": "每一条有用建议，都能让产品离制造更近一步。",
  Helpful: "有帮助",
  helpful: "有帮助",
  "TYORA Replied": "TYORA 已回复",
  "TYORA Expert:": "TYORA 专家：",
  "TYORA Case": "TYORA 案例",
  "Demonstration Project": "演示项目",
  "TYORA case": "TYORA 案例",
  Discussing: "讨论中",
  "TYORA Reviewing": "TYORA 评估中",
  "Project Started": "项目已启动",
  Shipping: "运输中",
  Completed: "已完成",
  Comment: "评论",
  "Early founder community": "早期创作者社区",
  "Share an idea for an initial manufacturing assessment.": "分享创意，获得初步制造评估。",
  "Starter community": "社区起步阶段",
  "Be the first founder to start a discussion.": "成为第一个发起讨论的创作者。",
  "Share a product idea for a limited initial manufacturing assessment from TYORA.": "分享产品创意，获得 TYORA 提供的有限初步制造评估。",
  "Allow anonymous sourcing activity": "允许匿名展示本次寻源进度",
  "Optional. TYORA may show a reviewed, anonymized summary. Your contact, original link, exact target price, supplier details, and private notes are never shown.": "可选。TYORA 审核后可以展示匿名摘要；联系方式、原始链接、精确目标价、供应商资料和内部备注永远不会公开。",
  "Recent sourcing activity": "最近现货寻源动态",
  "What buyers are asking TYORA to find": "买家最近让 TYORA 寻找什么",
  "Existing products submitted by link or image, followed through supplier checking, quote comparison, samples, and factory introduction.": "客户通过链接或图片提交现货需求，TYORA 持续跟进供应商核实、报价比较、样品和工厂介绍。",
  "Published only with customer permission. Contact and supplier details stay private.": "仅在客户授权后发布；联系方式和供应商资料始终保密。",
  "Request received": "已收到需求",
  "Checking China suppliers": "正在核实中国供应商",
  "Quote comparison ready": "报价比较已完成",
  "Sample requested": "已申请样品",
  "Factory introduced": "已介绍工厂",
  "Managed sourcing active": "托管采购进行中",
  "Sourcing completed": "寻源已完成",
  "Sourcing example": "寻源示例",
  "Customer approved": "客户已授权",
  "supplier options checked": "个供应商选项已核实",
  "quotes compared": "份报价已比较",
  "Find a similar existing product": "寻找类似现货",
  "Find supplier": "寻找供应商",
  "Get better price": "寻找更优价格",
  "Request sample": "申请样品",
  "Managed sourcing": "托管采购",
  "Magnetic phone accessory": "磁吸手机配件",
  "Desktop organization product": "桌面收纳产品",
  "Ready-made gift accessory": "现货礼品配件",
  "Comparing existing-product suppliers, MOQ, packaging, and factory-price options.": "正在比较现货供应商、起订量、包装和工厂价格。",
  "Reviewing ready-made options and checking whether samples can be supplied.": "正在审核现货选项并确认是否可以提供样品。",
  "Checking stock-style product options, logo packaging, and managed sourcing support.": "正在核实现货产品、Logo 包装和托管采购方案。",
  "North America buyer": "北美买家",
  "European buyer": "欧洲买家",
  "Asia-Pacific buyer": "亚太买家"
};

const es: Record<string, string> = {
  Ideas: "Ideas", Manufacturing: "Fabricación", Source: "Abastecimiento", Pricing: "Precios",
  "Creator Community": "Comunidad de creadores", "Turn practical feedback into manufacturing confidence.": "Convierte los comentarios prácticos en confianza para fabricar.",
  "Start a Discussion": "Iniciar una conversación", "Start a discussion": "Iniciar conversación", "All Discussions": "Todas las conversaciones",
  "Ideas & Feedback": "Ideas y comentarios", "Idea Feedback": "Comentarios sobre ideas", "Design Feedback": "Comentarios de diseño", "Cost & MOQ": "Coste y MOQ", "Manufacturing Advice": "Consejos de fabricación", "Progress Update": "Actualización de progreso", Materials: "Materiales", Prototyping: "Prototipos", "Find a Supplier": "Buscar proveedor",
  "Product stage": "Etapa del producto", Concept: "Concepto", Design: "Diseño", Review: "Evaluación", Prototype: "Prototipo", "Pre-production": "Preproducción", Production: "Producción", "Browse topics": "Explorar temas",
  "Product creator community": "Comunidad de creadores de productos", "Build it with confidence": "Fabrica con confianza",
  "Get practical feedback from buyers, makers, and TYORA manufacturing experts.": "Recibe consejos prácticos de compradores, creadores y expertos de TYORA.",
  "{count} ideas": "{count} ideas", "{count} reviewed": "{count} evaluadas", "Search ideas, products, or manufacturing questions": "Buscar ideas, productos o preguntas de fabricación",
  "Search discussions": "Buscar conversaciones", Hot: "Popular", New: "Nuevas", "Most Discussed": "Más comentadas", Unanswered: "Sin respuesta", "TYORA Reviewed": "Evaluadas por TYORA",
  "Active filters:": "Filtros activos:", "Search: {query}": "Búsqueda: {query}", Clear: "Borrar", "No discussions match this view yet.": "Aún no hay conversaciones que coincidan.",
  "Try another filter or start the first discussion.": "Prueba otro filtro o inicia la primera conversación.", Discussions: "Conversaciones", "TYORA Reviews": "Evaluaciones TYORA", Countries: "Países",
  "Needs your advice": "Necesita tu consejo", "Every visible idea has received guidance.": "Todas las ideas visibles ya recibieron orientación.", "View all unanswered": "Ver todas sin respuesta",
  replies: "respuestas", "Trending topics": "Temas populares", "People helping": "Personas que ayudan", "TYORA Manufacturing Team": "Equipo de fabricación TYORA",
  "Structured manufacturing assessments": "Evaluaciones estructuradas de fabricación", "Community contributor": "Colaborador de la comunidad", "Community progress": "Progreso de la comunidad",
  "ideas moved beyond discussion": "ideas avanzaron más allá del debate", "TYORA assessments published": "evaluaciones TYORA publicadas",
  "Every useful reply can move a product one step closer to manufacturing.": "Cada respuesta útil puede acercar un producto a la fabricación.",
  Helpful: "Útil", helpful: "útiles", "TYORA Replied": "TYORA respondió", "TYORA Expert:": "Experto TYORA:", "TYORA Case": "Caso TYORA",
  "Demonstration Project": "Proyecto demostrativo", "TYORA case": "Caso TYORA", Discussing: "En debate", "TYORA Reviewing": "En evaluación TYORA",
  "Project Started": "Proyecto iniciado", Shipping: "Envío", Completed: "Completado", Comment: "Comentario"
};

const fr: Record<string, string> = {
  Ideas: "Idées", Manufacturing: "Fabrication", Source: "Sourcing", Pricing: "Tarifs",
  "Creator Community": "Communauté de créateurs", "Turn practical feedback into manufacturing confidence.": "Transformez les conseils concrets en confiance pour fabriquer.",
  "Start a Discussion": "Lancer une discussion", "Start a discussion": "Lancer une discussion", "All Discussions": "Toutes les discussions",
  "Ideas & Feedback": "Idées et avis", "Idea Feedback": "Avis sur l’idée", "Design Feedback": "Avis sur le design", "Cost & MOQ": "Coût et MOQ", "Manufacturing Advice": "Conseils de fabrication", "Progress Update": "Mise à jour du projet", Materials: "Matériaux", Prototyping: "Prototypage", "Find a Supplier": "Trouver un fournisseur",
  "Product stage": "Étape du produit", Concept: "Concept", Design: "Conception", Review: "Évaluation", Prototype: "Prototype", "Pre-production": "Préproduction", Production: "Production", "Browse topics": "Explorer les sujets",
  "Product creator community": "Communauté de créateurs de produits", "Build it with confidence": "Fabriquez en toute confiance",
  "Get practical feedback from buyers, makers, and TYORA manufacturing experts.": "Recevez des conseils concrets d’acheteurs, de créateurs et d’experts TYORA.",
  "{count} ideas": "{count} idées", "{count} reviewed": "{count} évaluées", "Search ideas, products, or manufacturing questions": "Rechercher des idées, produits ou questions de fabrication",
  "Search discussions": "Rechercher des discussions", Hot: "Populaires", New: "Nouvelles", "Most Discussed": "Plus discutées", Unanswered: "Sans réponse", "TYORA Reviewed": "Évaluées par TYORA",
  "Active filters:": "Filtres actifs :", "Search: {query}": "Recherche : {query}", Clear: "Effacer", "No discussions match this view yet.": "Aucune discussion ne correspond pour le moment.",
  "Try another filter or start the first discussion.": "Essayez un autre filtre ou lancez la première discussion.", Discussions: "Discussions", "TYORA Reviews": "Avis TYORA", Countries: "Pays",
  "Needs your advice": "Besoin de vos conseils", "Every visible idea has received guidance.": "Toutes les idées visibles ont reçu des conseils.", "View all unanswered": "Voir toutes les questions sans réponse",
  replies: "réponses", "Trending topics": "Sujets populaires", "People helping": "Contributeurs actifs", "TYORA Manufacturing Team": "Équipe de fabrication TYORA",
  "Structured manufacturing assessments": "Évaluations structurées de fabrication", "Community contributor": "Contributeur de la communauté", "Community progress": "Progression de la communauté",
  "ideas moved beyond discussion": "idées ont dépassé la discussion", "TYORA assessments published": "évaluations TYORA publiées",
  "Every useful reply can move a product one step closer to manufacturing.": "Chaque réponse utile rapproche un produit de sa fabrication.",
  Helpful: "Utile", helpful: "utiles", "TYORA Replied": "TYORA a répondu", "TYORA Expert:": "Expert TYORA :", "TYORA Case": "Cas TYORA",
  "Demonstration Project": "Projet de démonstration", "TYORA case": "Cas TYORA", Discussing: "En discussion", "TYORA Reviewing": "Évaluation TYORA",
  "Project Started": "Projet lancé", Shipping: "Expédition", Completed: "Terminé", Comment: "Commentaire"
};

const de: Record<string, string> = {
  Ideas: "Ideen", Manufacturing: "Fertigung", Source: "Beschaffung", Pricing: "Preise",
  "Creator Community": "Creator-Community", "Turn practical feedback into manufacturing confidence.": "Mache aus praktischem Feedback Vertrauen in die Fertigung.",
  "Start a Discussion": "Diskussion starten", "Start a discussion": "Diskussion starten", "All Discussions": "Alle Diskussionen",
  "Ideas & Feedback": "Ideen und Feedback", "Idea Feedback": "Ideen-Feedback", "Design Feedback": "Design-Feedback", "Cost & MOQ": "Kosten und MOQ", "Manufacturing Advice": "Fertigungsberatung", "Progress Update": "Fortschrittsupdate", Materials: "Materialien", Prototyping: "Prototyping", "Find a Supplier": "Lieferanten finden",
  "Product stage": "Produktphase", Concept: "Konzept", Design: "Design", Review: "Bewertung", Prototype: "Prototyp", "Pre-production": "Vorproduktion", Production: "Produktion", "Browse topics": "Themen durchsuchen",
  "Product creator community": "Community für Produktentwickler", "Build it with confidence": "Mit Zuversicht fertigen",
  "Get practical feedback from buyers, makers, and TYORA manufacturing experts.": "Erhalte praktisches Feedback von Käufern, Entwicklern und TYORA-Fertigungsexperten.",
  "{count} ideas": "{count} Ideen", "{count} reviewed": "{count} bewertet", "Search ideas, products, or manufacturing questions": "Ideen, Produkte oder Fertigungsfragen suchen",
  "Search discussions": "Diskussionen suchen", Hot: "Beliebt", New: "Neu", "Most Discussed": "Meistdiskutiert", Unanswered: "Unbeantwortet", "TYORA Reviewed": "Von TYORA bewertet",
  "Active filters:": "Aktive Filter:", "Search: {query}": "Suche: {query}", Clear: "Löschen", "No discussions match this view yet.": "Noch keine passenden Diskussionen.",
  "Try another filter or start the first discussion.": "Versuche einen anderen Filter oder starte die erste Diskussion.", Discussions: "Diskussionen", "TYORA Reviews": "TYORA-Bewertungen", Countries: "Länder",
  "Needs your advice": "Braucht deinen Rat", "Every visible idea has received guidance.": "Alle sichtbaren Ideen haben bereits Hinweise erhalten.", "View all unanswered": "Alle unbeantworteten ansehen",
  replies: "Antworten", "Trending topics": "Trendthemen", "People helping": "Aktive Helfer", "TYORA Manufacturing Team": "TYORA-Fertigungsteam",
  "Structured manufacturing assessments": "Strukturierte Fertigungsbewertungen", "Community contributor": "Community-Mitwirkender", "Community progress": "Community-Fortschritt",
  "ideas moved beyond discussion": "Ideen sind über die Diskussion hinaus", "TYORA assessments published": "TYORA-Bewertungen veröffentlicht",
  "Every useful reply can move a product one step closer to manufacturing.": "Jede hilfreiche Antwort bringt ein Produkt näher an die Fertigung.",
  Helpful: "Hilfreich", helpful: "hilfreich", "TYORA Replied": "TYORA hat geantwortet", "TYORA Expert:": "TYORA-Experte:", "TYORA Case": "TYORA-Fall",
  "Demonstration Project": "Demonstrationsprojekt", "TYORA case": "TYORA-Fall", Discussing: "In Diskussion", "TYORA Reviewing": "TYORA prüft",
  "Project Started": "Projekt gestartet", Shipping: "Versand", Completed: "Abgeschlossen", Comment: "Kommentar"
};

const pt: Record<string, string> = {
  Ideas: "Ideias", Manufacturing: "Fabricação", Source: "Sourcing", Pricing: "Preços",
  "Creator Community": "Comunidade de criadores", "Turn practical feedback into manufacturing confidence.": "Transforme feedback prático em confiança para fabricar.",
  "Start a Discussion": "Iniciar discussão", "Start a discussion": "Iniciar discussão", "All Discussions": "Todas as discussões",
  "Ideas & Feedback": "Ideias e feedback", "Idea Feedback": "Feedback da ideia", "Design Feedback": "Feedback de design", "Cost & MOQ": "Custo e MOQ", "Manufacturing Advice": "Conselhos de fabricação", "Progress Update": "Atualização de progresso", Materials: "Materiais", Prototyping: "Prototipagem", "Find a Supplier": "Encontrar fornecedor",
  "Product stage": "Etapa do produto", Concept: "Conceito", Design: "Design", Review: "Avaliação", Prototype: "Protótipo", "Pre-production": "Pré-produção", Production: "Produção", "Browse topics": "Explorar temas",
  "Product creator community": "Comunidade de criadores de produtos", "Build it with confidence": "Fabrique com confiança",
  "Get practical feedback from buyers, makers, and TYORA manufacturing experts.": "Receba feedback prático de compradores, criadores e especialistas da TYORA.",
  "{count} ideas": "{count} ideias", "{count} reviewed": "{count} avaliadas", "Search ideas, products, or manufacturing questions": "Buscar ideias, produtos ou dúvidas de fabricação",
  "Search discussions": "Buscar discussões", Hot: "Em alta", New: "Novas", "Most Discussed": "Mais discutidas", Unanswered: "Sem resposta", "TYORA Reviewed": "Avaliadas pela TYORA",
  "Active filters:": "Filtros ativos:", "Search: {query}": "Busca: {query}", Clear: "Limpar", "No discussions match this view yet.": "Ainda não há discussões correspondentes.",
  "Try another filter or start the first discussion.": "Tente outro filtro ou inicie a primeira discussão.", Discussions: "Discussões", "TYORA Reviews": "Avaliações TYORA", Countries: "Países",
  "Needs your advice": "Precisa do seu conselho", "Every visible idea has received guidance.": "Todas as ideias visíveis já receberam orientação.", "View all unanswered": "Ver todas sem resposta",
  replies: "respostas", "Trending topics": "Tópicos em alta", "People helping": "Pessoas ajudando", "TYORA Manufacturing Team": "Equipe de fabricação TYORA",
  "Structured manufacturing assessments": "Avaliações estruturadas de fabricação", "Community contributor": "Colaborador da comunidade", "Community progress": "Progresso da comunidade",
  "ideas moved beyond discussion": "ideias avançaram além da discussão", "TYORA assessments published": "avaliações TYORA publicadas",
  "Every useful reply can move a product one step closer to manufacturing.": "Cada resposta útil aproxima um produto da fabricação.",
  Helpful: "Útil", helpful: "úteis", "TYORA Replied": "TYORA respondeu", "TYORA Expert:": "Especialista TYORA:", "TYORA Case": "Caso TYORA",
  "Demonstration Project": "Projeto de demonstração", "TYORA case": "Caso TYORA", Discussing: "Em discussão", "TYORA Reviewing": "Em avaliação TYORA",
  "Project Started": "Projeto iniciado", Shipping: "Envio", Completed: "Concluído", Comment: "Comentário"
};

const translations: Partial<Record<PublicLanguage, Record<string, string>>> = {
  "zh-CN": zhCN,
  es,
  fr,
  de,
  pt
};

export function translateCommunityText(language: PublicLanguage, text: string, values: Values = {}) {
  const template = translations[language]?.[text] || text;
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export default function CommunityText({ text, values }: { text: string; values?: Values }) {
  const { language } = usePublicLanguage();
  return <>{translateCommunityText(language, text, values)}</>;
}

export function CommunitySearchInput({
  placeholder,
  className,
  defaultValue = ""
}: {
  placeholder: string;
  className: string;
  defaultValue?: string;
}) {
  const { language } = usePublicLanguage();
  const localizedPlaceholder = translateCommunityText(language, placeholder);
  return (
    <input
      name="q"
      defaultValue={defaultValue}
      placeholder={localizedPlaceholder}
      aria-label={localizedPlaceholder}
      className={className}
    />
  );
}
