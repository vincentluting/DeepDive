// ============================================================
// Tests for Internal Traffic Detection
// ============================================================

import { describe, it, expect } from 'vitest';
import { detectInternalTraffic } from '../internal-traffic';

describe('detectInternalTraffic', () => {
  // ============================================================
  // Happy path — real production traffic
  // ============================================================

  describe('production traffic (not internal)', () => {
    it('returns false for normal browser with no referer', () => {
      const result = detectInternalTraffic({
        referer: null,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      });
      expect(result.isInternal).toBe(false);
      expect(result.reason).toBeNull();
    });

    it('returns false for production domain self-referral', () => {
      const result = detectInternalTraffic({
        referer: 'https://deepdivecareer.com/explore',
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
      });
      expect(result.isInternal).toBe(false);
    });

    it('returns false for www production domain referral', () => {
      const result = detectInternalTraffic({
        referer: 'https://www.deepdivecareer.com/about',
        userAgent: null,
      });
      expect(result.isInternal).toBe(false);
    });

    it('returns false for production Vercel URL referral', () => {
      const result = detectInternalTraffic({
        referer: 'https://v0-career-exploration-questionnaire.vercel.app/',
        userAgent: null,
      });
      expect(result.isInternal).toBe(false);
    });

    it('returns false for external referral', () => {
      const result = detectInternalTraffic({
        referer: 'https://google.com/search?q=career',
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
      });
      expect(result.isInternal).toBe(false);
    });
  });

  // ============================================================
  // Internal UA patterns
  // ============================================================

  describe('internal user-agent detection', () => {
    it('detects vercel-screenshot as internal', () => {
      const result = detectInternalTraffic({
        referer: null,
        userAgent: 'vercel-screenshot/1.0',
      });
      expect(result.isInternal).toBe(true);
      expect(result.reason).toBe('Vercel internal service');
    });

    it('detects vercel-favicon as internal', () => {
      const result = detectInternalTraffic({
        referer: null,
        userAgent: 'vercel-favicon/1.0',
      });
      expect(result.isInternal).toBe(true);
    });

    it('detects vercel-og as internal', () => {
      const result = detectInternalTraffic({
        referer: null,
        userAgent: 'vercel-og/1.0',
      });
      expect(result.isInternal).toBe(true);
    });

    it('detects Claude-Code as internal', () => {
      const result = detectInternalTraffic({
        referer: null,
        userAgent: 'Mozilla/5.0 Claude-Code/1.0',
      });
      expect(result.isInternal).toBe(true);
    });

    it('detects Anthropic-AI as internal', () => {
      const result = detectInternalTraffic({
        referer: null,
        userAgent: 'Anthropic-AI/1.0',
      });
      expect(result.isInternal).toBe(true);
    });
  });

  // ============================================================
  // Internal referer patterns
  // ============================================================

  describe('internal referer detection', () => {
    it('detects Vercel preview deploy referer', () => {
      const result = detectInternalTraffic({
        referer: 'https://v0-career-exploration-questionnaire-abc123.vercel.app/page',
        userAgent: 'Mozilla/5.0 Chrome/120.0.0.0',
      });
      expect(result.isInternal).toBe(true);
      expect(result.reason).toBe('Preview/development referrer');
    });

    it('detects generic .vercel.app preview referer', () => {
      const result = detectInternalTraffic({
        referer: 'https://some-other-project.vercel.app',
        userAgent: null,
      });
      expect(result.isInternal).toBe(true);
    });

    it('detects localhost referer', () => {
      const result = detectInternalTraffic({
        referer: 'http://localhost:3000/test',
        userAgent: null,
      });
      expect(result.isInternal).toBe(true);
    });

    it('detects 127.0.0.1 referer', () => {
      const result = detectInternalTraffic({
        referer: 'http://127.0.0.1:3000/test',
        userAgent: null,
      });
      expect(result.isInternal).toBe(true);
    });

    it('detects ngrok tunnel referer', () => {
      const result = detectInternalTraffic({
        referer: 'https://abc123.ngrok.io/test',
        userAgent: null,
      });
      expect(result.isInternal).toBe(true);
    });
  });

  // ============================================================
  // Edge cases
  // ============================================================

  describe('edge cases', () => {
    it('returns not internal when both referer and UA are null', () => {
      const result = detectInternalTraffic({
        referer: null,
        userAgent: null,
      });
      expect(result.isInternal).toBe(false);
    });

    it('UA check takes priority over referer check', () => {
      // If UA matches internal pattern, it returns immediately
      const result = detectInternalTraffic({
        referer: 'https://deepdivecareer.com/explore', // production (not internal)
        userAgent: 'vercel-screenshot/1.0', // internal
      });
      expect(result.isInternal).toBe(true);
      expect(result.reason).toBe('Vercel internal service');
    });

    it('handles malformed referer URL gracefully', () => {
      const result = detectInternalTraffic({
        referer: 'not-a-valid-url',
        userAgent: null,
      });
      // URL parsing fails, falls through to pattern matching
      // "not-a-valid-url" doesn't match any internal patterns
      expect(result.isInternal).toBe(false);
    });

    it('handles referer that matches internal pattern even with bad URL', () => {
      const result = detectInternalTraffic({
        referer: 'localhost:3000',
        userAgent: null,
      });
      // URL parsing will fail but pattern /localhost/i will match
      expect(result.isInternal).toBe(true);
    });
  });
});
