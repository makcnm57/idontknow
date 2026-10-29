/**
 * Stylo : tracé à main levée, sensible à la pression avec un stylet.
 */
import { createFreehandTool } from './freehand';

export const penTool = createFreehandTool({ tool: 'pen', sizeFactor: 1, cursor: 'crosshair' });
