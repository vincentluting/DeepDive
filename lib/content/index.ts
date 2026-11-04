// lib/content/index.ts
// Deep Dive — Content Library Barrel Export

export type { ArchetypeContent } from "./types";
export { ARCHETYPES, getArchetypeContent } from "./archetypes-12";
export type { TermDefinition } from "./term-glossary";
export { TERM_GLOSSARY, getTermText } from "./term-glossary";
export type { ArchetypeRelation } from "./archetype-relations";
export {
  ARCHETYPE_RELATIONS,
  getArchetypeRelations,
} from "./archetype-relations";
export type { GrowthPath } from "./archetype-growth";
export { ARCHETYPE_GROWTH, getArchetypeGrowth } from "./archetype-growth";
