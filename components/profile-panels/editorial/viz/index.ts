/**
 * Editorial data visualisations for the Personal Monograph.
 *
 * Each file exports one or two primitives that replace a previous
 * chart/bar idiom with an editorial, SVG-only equivalent. No third-party
 * chart library dependencies — all rely on rev-* CSS variables.
 */
export { SpectrumBar } from "./spectrum-bar";
export type { SpectrumBarProps } from "./spectrum-bar";
export { TerrainLine } from "./terrain-line";
export type { TerrainPoint } from "./terrain-line";
export { Astrolabe } from "./astrolabe";
export type { AstrolabePoint } from "./astrolabe";
export { PhaseDiagram } from "./phase-diagram";
export type { PhaseDiagramProps } from "./phase-diagram";
export { CompassRose } from "./compass-rose";
export type { CompassRoseProps, CompassDirection } from "./compass-rose";
