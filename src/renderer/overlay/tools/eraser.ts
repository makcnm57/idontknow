/**
 * Gomme vectorielle : supprime les éléments entiers touchés, pas des pixels.
 * Tout un passage de gomme (de l'appui au relâchement) forme une seule étape d'historique.
 */
import { ERASER_DIAMETER } from '@shared/palette';
import { hitShape, interpolate, type Point } from '../hit-test';
import type { Tool, ToolContext } from './tool';

const RADIUS = ERASER_DIAMETER / 2;

/** Curseur : cercle de la taille de la zone effacée, centré sur la pointe. */
const CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${ERASER_DIAMETER + 2}" height="${ERASER_DIAMETER + 2}"><circle cx="${RADIUS + 1}" cy="${RADIUS + 1}" r="${RADIUS}" fill="rgba(255,255,255,0.35)" stroke="#1c1c1e" stroke-width="1.5"/></svg>`;
const CURSOR = `url("data:image/svg+xml,${encodeURIComponent(CURSOR_SVG)}") ${RADIUS + 1} ${RADIUS + 1}, cell`;

let lastPoint: Point | null = null;
let erasedInGesture = false;

/** Efface les formes touchées le long du déplacement depuis le dernier point. */
function eraseAlong(to: Point, ctx: ToolContext): void {
  const samples = lastPoint ? interpolate(lastPoint, to, RADIUS) : [to];
  lastPoint = to;

  const shapes = ctx.getShapes();
  const remaining = shapes.filter((shape) => !samples.some((p) => hitShape(shape, p, RADIUS)));
  if (remaining.length === shapes.length) return;

  // Premier effacement du geste : nouvelle étape ; les suivants la complètent.
  if (erasedInGesture) ctx.amendShapes(remaining);
  else ctx.commitShapes(remaining);
  erasedInGesture = true;
}

export const eraserTool: Tool = {
  id: 'eraser',
  cursor: CURSOR,

  onPointerDown(e, ctx) {
    lastPoint = null;
    erasedInGesture = false;
    eraseAlong({ x: e.clientX, y: e.clientY }, ctx);
  },

  onPointerMove(e, ctx) {
    eraseAlong({ x: e.clientX, y: e.clientY }, ctx);
  },

  onPointerUp() {
    lastPoint = null;
    erasedInGesture = false;
  },
};
