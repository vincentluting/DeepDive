import { describe, it, expect } from 'vitest';
import { parseReportContext } from '@/lib/coaching/parse-report-context';

describe('parseReportContext', () => {
  // ============================================================
  // Happy path
  // ============================================================

  it('returns empty context for null input', () => {
    const ctx = parseReportContext(null);
    expect(ctx.topRoles).toEqual([]);
    expect(ctx.tensions).toEqual([]);
    expect(ctx.rawSummary).toBe('');
  });

  it('returns empty context for undefined input', () => {
    const ctx = parseReportContext(undefined);
    expect(ctx.topRoles).toEqual([]);
    expect(ctx.tensions).toEqual([]);
  });

  it('parses top_roles from object input', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: {
        top_roles: [{ role_title: 'Designer' }, { role_title: 'Engineer' }],
      },
    });
    expect(ctx.topRoles).toEqual(['Designer', 'Engineer']);
    expect(ctx.rawSummary).toContain('Designer');
  });

  it('parses top_3_primary_roles as fallback', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: {
        top_3_primary_roles: [{ role_title: 'Analyst' }],
      },
    });
    expect(ctx.topRoles).toEqual(['Analyst']);
  });

  it('parses career tensions', () => {
    const ctx = parseReportContext({
      career_tensions: {
        tensions: [
          { tension: 'Freedom vs Security' },
          { description: 'Art vs Commerce' },
        ],
      },
    });
    expect(ctx.tensions).toEqual(['Freedom vs Security', 'Art vs Commerce']);
  });

  it('parses archetype into rawSummary', () => {
    const ctx = parseReportContext({
      archetype_synthesis: {
        primary_archetype: 'The Builder',
        description: 'Creates tangible value',
      },
    });
    expect(ctx.rawSummary).toContain('The Builder');
    expect(ctx.rawSummary).toContain('Creates tangible value');
  });

  it('handles string JSON input', () => {
    const json = JSON.stringify({
      ideal_fit_summary: { top_roles: [{ role_title: 'Researcher' }] },
    });
    const ctx = parseReportContext(json);
    expect(ctx.topRoles).toEqual(['Researcher']);
  });

  it('handles malformed JSON string gracefully', () => {
    const ctx = parseReportContext('{{not valid json');
    expect(ctx.topRoles).toEqual([]);
    expect(ctx.tensions).toEqual([]);
  });

  it('filters out roles with missing role_title', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: {
        top_roles: [{ role_title: 'Valid' }, {}, { role_title: '' }],
      },
    });
    expect(ctx.topRoles).toEqual(['Valid']);
  });

  it('combines all parts into rawSummary', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: { top_roles: [{ role_title: 'PM' }] },
      career_tensions: { tensions: [{ tension: 'T1' }] },
      archetype_synthesis: { primary_archetype: 'Arch', description: 'D' },
    });
    expect(ctx.rawSummary).toContain('Roles: PM');
    expect(ctx.rawSummary).toContain('Tensions: T1');
    expect(ctx.rawSummary).toContain('Archetype: Arch');
  });

  // ============================================================
  // Edge cases — additional coverage
  // ============================================================

  it('prefers top_roles over top_3_primary_roles when both exist', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: {
        top_roles: [{ role_title: 'Primary' }],
        top_3_primary_roles: [{ role_title: 'Fallback' }],
      },
    });
    expect(ctx.topRoles).toEqual(['Primary']);
  });

  it('handles empty string input', () => {
    const ctx = parseReportContext('' as unknown as string);
    expect(ctx.topRoles).toEqual([]);
    expect(ctx.tensions).toEqual([]);
    expect(ctx.rawSummary).toBe('');
  });

  it('handles empty object input', () => {
    const ctx = parseReportContext({});
    expect(ctx.topRoles).toEqual([]);
    expect(ctx.tensions).toEqual([]);
    expect(ctx.rawSummary).toBe('');
  });

  it('handles archetype with primary_archetype but no description', () => {
    const ctx = parseReportContext({
      archetype_synthesis: {
        primary_archetype: 'The Explorer',
      },
    });
    expect(ctx.rawSummary).toContain('Archetype: The Explorer:');
  });

  it('handles archetype with description only (no primary_archetype)', () => {
    const ctx = parseReportContext({
      archetype_synthesis: {
        description: 'Loves adventure',
      },
    });
    // archetypeDesc should be empty since primary_archetype is missing
    expect(ctx.rawSummary).toBe('');
  });

  it('handles tensions with mixed tension and description fields', () => {
    const ctx = parseReportContext({
      career_tensions: {
        tensions: [
          { tension: 'Stability vs Growth', description: 'Ignored when tension exists' },
          { description: 'Only description' },
          { tension: '', description: 'Fallback to description' },
        ],
      },
    });
    // tension field takes precedence; empty tension falls through to description
    expect(ctx.tensions).toEqual([
      'Stability vs Growth',
      'Only description',
      'Fallback to description',
    ]);
  });

  it('handles tensions with all empty/undefined fields', () => {
    const ctx = parseReportContext({
      career_tensions: {
        tensions: [
          {},
          { tension: undefined, description: undefined },
        ],
      },
    });
    expect(ctx.tensions).toEqual([]);
  });

  it('handles deeply nested string JSON', () => {
    const data = {
      ideal_fit_summary: {
        top_roles: [
          { role_title: 'UX Researcher' },
          { role_title: 'Service Designer' },
          { role_title: 'Innovation Consultant' },
        ],
      },
      career_tensions: {
        tensions: [
          { tension: 'Creativity vs Pragmatism' },
        ],
      },
      archetype_synthesis: {
        primary_archetype: 'The Visionary',
        description: 'Sees the big picture and inspires others',
      },
    };
    const ctx = parseReportContext(JSON.stringify(data));
    expect(ctx.topRoles).toHaveLength(3);
    expect(ctx.tensions).toHaveLength(1);
    expect(ctx.rawSummary).toContain('UX Researcher');
    expect(ctx.rawSummary).toContain('Creativity vs Pragmatism');
    expect(ctx.rawSummary).toContain('The Visionary');
  });

  it('rawSummary parts are separated by newlines', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: { top_roles: [{ role_title: 'A' }] },
      career_tensions: { tensions: [{ tension: 'B' }] },
    });
    const parts = ctx.rawSummary.split('\n');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toBe('Roles: A');
    expect(parts[1]).toBe('Tensions: B');
  });

  it('handles roles array with only falsy role_title values', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: {
        top_roles: [
          { role_title: '' },
          { role_title: undefined },
          { role_title: null },
          {},
        ],
      },
    });
    expect(ctx.topRoles).toEqual([]);
    expect(ctx.rawSummary).toBe('');
  });

  it('handles extra unknown fields without error (passthrough)', () => {
    const ctx = parseReportContext({
      ideal_fit_summary: { top_roles: [{ role_title: 'Dev' }] },
      some_unknown_field: { data: 123 },
      another_field: 'hello',
    });
    expect(ctx.topRoles).toEqual(['Dev']);
  });
});
