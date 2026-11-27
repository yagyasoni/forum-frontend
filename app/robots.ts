import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** robots.txt: crawl the forum, skip the signed-in pages, and find everything through the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/new", "/saved", "/my-posts", "/profile"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
