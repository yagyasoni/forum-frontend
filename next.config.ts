import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // AWS S3 direct URL
      { protocol: "https", hostname: "**.s3.**.amazonaws.com", pathname: "/**" },
      // CloudFront CDN (optional, set AWS_CLOUDFRONT_URL in env)
      { protocol: "https", hostname: "**.cloudfront.net", pathname: "/**" },
    ],
  },
  // Search engines get every <head> tag (title, description, canonical, robots) in the first HTML
  // instead of streamed later. This is Next.js's own bot list plus Googlebot, because Google ignores a
  // canonical link that is not in <head>. Visitors are unaffected.
  htmlLimitedBots:
    /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i,

  // Pages that must stay out of search results, marked in the HTTP response itself.
  async headers() {
    const noIndex = (value: string) => [{ key: "X-Robots-Tag", value }];
    return [
      // Signed-in pages (also blocked in robots.txt).
      { source: "/:page(new|saved|my-posts|profile)", headers: noIndex("noindex, nofollow") },
      // Search results.
      { source: "/", has: [{ type: "query", key: "q" }], headers: noIndex("noindex, follow") },
      // The Top and Unanswered tabs list the same threads as Latest in another order.
      { source: "/", has: [{ type: "query", key: "tab", value: "(top|unanswered)" }], headers: noIndex("noindex, follow") },
      // Members-only categories.
      { source: "/", has: [{ type: "query", key: "category", value: "(how-to|announcements)" }], headers: noIndex("noindex, nofollow") },
    ];
  },

  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
