import type { MetadataRoute } from "next";

const siteOrigin = "https://www.tyora.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/ask/new",
        "/leads",
        "/me"
      ]
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin
  };
}
