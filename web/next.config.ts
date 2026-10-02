import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Baked in at build time, like NEXT_PUBLIC_* in the bundle.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/seed/**",
      },
      // api's /static through this site: photo cards build absolute URLs from relative paths.
      // On the server picsum is blocked, so listing photos point at /static/demo (deploy/README.md).
      ...(siteUrl ? [new URL("/static/**", siteUrl)] : []),
    ],
    qualities: [50, 75, 90],
    formats: ["image/avif", "image/webp"],
  },
  cacheComponents: true,
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
