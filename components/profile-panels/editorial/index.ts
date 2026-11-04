/**
 * Editorial primitives for the Personal Monograph profile redesign.
 * Import from here so consumers don't reach into individual files:
 *
 *   import { RevChapter, RevPullquote, RevDropCap } from "@/components/profile-panels/editorial";
 */
export { RevChapter } from "./rev-chapter";
export { RevSpread } from "./rev-spread";
export { RevArtifact } from "./rev-artifact";
export { RevPullquote } from "./rev-pullquote";
export { RevNarrative } from "./rev-narrative";
export { RevDropCap } from "./rev-drop-cap";
export { RevFleuron } from "./rev-fleuron";
export { RevHandRule } from "./rev-hand-rule";
export { RevMarginalia } from "./rev-marginalia";
export { RevBookSpine } from "./rev-book-spine";
export type { SpineChapter } from "./rev-book-spine";
export { RevReadingProgress } from "./rev-reading-progress";
export { Frontispiece } from "./frontispiece";
export {
  SpectrumBar,
  TerrainLine,
  Astrolabe,
  PhaseDiagram,
  CompassRose,
} from "./viz";
export type {
  SpectrumBarProps,
  TerrainPoint,
  AstrolabePoint,
  PhaseDiagramProps,
  CompassRoseProps,
  CompassDirection,
} from "./viz";
