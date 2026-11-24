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
