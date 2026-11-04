/**
 * Bot / crawler detection via User-Agent pattern matching.
 * Used by the page tracking layer to flag automated visits.
 */

const BOT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  // Major search engines
  { pattern: /Googlebot/i, name: 'Googlebot' },
  { pattern: /Bingbot/i, name: 'Bingbot' },
  { pattern: /Baiduspider/i, name: 'Baiduspider' },
  { pattern: /YandexBot/i, name: 'YandexBot' },
  { pattern: /DuckDuckBot/i, name: 'DuckDuckBot' },
  { pattern: /Sogou/i, name: 'Sogou' },
  { pattern: /Yahoo! Slurp/i, name: 'Yahoo Slurp' },

  // Social media
  { pattern: /facebookexternalhit/i, name: 'Facebook' },
  { pattern: /Twitterbot/i, name: 'Twitterbot' },
  { pattern: /LinkedInBot/i, name: 'LinkedInBot' },
  { pattern: /WhatsApp/i, name: 'WhatsApp' },
  { pattern: /TelegramBot/i, name: 'TelegramBot' },
  { pattern: /Slackbot/i, name: 'Slackbot' },

  // SEO / monitoring tools
  { pattern: /AhrefsBot/i, name: 'AhrefsBot' },
  { pattern: /SemrushBot/i, name: 'SemrushBot' },
  { pattern: /MJ12bot/i, name: 'MJ12bot' },
  { pattern: /DotBot/i, name: 'DotBot' },
  { pattern: /PetalBot/i, name: 'PetalBot' },
  { pattern: /Bytespider/i, name: 'Bytespider' },

  // AI crawlers
  { pattern: /GPTBot/i, name: 'GPTBot' },
  { pattern: /ChatGPT-User/i, name: 'ChatGPT' },
  { pattern: /Claude-Web/i, name: 'Claude' },
  { pattern: /CCBot/i, name: 'CCBot' },
  { pattern: /anthropic-ai/i, name: 'Anthropic' },

  // Vercel internal services
  { pattern: /vercel-screenshot/i, name: 'Vercel Screenshot' },
  { pattern: /vercel-favicon/i, name: 'Vercel Favicon' },
  { pattern: /vercel-og/i, name: 'Vercel OG Image' },
  { pattern: /vercel-edge-functions/i, name: 'Vercel Edge' },
  { pattern: /vercel\//i, name: 'Vercel Service' },

  // Generic patterns (check last)
  { pattern: /bot\b/i, name: 'Bot' },
  { pattern: /crawler/i, name: 'Crawler' },
  { pattern: /spider/i, name: 'Spider' },
  { pattern: /scraper/i, name: 'Scraper' },
  { pattern: /headless/i, name: 'Headless' },
  { pattern: /phantom/i, name: 'Phantom' },
  { pattern: /selenium/i, name: 'Selenium' },
  { pattern: /puppeteer/i, name: 'Puppeteer' },
  { pattern: /wget/i, name: 'Wget' },
  { pattern: /curl\//i, name: 'cURL' },
  { pattern: /python-requests/i, name: 'Python Requests' },
  { pattern: /axios\//i, name: 'Axios' },
  { pattern: /node-fetch/i, name: 'Node Fetch' },
  { pattern: /Go-http-client/i, name: 'Go HTTP' },
  { pattern: /Java\//i, name: 'Java Client' },

  // API testing tools
  { pattern: /Postman/i, name: 'Postman' },
  { pattern: /Insomnia/i, name: 'Insomnia' },
  { pattern: /httpie/i, name: 'HTTPie' },
];

export interface BotDetectionResult {
  isBot: boolean;
  botName: string | null;
}

export function detectBot(userAgent: string | null): BotDetectionResult {
  if (!userAgent) {
    return { isBot: true, botName: 'Unknown (no UA)' };
  }

  for (const { pattern, name } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, botName: name };
    }
  }

  return { isBot: false, botName: null };
}
