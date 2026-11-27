import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSitemapEntries } from "@/lib/api";
import { SITE_URL } from "@/lib/seo";

/**
 * sitemap.xml: Home, every public category, and every public thread with the time it last changed.
 * Built on each request so new threads appear straight away; search engines fetch it rarely.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const { threads, categories } = await getSitemapEntries().catch(() => ({ threads: [], categories: [] }));
  const newest = threads[0]?.lastActivityAt;

  return [
    { url: `${SITE_URL}/`, lastModified: newest ? new Date(newest) : undefined, changeFrequency: "hourly", priority: 1 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.lastActivityAt ? new Date(c.lastActivityAt) : undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...threads.map((t) => ({
      url: `${SITE_URL}/t/${t.id}`,
      lastModified: new Date(t.lastActivityAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
