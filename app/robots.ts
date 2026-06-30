import type { MetadataRoute } from "next";

const SITE_URL = "https://pointsy.kids";

/** Allow the public marketing/legal pages; keep the authenticated app out of
 * search indexes (those pages are behind auth and aren't useful results). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/manage",
        "/award",
        "/me",
        "/submit",
        "/redeem",
        "/enter",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
