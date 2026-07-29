import type { MetadataRoute } from "next";

const siteOrigin = "https://www.tyora.io";

const publicRoutes = [
  { path: "/ask", changeFrequency: "daily", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/custom", changeFrequency: "monthly", priority: 0.8 },
  { path: "/source", changeFrequency: "monthly", priority: 0.8 },
  { path: "/source/how-it-works", changeFrequency: "monthly", priority: 0.7 },
  { path: "/build", changeFrequency: "monthly", priority: 0.7 },
  { path: "/service-scope", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 }
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${siteOrigin}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
