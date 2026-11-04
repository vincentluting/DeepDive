// ============================================================
// lib/questionnaire/ barrel — re-exports all questionnaire data
// ============================================================
// v3.0 module-based questionnaire: SJT + TwIVI + IPIP-60 + Reality
// v2.0 data (IPIP-NEO-120) retained for Ultra-Deep and backward compat
// ============================================================

// ============================================================
// Module A: SJT (6 scenarios)
// ============================================================

export { SJT_SCENARIOS, SJT_INSTRUCTIONS } from "./module-a-sjt";

// ============================================================
// Module B (v3.0): TwIVI (20 items — Twenty-Item Values Inventory, Sandy et al. 2017)
// ============================================================

export {
  DDVQ21_ITEMS,
  DDVQ21_VALUE_MAP,
  DDVQ_INSTRUCTIONS,
  DDVQ_SCALE_LABELS,
} from "./module-b-ddvq21";

// ============================================================
// Module C: IPIP-NEO-120 (120 items — item source pool for IPIP-60/30, reserved for Ultra-Deep)
// ============================================================

export {
  IPIP_NEO_120_ITEMS,
  REVERSED_ITEMS,
  FACET_MAP,
  DOMAIN_FACETS,
  IPIP_INSTRUCTIONS,
  IPIP_SCALE_LABELS,
} from "./module-c-ipip120";

// ============================================================
// Module C (v3.0): IPIP-60 (60 items — standard-level Big Five)
// ============================================================

export {
  IPIP_60_ITEM_IDS,
  IPIP_60_ITEMS,
  IPIP_60_FACET_ITEM_MAP,
  IPIP_60_PRESENTATION_ORDER,
  IPIP_60_ITEM_DOMAIN_MAP,
  DOMAIN_FACETS as IPIP_NEO60_DOMAIN_FACETS,
} from "./module-c-ipip-neo60";

// ============================================================
// Constants
// ============================================================

export {
  QUESTIONNAIRE_VERSION,
  TOTAL_QUESTIONS,
  MODULE_INFO,
  IPIP_CHAPTERS,
  MICRO_INSIGHT_TRIGGERS,
  MODULE_DEPTH_COLORS,
  ZONE_CONFIG,
  getZonesForTier,
  getZoneForModule,
  type OceanZone,
} from "./constants";

// ============================================================
// Module Resolver — Dynamic module inclusion for assessment entry paths
// ============================================================

export {
  resolveDeepDiveModules,
  resolveDeepDiveModulesFromData,
  type ResolvedModules,
} from "./module-resolver";
