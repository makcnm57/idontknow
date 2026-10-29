/**
 * Surligneur : trait large, de largeur constante et semi-transparent
 * (rendu dans `shapes/stroke.ts`).
 */
import { HIGHLIGHTER_SIZE_FACTOR } from '@shared/palette';
import { createFreehandTool } from './freehand';

export const highlighterTool = createFreehandTool({
  tool: 'highlighter',
  sizeFactor: HIGHLIGHTER_SIZE_FACTOR,
  cursor: 'crosshair',
});
