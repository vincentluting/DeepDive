/* global process */
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

// Opt-in bundle analysis: `npm run analyze` (ANALYZE=1). No-op otherwise.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "1",
});

// Avatar CDN host (Cloudflare R2 / Pages) — read at build time so Next.js
// allows next/image to load from the configured origin. Set to the bare
// hostname, e.g. "cdn.example.com". Leave unset to serve avatars from
// /public/12 avatar/ as a fallback.
const avatarCdnHost = process.env.NEXT_PUBLIC_AVATAR_CDN_HOST?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: avatarCdnHost
      ? [{ protocol: "https", hostname: avatarCdnHost }]
      : [],
  },
  experimental: {
    // Tree-shake barrel exports of heavy libs at build time. Without this,
    // a single `import { motion } from "framer-motion"` pulls the whole
    // package into the client bundle (~150KB gz). Next bakes per-symbol
    // imports for each package listed here.
    // Verified imports across app/ + components/ on 2026-05-19.
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "recharts",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-slot",
      "date-fns",
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["pdfjs-dist", "mammoth"],
  outputFileTracingIncludes: {
    "/api/documents/upload": [
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/mammoth/**/*",
    ],
    // Bundle the migration SQL files so the DB health check can list them
    // at runtime (it diffs scripts/migrations/ against the _migrations table).
    "/api/health/db": ["./scripts/migrations/**"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            // unsafe-inline: required by Next.js inline scripts + Tailwind CSS v4 runtime styles
            // unsafe-eval: required by Next.js App Router (server action hydration)
            // TODO: migrate to nonce-based CSP when Next.js supports it natively
            value: [
              "default-src 'self'",
              // va.vercel-scripts.com: Vercel Speed Insights / Analytics loader script.
              // Without it the CSP blocks <SpeedInsights/> and no perf data is collected.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.openai.com https://api.anthropic.com https://vitals.vercel-insights.com https://*.ingest.sentry.io https://accounts.google.com https://oauth2.googleapis.com https://appleid.apple.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://appleid.apple.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // Upload source maps for meaningful error stack traces
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production builds
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from users
  hideSourceMaps: true,

  // Widen the upload scope for route handlers and server components
  widenClientFileUpload: true,

  webpack: {
    // Replaces deprecated disableLogger option.
    treeshake: {
      removeDebugLogging: true,
    },
    // Replaces deprecated automaticVercelMonitors option.
    automaticVercelMonitors: true,
  },
});
