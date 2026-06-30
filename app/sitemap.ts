import type { MetadataRoute } from "next";

const SITE_URL = "https://pointsy.kids";

/** The public, indexable pages. Authenticated app routes are intentionally
 * excluded (see robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/sign-up", "/sign-in", "/join", "/privacy", "/terms"];
  return pages.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
