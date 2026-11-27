// Shared pieces for search engines and link previews: the site address, page descriptions,
// structured data (JSON-LD), and bot detection.

import type { Metadata } from "next";

/** The public address of the forum. Every canonical link, sitemap entry and preview URL uses it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://forum.auditprorx.com").replace(/\/+$/, "");
export const SITE_NAME = "AuditProRx Community";

export const HOME_TITLE = "AuditProRx Community: PBM audits, claim rejections and pharmacy Q&A";
export const HOME_DESCRIPTION =
  "Independent pharmacy owners, pharmacists, and technicians comparing notes on PBM audits, claim rejections and reject codes, wholesaler invoices, and compliance.";

/** Absolute URL for a path on this site. */
export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Plain text from the sanitized HTML the backend stores for posts and comments. */
export function plainText(html: string) {
  return html
    .replace(/<(br|\/p|\/li)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** A search-result description: at most `max` characters, cut at a word boundary. */
export function describe(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const atWord = cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6));
  return `${atWord.trimEnd()}…`;
}

/**
 * The absolute address of a thread's picture when link previews can show it: a JPEG, PNG or GIF.
 * Anything else (SVG, WebP, a missing image) returns undefined and the branded card is used.
 */
export function previewPhoto(imageUrl: string | null | undefined): string | undefined {
  if (!imageUrl) return undefined;
  try {
    const url = new URL(imageUrl, SITE_URL);
    return /^https?:$/.test(url.protocol) && /\.(jpe?g|png|gif)$/i.test(url.pathname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Open Graph block with the site-wide fields every page repeats (a page's openGraph replaces the parent's). */
export function openGraph(fields: { title: string; description: string; url: string; type?: "website" | "article" } & Record<string, unknown>): Metadata["openGraph"] {
  const { type = "website", ...rest } = fields;
  return { siteName: SITE_NAME, locale: "en_US", type, ...rest } as Metadata["openGraph"];
}

/** Robots value for pages that must stay out of search results. */
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };

/**
 * Structured data as a script tag body. `<` is escaped so text from posts can never close the
 * script tag early.
 */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/** Organization and site markup for the home page. */
export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.auditprorx.com/#organization",
      name: "AuditProRx",
      url: "https://www.auditprorx.com",
      logo: absoluteUrl("/icon.png"),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      publisher: { "@id": "https://www.auditprorx.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

// Search engines and link-preview bots, beyond what Next.js's own list covers.
const EXTRA_BOTS = /bot|crawler|spider|crawling|Lighthouse|Google-InspectionTool/i;

/** True when the page being rendered was requested by a crawler or a link-preview bot. */
export async function requestIsBot(): Promise<boolean> {
  if (typeof window !== "undefined") return false;
  try {
    const [{ headers }, { userAgent }] = await Promise.all([import("next/headers"), import("next/server")]);
    const h = await headers();
    return userAgent({ headers: h }).isBot || EXTRA_BOTS.test(h.get("user-agent") ?? "");
  } catch {
    return false; // not in a request
  }
}
