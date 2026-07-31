import type { PublicLanguage } from "@/lib/public-i18n";

const en = {
  discussion: "Discussing",
  public: "Public",
  private: "Private",
  edited: "Edited",
  justNow: "just now",
  minutesAgo: "{count}m ago",
  hoursAgo: "{count}h ago",
  daysAgo: "{count}d ago",
  questionLead: "Wants to know:",
  helpful: "Helpful",
  wantOne: "I Want One",
  comments: "Comments",
  share: "Share",
  edit: "Edit",
  withdraw: "Withdraw",
  joinDiscussion: "Join the discussion",
  joinPlaceholder: "Tell the creator what feels useful, unclear, or worth trying…",
  loginToComment: "Email login is required to join the discussion.",
  publish: "Publish",
  checking: "Checking",
  mostHelpful: "Most helpful",
  latest: "Latest",
  tyoraReplies: "TYORA replies",
  tyoraTeam: "TYORA Manufacturing Team",
  verified: "Verified",
  pinned: "Pinned",
  expertPending: "TYORA’s manufacturing review will appear here after it is published.",
  assessmentDetails: "View manufacturing details",
  reply: "Reply",
  cancel: "Cancel",
  postReply: "Post reply",
  replyPlaceholder: "Write a useful reply…",
  delete: "Delete",
  viewMore: "View more comments",
  showLess: "Show fewer comments",
  noComments: "Start the conversation with one practical thought.",
  imageCounter: "{current} / {total}",
  imageHint: "Swipe or use arrow keys to browse",
  closeGallery: "Close gallery",
  previousImage: "Previous image",
  nextImage: "Next image",
  canManufacture: "Can this be manufactured?",
  estimatedCost: "Estimated cost?",
  materialSuggestion: "Material suggestion?",
  moqEstimate: "MOQ estimate?",
  factoryRecommendation: "Factory recommendation?",
  customQuestion: "Custom question"
} as const;

type IdeaDetailKey = keyof typeof en;
type Dictionary = Record<IdeaDetailKey, string>;

const zhCN: Dictionary = {
  discussion: "讨论中",
  public: "公开",
  private: "私密",
  edited: "已编辑",
  justNow: "刚刚",
  minutesAgo: "{count} 分钟前",
  hoursAgo: "{count} 小时前",
  daysAgo: "{count} 天前",
  questionLead: "希望了解：",
  helpful: "有帮助",
  wantOne: "我也想要",
  comments: "评论",
  share: "分享",
  edit: "编辑",
  withdraw: "撤回",
  joinDiscussion: "加入讨论",
  joinPlaceholder: "告诉创作者：哪里有价值、哪里不清楚，或者还可以尝试什么……",
  loginToComment: "登录邮箱后即可加入讨论。",
  publish: "发布",
  checking: "正在确认",
  mostHelpful: "最有帮助",
  latest: "最新",
  tyoraReplies: "TYORA 回复",
  tyoraTeam: "TYORA 制造团队",
  verified: "已认证",
  pinned: "置顶",
  expertPending: "TYORA 的制造评估发布后会显示在这里。",
  assessmentDetails: "查看完整制造评估",
  reply: "回复",
  cancel: "取消",
  postReply: "发布回复",
  replyPlaceholder: "写下一条真正有用的回复……",
  delete: "删除",
  viewMore: "查看更多评论",
  showLess: "收起评论",
  noComments: "留下第一条实用建议，让讨论开始。",
  imageCounter: "{current} / {total}",
  imageHint: "左右滑动，或使用方向键浏览",
  closeGallery: "关闭图片",
  previousImage: "上一张图片",
  nextImage: "下一张图片",
  canManufacture: "这个产品可以制造吗？",
  estimatedCost: "预计成本是多少？",
  materialSuggestion: "建议使用什么材料？",
  moqEstimate: "预计起订量是多少？",
  factoryRecommendation: "适合什么类型的工厂？",
  customQuestion: "自定义问题"
};

const es: Dictionary = {
  discussion: "En debate", public: "Público", private: "Privado", edited: "Editado", justNow: "ahora mismo",
  minutesAgo: "hace {count} min", hoursAgo: "hace {count} h", daysAgo: "hace {count} d", questionLead: "Quiere saber:",
  helpful: "Útil", wantOne: "Yo también lo quiero", comments: "Comentarios", share: "Compartir", edit: "Editar", withdraw: "Retirar",
  joinDiscussion: "Únete a la conversación", joinPlaceholder: "Cuéntale al creador qué funciona, qué no está claro o qué probarías…",
  loginToComment: "Inicia sesión por correo para participar.", publish: "Publicar", checking: "Comprobando",
  mostHelpful: "Más útiles", latest: "Más recientes", tyoraReplies: "Respuestas de TYORA", tyoraTeam: "Equipo de fabricación TYORA",
  verified: "Verificado", pinned: "Fijado", expertPending: "La evaluación de fabricación de TYORA aparecerá aquí cuando se publique.",
  assessmentDetails: "Ver detalles de fabricación", reply: "Responder", cancel: "Cancelar", postReply: "Publicar respuesta",
  replyPlaceholder: "Escribe una respuesta útil…", delete: "Eliminar", viewMore: "Ver más comentarios", showLess: "Ver menos",
  noComments: "Inicia la conversación con una idea práctica.", imageCounter: "{current} / {total}",
  imageHint: "Desliza o usa las flechas para navegar", closeGallery: "Cerrar galería", previousImage: "Imagen anterior", nextImage: "Imagen siguiente",
  canManufacture: "¿Se puede fabricar?", estimatedCost: "¿Coste estimado?", materialSuggestion: "¿Material recomendado?",
  moqEstimate: "¿MOQ estimado?", factoryRecommendation: "¿Fábrica recomendada?", customQuestion: "Pregunta personalizada"
};

const fr: Dictionary = {
  discussion: "En discussion", public: "Public", private: "Privé", edited: "Modifié", justNow: "à l’instant",
  minutesAgo: "il y a {count} min", hoursAgo: "il y a {count} h", daysAgo: "il y a {count} j", questionLead: "Souhaite savoir :",
  helpful: "Utile", wantOne: "Je le veux aussi", comments: "Commentaires", share: "Partager", edit: "Modifier", withdraw: "Retirer",
  joinDiscussion: "Rejoindre la discussion", joinPlaceholder: "Dites au créateur ce qui est utile, peu clair ou mérite d’être essayé…",
  loginToComment: "Connectez-vous par e-mail pour participer.", publish: "Publier", checking: "Vérification",
  mostHelpful: "Plus utiles", latest: "Plus récents", tyoraReplies: "Réponses TYORA", tyoraTeam: "Équipe de fabrication TYORA",
  verified: "Vérifié", pinned: "Épinglé", expertPending: "L’évaluation de fabrication TYORA apparaîtra ici après sa publication.",
  assessmentDetails: "Voir les détails de fabrication", reply: "Répondre", cancel: "Annuler", postReply: "Publier la réponse",
  replyPlaceholder: "Rédigez une réponse utile…", delete: "Supprimer", viewMore: "Voir plus de commentaires", showLess: "Réduire",
  noComments: "Lancez la discussion avec une remarque concrète.", imageCounter: "{current} / {total}",
  imageHint: "Balayez ou utilisez les flèches", closeGallery: "Fermer la galerie", previousImage: "Image précédente", nextImage: "Image suivante",
  canManufacture: "Ce produit peut-il être fabriqué ?", estimatedCost: "Coût estimé ?", materialSuggestion: "Matériau conseillé ?",
  moqEstimate: "MOQ estimé ?", factoryRecommendation: "Usine recommandée ?", customQuestion: "Question personnalisée"
};

const de: Dictionary = {
  discussion: "In Diskussion", public: "Öffentlich", private: "Privat", edited: "Bearbeitet", justNow: "gerade eben",
  minutesAgo: "vor {count} Min.", hoursAgo: "vor {count} Std.", daysAgo: "vor {count} T.", questionLead: "Möchte wissen:",
  helpful: "Hilfreich", wantOne: "Das möchte ich auch", comments: "Kommentare", share: "Teilen", edit: "Bearbeiten", withdraw: "Zurückziehen",
  joinDiscussion: "An der Diskussion teilnehmen", joinPlaceholder: "Sag dem Ersteller, was hilfreich, unklar oder einen Versuch wert ist…",
  loginToComment: "Zum Mitdiskutieren per E-Mail anmelden.", publish: "Veröffentlichen", checking: "Wird geprüft",
  mostHelpful: "Am hilfreichsten", latest: "Neueste", tyoraReplies: "TYORA-Antworten", tyoraTeam: "TYORA-Fertigungsteam",
  verified: "Verifiziert", pinned: "Angeheftet", expertPending: "Die TYORA-Fertigungsbewertung erscheint nach der Veröffentlichung hier.",
  assessmentDetails: "Fertigungsdetails ansehen", reply: "Antworten", cancel: "Abbrechen", postReply: "Antwort veröffentlichen",
  replyPlaceholder: "Schreibe eine hilfreiche Antwort…", delete: "Löschen", viewMore: "Mehr Kommentare", showLess: "Weniger anzeigen",
  noComments: "Starte die Diskussion mit einem praktischen Gedanken.", imageCounter: "{current} / {total}",
  imageHint: "Wischen oder Pfeiltasten verwenden", closeGallery: "Galerie schließen", previousImage: "Vorheriges Bild", nextImage: "Nächstes Bild",
  canManufacture: "Ist das herstellbar?", estimatedCost: "Geschätzte Kosten?", materialSuggestion: "Materialempfehlung?",
  moqEstimate: "Geschätzte MOQ?", factoryRecommendation: "Fabrikempfehlung?", customQuestion: "Eigene Frage"
};

const pt: Dictionary = {
  discussion: "Em discussão", public: "Público", private: "Privado", edited: "Editado", justNow: "agora mesmo",
  minutesAgo: "há {count} min", hoursAgo: "há {count} h", daysAgo: "há {count} d", questionLead: "Quer saber:",
  helpful: "Útil", wantOne: "Eu também quero", comments: "Comentários", share: "Compartilhar", edit: "Editar", withdraw: "Retirar",
  joinDiscussion: "Participe da discussão", joinPlaceholder: "Conte ao criador o que é útil, pouco claro ou vale testar…",
  loginToComment: "Entre por e-mail para participar.", publish: "Publicar", checking: "Verificando",
  mostHelpful: "Mais úteis", latest: "Mais recentes", tyoraReplies: "Respostas da TYORA", tyoraTeam: "Equipe de fabricação TYORA",
  verified: "Verificado", pinned: "Fixado", expertPending: "A avaliação de fabricação da TYORA aparecerá aqui após a publicação.",
  assessmentDetails: "Ver detalhes de fabricação", reply: "Responder", cancel: "Cancelar", postReply: "Publicar resposta",
  replyPlaceholder: "Escreva uma resposta útil…", delete: "Excluir", viewMore: "Ver mais comentários", showLess: "Ver menos",
  noComments: "Comece a conversa com uma observação prática.", imageCounter: "{current} / {total}",
  imageHint: "Deslize ou use as setas para navegar", closeGallery: "Fechar galeria", previousImage: "Imagem anterior", nextImage: "Próxima imagem",
  canManufacture: "Pode ser fabricado?", estimatedCost: "Custo estimado?", materialSuggestion: "Sugestão de material?",
  moqEstimate: "MOQ estimado?", factoryRecommendation: "Fábrica recomendada?", customQuestion: "Pergunta personalizada"
};

const dictionaries: Record<PublicLanguage, Dictionary> = {
  en,
  "zh-CN": zhCN,
  es,
  fr,
  de,
  pt
};

export function translateIdeaDetail(
  language: PublicLanguage,
  key: IdeaDetailKey,
  values: Record<string, string | number> = {}
) {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    dictionaries[language][key]
  );
}

export type { IdeaDetailKey };
