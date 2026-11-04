// ============================================================
// Compute in-sample Big Five norms (domain + facet) from real
// AssessmentResults, ready to swap into lib/psychometrics/big-five-norms.ts.
//
// WHY: the shipped norms are public IPIP-NEO (Kajonius & Johnson 2019) — a
// WEIRD English-internet sample. For a China-majority study, in-sample norming
// is the methodologically correct endpoint (norms drawn from the same
// population as respondents). This script regenerates the norm constants from
// the platform's own data once N is large enough.
//
// USAGE:
//   node --env-file=.env.local --import tsx scripts/verification/compute-sample-norms.ts
//
// It prints: (1) N + sufficiency verdict, (2) drift vs public norms (flags the
// cross-cultural movers), (3) ready-to-paste IPIP_NEO_DOMAIN_NORMS /
// IPIP_NEO_FACET_NORMS literals. Review the drift, then paste to switch.
//
// ⚠️ Do NOT switch on a small sample — percentile norms need a stable base.
// Rule of thumb: domain norms ~N≥200, facet norms ~N≥300. Below that the
// public anchor is safer; the script refuses to recommend a switch.
// ============================================================

import { sql } from "@/lib/db/connection";
import type { BigFiveDimension } from "@/lib/types";
import {
  IPIP_NEO_DOMAIN_NORMS,
  IPIP_NEO_FACET_NORMS,
} from "@/lib/psychometrics/big-five-norms";

const DOMAIN_SUFFICIENT = 200;
const FACET_SUFFICIENT = 300;

function meanSd(xs: number[]): { mean: number; sd: number; n: number } {
  const n = xs.length;
  if (n === 0) return { mean: 0, sd: 0, n: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  // sample SD (n-1)
  const variance =
    n > 1 ? xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  return { mean, sd: Math.sqrt(variance), n };
}

function rawFromNormalized(v: number): number {
  return v / 25 + 1;
}

(async () => {
  const rows = await sql<{
    resultJson: unknown;
  }>`SELECT "resultJson" FROM "AssessmentResult"`;

  const domainKeys = Object.keys(IPIP_NEO_DOMAIN_NORMS) as BigFiveDimension[];
  const facetKeys = Object.keys(IPIP_NEO_FACET_NORMS);
  const domainVals: Record<string, number[]> = {};
  const facetVals: Record<string, number[]> = {};
  for (const k of domainKeys) domainVals[k] = [];
  for (const k of facetKeys) facetVals[k] = [];

  for (const r of rows) {
    const rj = (
      typeof r.resultJson === "string" ? JSON.parse(r.resultJson) : r.resultJson
    ) as {
      bigFive?: {
        domains?: Record<string, number>;
        domainsNormalized?: Record<string, number>;
        facets?: Record<string, number>;
      };
    } | null;
    const bf = rj?.bigFive;
    if (!bf) continue;
    // Domains: prefer raw 1-5 `domains`, else reconstruct from domainsNormalized.
    const dom = bf.domains ?? null;
    const dn = bf.domainsNormalized ?? null;
    for (const k of domainKeys) {
      const v =
        typeof dom?.[k] === "number"
          ? dom[k]
          : typeof dn?.[k] === "number"
            ? rawFromNormalized(dn[k])
            : null;
      if (v != null) domainVals[k].push(v);
    }
    // Facets: 1-5 means.
    const facets = bf.facets ?? null;
    if (facets) {
      for (const k of facetKeys) {
        if (typeof facets[k] === "number") facetVals[k].push(facets[k]);
      }
    }
  }

  const nDomain = domainVals[domainKeys[0]]?.length ?? 0;
  const nFacet = facetVals[facetKeys[0]]?.length ?? 0;

  console.log(`\n=== In-sample norms from AssessmentResult ===`);
  console.log(
    `rows: ${rows.length} | domain-N: ${nDomain} | facet-N: ${nFacet}`,
  );
  console.log(
    `sufficiency: domain ${nDomain >= DOMAIN_SUFFICIENT ? "OK" : `INSUFFICIENT (<${DOMAIN_SUFFICIENT})`}, facet ${nFacet >= FACET_SUFFICIENT ? "OK" : `INSUFFICIENT (<${FACET_SUFFICIENT})`}`,
  );
  if (nDomain < DOMAIN_SUFFICIENT) {
    console.log(
      `\n⚠️  Sample too small to switch — keep the public IPIP-NEO anchor. Re-run when N grows.`,
    );
  }

  // --- Drift vs public norms (flag cross-cultural movers) ---
  console.log(`\n=== Domain drift (sample − public) ===`);
  for (const k of domainKeys) {
    const s = meanSd(domainVals[k]);
    const pub = IPIP_NEO_DOMAIN_NORMS[k];
    const d = s.mean - pub.mean;
    const flag = Math.abs(d) > 0.2 ? "  ⚠️ large drift" : "";
    console.log(
      `  ${k.padEnd(18)} sample ${s.mean.toFixed(2)}/${s.sd.toFixed(2)}  public ${pub.mean.toFixed(2)}/${pub.sd.toFixed(2)}  Δmean ${d >= 0 ? "+" : ""}${d.toFixed(2)}${flag}`,
    );
  }
  console.log(`\n=== Facet drift (|Δmean|>0.3 only) ===`);
  for (const k of facetKeys) {
    const s = meanSd(facetVals[k]);
    const pub = IPIP_NEO_FACET_NORMS[k];
    const d = s.mean - pub.mean;
    if (Math.abs(d) > 0.3)
      console.log(
        `  ${k.padEnd(24)} sample ${s.mean.toFixed(2)}  public ${pub.mean.toFixed(2)}  Δ ${d >= 0 ? "+" : ""}${d.toFixed(2)}`,
      );
  }

  // --- Ready-to-paste literals ---
  console.log(`\n=== Paste into big-five-norms.ts (when N sufficient) ===`);
  console.log(
    `export const IPIP_NEO_DOMAIN_NORMS: Record<BigFiveDimension, NormParams> = {`,
  );
  for (const k of domainKeys) {
    const s = meanSd(domainVals[k]);
    console.log(
      `  ${k}: { mean: ${s.mean.toFixed(3)}, sd: ${s.sd.toFixed(3)} },`,
    );
  }
  console.log(`};`);
  console.log(
    `export const IPIP_NEO_FACET_NORMS: Record<string, NormParams> = {`,
  );
  for (const k of facetKeys) {
    const s = meanSd(facetVals[k]);
    const key = /[^A-Za-z0-9_]/.test(k) ? `"${k}"` : k;
    console.log(
      `  ${key}: { mean: ${s.mean.toFixed(3)}, sd: ${s.sd.toFixed(3)} },`,
    );
  }
  console.log(`};`);
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
