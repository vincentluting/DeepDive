// ============================================================
// Bot Detection Engine — Stateless request classification
//
// Runs in Edge middleware. Zero external dependencies.
// Classifies incoming requests into: block | throttle | allow
//
// Three detection layers:
//   1. UA matching — known AI crawlers, scraping services, automation frameworks
//   2. Header analysis — missing browser signals, suspicious patterns
//   3. Path pattern analysis — scraping-indicative access patterns
// ============================================================

import { NextRequest } from "next/server";

export type BotAction = "block" | "throttle" | "allow";
export type BotCategory =
  | "ai_crawler"
  | "scraper"
  | "automation"
  | "suspicious";

export type BotClassification = {
  action: BotAction;
  reason?: string;
  category?: BotCategory;
};

// ---------------------------------------------------------------------------
// Layer 1 — User-Agent blocklists
// ---------------------------------------------------------------------------

/** AI training crawlers — robots.txt asks nicely; middleware enforces. */
const AI_CRAWLERS = [
  "GPTBot", // OpenAI — LLM training
  "ChatGPT-User", // OpenAI — ChatGPT browsing
  "OAI-SearchBot", // OpenAI — SearchGPT
  "Google-Extended", // Google — Gemini training
  "GoogleOther", // Google — misc AI
  "ClaudeBot", // Anthropic — Claude training
  "anthropic-ai", // Anthropic — older UA
  "Bytespider", // ByteDance — Doubao/TikTok training
  "CCBot", // Common Crawl — most-blocked globally
  "FacebookBot", // Meta — LLaMA training
  "Meta-ExternalAgent", // Meta — newer crawler
  "meta-externalagent", // Meta — lowercase variant
  "cohere-ai", // Cohere — LLM training
  "PerplexityBot", // Perplexity AI
  "YouBot", // You.com
  "Applebot-Extended", // Apple — Apple Intelligence training
  "Diffbot", // Diffbot — structured data extraction
  "Timpibot", // Timpi — decentralized search
  "img2dataset", // LAION — image dataset builder
  "omgili", // Webz.io — data-as-a-service
  "Amazonbot", // Amazon — Alexa/AI training
  "PiplBot", // Pipl — people data
  "ISSCyberRiskCrawler", // ISS — cyber risk
  "Kangaroo Bot", // Kangaroo LLM
  "AI2Bot", // Allen AI
  "Ai2Bot-Dolma", // Allen AI — Dolma dataset
  "Scrapy", // Scrapy framework UA
  "FriendlyCrawler", // Generic AI crawler
  "iaskspider", // iAsk.AI
  "ICC-Crawler", // NII Japan
];

/** SEO/competitive analysis & scraping services */
const SCRAPER_BOTS = [
  "SemrushBot", // SEMrush — competitor analysis
  "AhrefsBot", // Ahrefs — backlink scraper
  "MJ12bot", // Majestic — link intelligence
  "DotBot", // Moz — SEO crawler
  "PetalBot", // Huawei — search/AI
  "BLEXBot", // WebFilter — link analysis
  "DataForSeoBot", // DataForSEO — SERP scraping
  "magpie-crawler", // Brand monitoring
  "BomboraBot", // Bombora — intent data
  "ZoominfoBot", // ZoomInfo — business data
  "Screaming Frog", // SEO audit tool
  "SEOkicks", // SEO analysis
  "Rogerbot", // Moz — domain authority
  "Exabot", // Exalead — web mining
  "Turnitin", // Plagiarism detection
  "CopyLeaks", // Content copying detection
];

/** Legitimate social-preview and search-engine crawlers — explicitly ALLOWED.
 *  These bots have notoriously short UAs (e.g. "Twitterbot/1.0" = 13 chars,
 *  "LinkedInBot/1.0" = 15 chars) that would otherwise trip the short-UA +
 *  sensitive-path rule below, causing /api/og to 403 and breaking social
 *  share card previews and SEO indexing.
 *
 *  Checked AFTER the AI_CRAWLERS/SCRAPER/AUTOMATION blocklists so that:
 *    - Google-Extended (AI training) is still blocked even though
 *      "Googlebot" would be allowed — precedence rules win.
 *    - Applebot-Extended (AI training) is still blocked, Applebot (search)
 *      is allowed — the full "Applebot-Extended" substring is matched first. */
const ALLOWED_SOCIAL_AND_SEARCH_BOTS = [
  // Social link-preview bots
  "Twitterbot",
  "LinkedInBot",
  "facebookexternalhit",
  "Slackbot",
  "WhatsApp",
  "TelegramBot",
  "Discordbot",
  "Pinterestbot",
  "redditbot",
  "SkypeUriPreview",
  // Search engine crawlers — legitimate SEO indexing
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "YandexImages",
  "MojeekBot",
  "Applebot",
  "SeznamBot",
];

/** Headless browsers & automation frameworks */
const AUTOMATION_MARKERS = [
  "HeadlessChrome",
  "PhantomJS",
  "Selenium",
  "Puppeteer",
  "Playwright",
  "WebDriver",
  "CasperJS",
  "SlimerJS",
  "Nightmare",
  "Splash",
  "HtmlUnit",
  "python-requests",
  "python-urllib",
  "Go-http-client",
  "Java/",
  "Apache-HttpClient",
  "okhttp",
  "node-fetch",
  "axios/",
  "got/",
  "curl/",
  "wget/",
  "libwww-perl",
  "lwp-trivial",
  "PHP/",
  "Ruby",
  "httpx",
  "aiohttp",
];

// ---------------------------------------------------------------------------
// Layer 2 — Header analysis (stateless browser signal validation)
// ---------------------------------------------------------------------------

/**
 * Score how "browser-like" a request is based on standard headers.
 * Real browsers consistently send specific headers that scrapers often miss.
 *
 * Returns 0-100 suspicion score (higher = more suspicious)
 */
function headerSuspicionScore(request: NextRequest): number {
  let score = 0;
  const ua = request.headers.get("user-agent");

  // No UA at all — very suspicious
  if (!ua || ua.length < 10) {
    score += 40;
  }

  // Missing Accept-Language — real browsers always send this
  if (!request.headers.get("accept-language")) {
    score += 20;
  }

  // Missing Accept header or non-browser Accept
  const accept = request.headers.get("accept");
  if (!accept) {
    score += 15;
  } else if (
    !accept.includes("text/html") &&
    !accept.includes("*/*") &&
    !accept.includes("application/json")
  ) {
    score += 10;
  }

  // Missing Accept-Encoding — all modern browsers send this
  if (!request.headers.get("accept-encoding")) {
    score += 15;
  }

  // Modern Chrome/Edge/Firefox send sec-ch-ua — its absence with a Chrome-like UA is suspicious
  if (ua && /Chrome\/\d/.test(ua) && !request.headers.get("sec-ch-ua")) {
    score += 15;
  }

  // Missing Sec-Fetch-Mode on modern browsers (Chrome 76+, Firefox 90+)
  if (
    ua &&
    (/Chrome\/(?:[7-9]\d|1\d\d)/.test(ua) || /Firefox\/(?:9\d|1\d\d)/.test(ua))
  ) {
    if (!request.headers.get("sec-fetch-mode")) {
      score += 10;
    }
  }

  // Connection: close without Accept-Encoding — classic scraper pattern
  if (
    request.headers.get("connection") === "close" &&
    !request.headers.get("accept-encoding")
  ) {
    score += 15;
  }

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Layer 3 — Path pattern analysis
// ---------------------------------------------------------------------------

/** Paths that should never be accessed by crawlers */
const SENSITIVE_PATH_PATTERNS = [
  /^\/api\//, // All API endpoints
  /\/admin\//, // Admin panel
  /\/report\/[a-f0-9-]{36}/, // Individual reports by UUID
  /\/profile\/[a-f0-9-]{36}/, // Individual profiles by UUID
  /\/(wp-admin|wp-login|xmlrpc|\.env|\.git|phpinfo|phpmyadmin)/i, // Vulnerability scanners
  /\/(config|backup|dump|sql|admin\.php|login\.php)/i, // More scanner patterns
];

// ---------------------------------------------------------------------------
// Main classification function
// ---------------------------------------------------------------------------

export function classifyRequest(request: NextRequest): BotClassification {
  // Dev environment — skip all bot detection (allows Playwright, curl, etc.)
  if (process.env.NODE_ENV === "development") {
    return { action: "allow" };
  }

  const ua = request.headers.get("user-agent") || "";
  const pathname = request.nextUrl.pathname;

  // --- Check vulnerability scanners (common automated attacks) ---
  if (
    /\.(php|asp|aspx|jsp|cgi)$/i.test(pathname) ||
    /\/(wp-|wordpress|phpmy|\.env|\.git|config\.|backup)/i.test(pathname)
  ) {
    return {
      action: "block",
      reason: "vulnerability_scanner",
      category: "automation",
    };
  }

  // --- Layer 1: UA-based detection ---

  // AI training crawlers — hard block
  for (const bot of AI_CRAWLERS) {
    if (ua.includes(bot)) {
      return {
        action: "block",
        reason: `ai_crawler:${bot}`,
        category: "ai_crawler",
      };
    }
  }

  // Scraping services — hard block
  for (const bot of SCRAPER_BOTS) {
    if (ua.includes(bot)) {
      return { action: "block", reason: `scraper:${bot}`, category: "scraper" };
    }
  }

  // Automation frameworks — hard block
  for (const marker of AUTOMATION_MARKERS) {
    if (ua.includes(marker)) {
      return {
        action: "block",
        reason: `automation:${marker}`,
        category: "automation",
      };
    }
  }

  // Social preview + search engine allowlist — explicitly permitted so that
  // short-UA bots (Twitterbot/1.0 = 13 chars, LinkedInBot/1.0 = 15 chars)
  // can fetch /api/og for share previews and HTML pages for SEO indexing
  // without being caught by the short-UA + sensitive-path rule below.
  // Placed AFTER the blocklists so AI training variants (Google-Extended,
  // Applebot-Extended) lose to the blocklist as intended.
  for (const bot of ALLOWED_SOCIAL_AND_SEARCH_BOTS) {
    if (ua.includes(bot)) {
      return { action: "allow", reason: `social_or_search:${bot}` };
    }
  }

  // Empty or very short UA accessing API/sensitive paths — block
  if (
    (!ua || ua.length < 20) &&
    SENSITIVE_PATH_PATTERNS.some((p) => p.test(pathname))
  ) {
    return {
      action: "block",
      reason: "no_ua_sensitive_path",
      category: "suspicious",
    };
  }

  // --- Layer 2: Header analysis ---
  const suspicion = headerSuspicionScore(request);

  // High suspicion on sensitive paths — block
  if (
    suspicion >= 60 &&
    SENSITIVE_PATH_PATTERNS.some((p) => p.test(pathname))
  ) {
    return {
      action: "block",
      reason: `suspicious_headers:${suspicion}`,
      category: "suspicious",
    };
  }

  // Moderate suspicion — throttle (downstream rate limiter will be more aggressive)
  if (suspicion >= 50) {
    return {
      action: "throttle",
      reason: `header_score:${suspicion}`,
      category: "suspicious",
    };
  }

  // --- All checks passed ---
  return { action: "allow" };
}
