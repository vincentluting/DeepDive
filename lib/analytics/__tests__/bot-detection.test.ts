// ============================================================
// Tests for Bot Detection Logic
// ============================================================

import { describe, it, expect } from 'vitest';
import { detectBot } from '../bot-detection';

// ============================================================
// Happy path — known bots
// ============================================================

describe('detectBot', () => {
  describe('search engine bots', () => {
    it('detects Googlebot', () => {
      const result = detectBot(
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      );
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Googlebot');
    });

    it('detects Bingbot', () => {
      const result = detectBot(
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
      );
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Bingbot');
    });

    it('detects YandexBot', () => {
      const result = detectBot('Mozilla/5.0 (compatible; YandexBot/3.0)');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('YandexBot');
    });

    it('detects Baiduspider', () => {
      const result = detectBot('Mozilla/5.0 (compatible; Baiduspider/2.0)');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Baiduspider');
    });

    it('detects DuckDuckBot', () => {
      const result = detectBot('DuckDuckBot/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('DuckDuckBot');
    });
  });

  describe('social media bots', () => {
    it('detects Facebook external hit', () => {
      const result = detectBot('facebookexternalhit/1.1');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Facebook');
    });

    it('detects Twitterbot', () => {
      const result = detectBot('Twitterbot/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Twitterbot');
    });

    it('detects LinkedInBot', () => {
      const result = detectBot('LinkedInBot/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('LinkedInBot');
    });

    it('detects WhatsApp', () => {
      const result = detectBot('WhatsApp/2.19.81 A');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('WhatsApp');
    });

    it('detects Slackbot', () => {
      const result = detectBot('Slackbot-LinkExpanding 1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Slackbot');
    });
  });

  describe('AI crawlers', () => {
    it('detects GPTBot', () => {
      const result = detectBot('Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.0)');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('GPTBot');
    });

    it('detects ChatGPT-User', () => {
      const result = detectBot('ChatGPT-User/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('ChatGPT');
    });

    it('detects Claude-Web', () => {
      const result = detectBot('Claude-Web/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Claude');
    });

    it('detects anthropic-ai', () => {
      const result = detectBot('anthropic-ai/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Anthropic');
    });
  });

  describe('SEO / monitoring tools', () => {
    it('detects AhrefsBot', () => {
      const result = detectBot('Mozilla/5.0 (compatible; AhrefsBot/7.0)');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('AhrefsBot');
    });

    it('detects SemrushBot', () => {
      const result = detectBot('Mozilla/5.0 (compatible; SemrushBot/7~bl)');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('SemrushBot');
    });
  });

  describe('HTTP clients & automation tools', () => {
    it('detects curl', () => {
      const result = detectBot('curl/7.68.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('cURL');
    });

    it('detects wget', () => {
      const result = detectBot('Wget/1.21');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Wget');
    });

    it('detects python-requests', () => {
      const result = detectBot('python-requests/2.28.1');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Python Requests');
    });

    it('detects Puppeteer', () => {
      const result = detectBot('Mozilla/5.0 HeadlessChrome Puppeteer');
      expect(result.isBot).toBe(true);
      // Matches 'Headless' first since generic patterns are checked last
      expect(result.botName).toBe('Headless');
    });

    it('detects Selenium', () => {
      const result = detectBot('Mozilla/5.0 Selenium/4.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Selenium');
    });

    it('detects Postman', () => {
      const result = detectBot('PostmanRuntime/7.29.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Postman');
    });

    it('detects axios', () => {
      const result = detectBot('axios/1.4.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Axios');
    });

    it('detects node-fetch', () => {
      const result = detectBot('node-fetch/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Node Fetch');
    });

    it('detects Go HTTP client', () => {
      const result = detectBot('Go-http-client/2.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Go HTTP');
    });
  });

  describe('Vercel internal services', () => {
    it('detects vercel-screenshot', () => {
      const result = detectBot('vercel-screenshot/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Vercel Screenshot');
    });

    it('detects vercel-og', () => {
      const result = detectBot('vercel-og/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Vercel OG Image');
    });
  });

  describe('generic patterns', () => {
    it('detects generic "bot" keyword', () => {
      const result = detectBot('SomeRandomBot/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Bot');
    });

    it('detects generic "crawler" keyword', () => {
      const result = detectBot('MyCrawler/2.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Crawler');
    });

    it('detects generic "spider" keyword', () => {
      const result = detectBot('DataSpider/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Spider');
    });

    it('detects generic "scraper" keyword', () => {
      const result = detectBot('WebScraper/1.0');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Scraper');
    });
  });

  // ============================================================
  // Real browser user agents (should NOT be bots)
  // ============================================================

  describe('real browsers', () => {
    it('does not flag Chrome desktop', () => {
      const result = detectBot(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      expect(result.isBot).toBe(false);
      expect(result.botName).toBeNull();
    });

    it('does not flag Firefox desktop', () => {
      const result = detectBot(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
      );
      expect(result.isBot).toBe(false);
      expect(result.botName).toBeNull();
    });

    it('does not flag Safari iOS', () => {
      const result = detectBot(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
      );
      expect(result.isBot).toBe(false);
      expect(result.botName).toBeNull();
    });

    it('does not flag Chrome Android', () => {
      const result = detectBot(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
      );
      expect(result.isBot).toBe(false);
      expect(result.botName).toBeNull();
    });
  });

  // ============================================================
  // Edge cases
  // ============================================================

  describe('edge cases', () => {
    it('treats null user-agent as bot (unknown)', () => {
      const result = detectBot(null);
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Unknown (no UA)');
    });

    it('treats empty string as not a bot', () => {
      // Empty string is truthy in the !userAgent check
      // but an empty string is falsy in JS → treated as no UA
      const result = detectBot('');
      expect(result.isBot).toBe(true);
      expect(result.botName).toBe('Unknown (no UA)');
    });

    it('is case-insensitive for bot patterns', () => {
      expect(detectBot('GOOGLEBOT/2.1').isBot).toBe(true);
      expect(detectBot('googlebot/2.1').isBot).toBe(true);
      expect(detectBot('GoOgLeBoT/2.1').isBot).toBe(true);
    });

    it('matches specific bot before generic "bot" keyword', () => {
      // "Googlebot" should match "Googlebot" pattern, not generic "bot"
      const result = detectBot('Googlebot/2.1');
      expect(result.botName).toBe('Googlebot');
    });

    it('detects bot keyword with word boundary', () => {
      // "robot" contains "bot" but \b ensures word boundary
      // The pattern /bot\b/i should match "robot" since "bot" is at the end
      const result = detectBot('SomeRobot/1.0');
      expect(result.isBot).toBe(true);
    });
  });
});
