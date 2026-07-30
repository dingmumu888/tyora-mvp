export type ProfileEncouragements = {
  en: string[];
  "zh-CN": string[];
  es: string[];
  fr: string[];
  de: string[];
  pt: string[];
};

export const profileEncouragementFallbacks: ProfileEncouragements = {
  en: ["Great products often begin with one small idea that someone chooses to take seriously."],
  "zh-CN": ["伟大的产品，常常从一个愿意被认真打磨的小想法开始。"],
  es: ["Los grandes productos suelen empezar con una pequeña idea que alguien decide tomar en serio."],
  fr: ["Les grands produits commencent souvent par une petite idée que quelqu'un décide de prendre au sérieux."],
  de: ["Große Produkte beginnen oft mit einer kleinen Idee, die jemand ernst nimmt."],
  pt: ["Grandes produtos muitas vezes começam com uma pequena ideia que alguém decide levar a sério."]
};

function messageList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .map((item) => String(item).trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 40);
  return next.length ? next : fallback;
}

export function normalizeProfileEncouragements(
  value: unknown,
  fallback: ProfileEncouragements = profileEncouragementFallbacks
): ProfileEncouragements {
  const item = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<ProfileEncouragements>
    : {};
  return {
    en: messageList(item.en, fallback.en),
    "zh-CN": messageList(item["zh-CN"], fallback["zh-CN"]),
    es: messageList(item.es, fallback.es),
    fr: messageList(item.fr, fallback.fr),
    de: messageList(item.de, fallback.de),
    pt: messageList(item.pt, fallback.pt)
  };
}
