// ============================================================
// Statistical testing utilities — zero external dependencies
// Used by Insights Tab for A/B test significance
// ============================================================

/**
 * Chi-square test for a 2×2 contingency table.
 *
 *               | Group A | Group B |
 *  Success      |    a    |    b    |
 *  Failure      |    c    |    d    |
 *
 * Returns chi-square statistic and approximate p-value (df=1).
 */
export function chiSquare2x2(
  a: number, b: number, c: number, d: number
): { chiSq: number; pValue: number } {
  const n = a + b + c + d;
  if (n === 0) return { chiSq: 0, pValue: 1 };

  // Yates' continuity correction for small samples
  const num = n * (Math.abs(a * d - b * c) - n / 2) ** 2;
  const denom = (a + b) * (c + d) * (a + c) * (b + d);

  if (denom === 0) return { chiSq: 0, pValue: 1 };

  const chiSq = num / denom;
  const pValue = chiSquarePValue(chiSq);

  return { chiSq: Math.round(chiSq * 1000) / 1000, pValue };
}

/**
 * Approximate p-value for chi-square distribution with df=1.
 * Uses the complementary error function (erfc) approximation.
 */
function chiSquarePValue(chiSq: number): number {
  if (chiSq <= 0) return 1;
  // For df=1, p-value = erfc(sqrt(chiSq/2))
  const z = Math.sqrt(chiSq / 2);
  // Abramowitz & Stegun approximation for erfc
  const t = 1 / (1 + 0.3275911 * z);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erfc = poly * Math.exp(-z * z);
  return Math.round(erfc * 10000) / 10000;
}

/**
 * Cohen's h — effect size for the difference between two proportions.
 * h = 2 * arcsin(sqrt(p1)) - 2 * arcsin(sqrt(p2))
 *
 * |h| < 0.2  = small
 * |h| 0.2-0.5 = medium
 * |h| > 0.8  = large
 */
export function cohenH(p1: number, p2: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const h = 2 * Math.asin(Math.sqrt(clamp(p1))) - 2 * Math.asin(Math.sqrt(clamp(p2)));
  return Math.round(Math.abs(h) * 1000) / 1000;
}

/**
 * Significance label based on p-value.
 */
export function significanceLabel(pValue: number): 'significant' | 'marginal' | 'not_significant' {
  if (pValue < 0.05) return 'significant';
  if (pValue < 0.10) return 'marginal';
  return 'not_significant';
}

// ── Paired t-test & Cohen's d (for Pre/Post assessment) ─────

/**
 * Paired (dependent) t-test.
 * Returns mean difference, t-statistic, and two-tailed p-value.
 * Requires at least 5 paired observations.
 */
export function pairedTTest(
  pre: number[],
  post: number[],
): { meanDelta: number; t: number; df: number; pValue: number } | null {
  if (pre.length < 5 || pre.length !== post.length) return null;

  const n = pre.length;
  const diffs = pre.map((v, i) => post[i] - v);
  const meanD = diffs.reduce((a, b) => a + b, 0) / n;
  const variance = diffs.reduce((s, d) => s + (d - meanD) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance / n);

  if (se === 0) return { meanDelta: meanD, t: 0, df: n - 1, pValue: meanD === 0 ? 1 : 0 };

  const t = meanD / se;
  const df = n - 1;
  const abst = Math.abs(t);

  // Two-tailed p-value: normal approx for df≥30, adjusted t-CDF otherwise
  const p = df >= 30
    ? 2 * (1 - normalCDF(abst))
    : 2 * (1 - tCDFApprox(abst, df));

  return {
    meanDelta: Math.round(meanD * 1000) / 1000,
    t: Math.round(t * 1000) / 1000,
    df,
    pValue: Math.round(Math.max(0, Math.min(1, p)) * 10000) / 10000,
  };
}

/**
 * Cohen's d (paired / dependent) — standardized effect size.
 * d = mean(post - pre) / SD(post - pre)
 *
 * |d| < 0.2  = negligible
 * |d| 0.2-0.5 = small
 * |d| 0.5-0.8 = medium
 * |d| > 0.8  = large
 */
export function cohenDPaired(pre: number[], post: number[]): number | null {
  if (pre.length < 2 || pre.length !== post.length) return null;

  const n = pre.length;
  const diffs = pre.map((v, i) => post[i] - v);
  const meanD = diffs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(diffs.reduce((s, d) => s + (d - meanD) ** 2, 0) / (n - 1));

  if (sd === 0) return 0;
  return Math.round((meanD / sd) * 1000) / 1000;
}

/**
 * Effect size label based on |Cohen's d|.
 */
export function effectSizeLabel(d: number): 'negligible' | 'small' | 'medium' | 'large' {
  const abs = Math.abs(d);
  if (abs < 0.2) return 'negligible';
  if (abs < 0.5) return 'small';
  if (abs < 0.8) return 'medium';
  return 'large';
}

// ── Power analysis (sample size estimation) ─────────────────

/**
 * Quick helper: required n per group to detect a given Cohen's h.
 * Assumes equal-sized groups and converts h → p1/p2 using a baseline
 * proportion of 0.50 (conservative / maximum variance).
 */
export function requiredSampleSizeFromH(
  h: number,
  alpha: number = 0.05,
  power: number = 0.80,
): number {
  if (h <= 0) return Infinity;
  // For Cohen's h with equal groups: n = ((z_α/2 + z_β) / h)²
  const zAlpha = normalQuantile(1 - alpha / 2);
  const zBeta = normalQuantile(power);
  return Math.ceil(((zAlpha + zBeta) / h) ** 2);
}

/**
 * Inverse normal (quantile) function.
 * Rational approximation from Abramowitz & Stegun (26.2.23).
 * Valid for 0 < p < 1.
 */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Use symmetry: if p > 0.5, compute for 1-p and negate
  const sign = p < 0.5 ? -1 : 1;
  const pp = p < 0.5 ? p : 1 - p;

  const t = Math.sqrt(-2 * Math.log(pp));
  // Rational approximation constants (Abramowitz & Stegun)
  const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
  const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;

  const result = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  return sign * result;
}

// ── Internal distribution helpers ────────────────────────────

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * ax);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1.0 + sign * y);
}

function tCDFApprox(t: number, df: number): number {
  // Adjusted normal approximation for t-distribution
  const x = t * (1 - 1 / (4 * df));
  return normalCDF(x);
}
