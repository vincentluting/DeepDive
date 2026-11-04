import type { MetadataRoute } from "next"
import { DEFAULT_APP_URL } from '@/lib/utils'

// All known AI training crawlers + aggressive scraping bots (2026-03)
const AI_AND_SCRAPER_BOTS = [
  // --- AI training crawlers ---
  'GPTBot',            // OpenAI — LLM training
  'ChatGPT-User',     // OpenAI — ChatGPT browsing mode
  'OAI-SearchBot',     // OpenAI — SearchGPT
  'Google-Extended',   // Google — Gemini training
  'GoogleOther',       // Google — misc AI usage
  'ClaudeBot',         // Anthropic — Claude training
  'anthropic-ai',      // Anthropic — older UA
  'Bytespider',        // ByteDance — TikTok/Doubao training
  'CCBot',             // Common Crawl — most-blocked crawler globally
  'FacebookBot',       // Meta — LLaMA training
  'Meta-ExternalAgent', // Meta — newer crawler
  'cohere-ai',         // Cohere — LLM training
  'PerplexityBot',     // Perplexity AI
  'YouBot',            // You.com
  'Applebot-Extended', // Apple — Apple Intelligence training
  'Diffbot',           // Diffbot — structured data extraction
  'Timpibot',          // Timpi — decentralized search
  'img2dataset',       // LAION — image dataset builder
  'omgili',            // Webz.io — data-as-a-service
  'Amazonbot',         // Amazon — Alexa/AI training
  // --- Aggressive scraping services ---
  'SemrushBot',        // SEMrush — competitor analysis tool
  'AhrefsBot',         // Ahrefs — backlink scraper
  'MJ12bot',           // Majestic — link intelligence
  'DotBot',            // Moz — SEO crawler
  'PetalBot',          // Huawei — search/AI
  'BLEXBot',           // WebFilter — link analysis
  'DataForSeoBot',     // DataForSEO — SERP scraping
  'magpie-crawler',    // Brand monitoring
]

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL

  const sensitiveRoutes = [
    '/api/',
    '/*/admin/',
    '/*/dashboard/',
    '/*/report/',
    '/*/reports/',
    '/*/coaching/',
    '/*/settings/',
    '/*/profile/',
    '/*/deepdive/',
    '/*/immersive-dive/',
  ]

  return {
    rules: [
      // Block all AI training crawlers and scraping bots completely
      ...AI_AND_SCRAPER_BOTS.map(bot => ({
        userAgent: bot,
        disallow: ['/'],
      })),
      // Allow legitimate search engines, but block sensitive routes
      {
        userAgent: '*',
        allow: '/',
        disallow: sensitiveRoutes,
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
