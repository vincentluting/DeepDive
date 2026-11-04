// ============================================================
// Tests for Module Resolver — Deep Dive Module Resolution
// ============================================================

import { describe, it, expect } from 'vitest';
import { resolveDeepDiveModulesFromData } from '../module-resolver';

describe('resolveDeepDiveModulesFromData', () => {
  // ── Scenario 1: Standard Deep Dive (all modules) ────────
  it('includes all 3 modules and never includes RIASEC', () => {
    const result = resolveDeepDiveModulesFromData({
      hasQuickDiveResult: true,
      completedModules: {},
    });

    expect(result.includeRIASEC).toBe(false);
    expect(result.includeModuleA).toBe(true);
    expect(result.includeModuleB).toBe(true);
    expect(result.includeModuleC).toBe(true);
    // 6 SJT + 20 TwIVI + 60 IPIP = 86
    expect(result.totalQuestions).toBe(86);
  });

  // ── Scenario 2: hasQuickDiveResult is ignored (always false RIASEC) ──
  it('ignores hasQuickDiveResult — RIASEC is never included', () => {
    const result = resolveDeepDiveModulesFromData({
      hasQuickDiveResult: false,
      completedModules: {},
    });

    expect(result.includeRIASEC).toBe(false);
    expect(result.includeModuleA).toBe(true);
    expect(result.includeModuleB).toBe(true);
    expect(result.includeModuleC).toBe(true);
    expect(result.totalQuestions).toBe(86);
  });

  // ── Scenario 3: Partial Deep Dive — SJT done ───────────
  it('skips completed modules (SJT done)', () => {
    const result = resolveDeepDiveModulesFromData({
      hasQuickDiveResult: true,
      completedModules: { sjt: '2026-02-01T00:00:00Z' },
    });

    expect(result.includeRIASEC).toBe(false);
    expect(result.includeModuleA).toBe(false);
    expect(result.includeModuleB).toBe(true);
    expect(result.includeModuleC).toBe(true);
    // 20 TwIVI + 60 IPIP = 80
    expect(result.totalQuestions).toBe(80);
  });

  // ── Scenario 4: Partial Deep Dive — SJT + DDVQ done ────
  it('skips completed modules (SJT + DDVQ done)', () => {
    const result = resolveDeepDiveModulesFromData({
      hasQuickDiveResult: true,
      completedModules: {
        sjt: '2026-02-01T00:00:00Z',
        ddvq: '2026-02-01T00:00:00Z',
      },
    });

    expect(result.includeRIASEC).toBe(false);
    expect(result.includeModuleA).toBe(false);
    expect(result.includeModuleB).toBe(false);
    expect(result.includeModuleC).toBe(true);
    // 60 IPIP only
    expect(result.totalQuestions).toBe(60);
  });

  // ── Scenario 5: All modules completed ──────────────────
  it('returns zero questions when everything is complete', () => {
    const result = resolveDeepDiveModulesFromData({
      hasQuickDiveResult: true,
      completedModules: {
        sjt: '2026-02-01T00:00:00Z',
        ddvq: '2026-02-01T00:00:00Z',
        ipip60: '2026-02-01T00:00:00Z',
      },
    });

    expect(result.includeRIASEC).toBe(false);
    expect(result.includeModuleA).toBe(false);
    expect(result.includeModuleB).toBe(false);
    expect(result.includeModuleC).toBe(false);
    expect(result.totalQuestions).toBe(0);
    expect(result.estimatedMinutes).toBe(0);
  });

  // ── Time estimation ─────────────────────────────────────
  it('calculates reasonable time estimates', () => {
    const full = resolveDeepDiveModulesFromData({
      hasQuickDiveResult: true,
      completedModules: {},
    });
    const partial = resolveDeepDiveModulesFromData({
      hasQuickDiveResult: true,
      completedModules: { sjt: '2026-02-01T00:00:00Z' },
    });

    // Full should take longer than partial
    expect(full.estimatedMinutes).toBeGreaterThan(partial.estimatedMinutes);
    // Both should be reasonable (5-25 minutes)
    expect(full.estimatedMinutes).toBeGreaterThanOrEqual(5);
    expect(full.estimatedMinutes).toBeLessThanOrEqual(25);
    expect(partial.estimatedMinutes).toBeGreaterThanOrEqual(5);
    expect(partial.estimatedMinutes).toBeLessThanOrEqual(25);
  });
});
