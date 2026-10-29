/**
 * Sélection : un clic sélectionne l'élément du dessus, glisser le déplace.
 * Tout le glissé forme une seule étape d'historique ; un clic dans le vide désélectionne.
 */
import type { Point, Shape } from '@shared/types';
import { topmostHit } from '../hit-test';
import { translateShape } from '../shapes/transform';
import type { Tool } from './tool';

/** Tolérance autour des formes pour les attraper (pixels CSS). */
const PICK_RADIUS = 6;
/** En dessous de ce déplacement, c'est un clic : rien ne bouge. */
const DRAG_THRESHOLD = 2;

interface DragState {
  start: Point;
  /** Forme telle qu'au début du glissé : chaque position est recalculée depuis elle. */
  original: Shape;
  index: number;
  moved: boolean;
}

let drag: DragState | null = null;

export const selectTool: Tool = {
  id: 'select',
  cursor: 'default',

  onPointerDown(e, ctx) {
    const start = { x: e.clientX, y: e.clientY };
    const shapes = ctx.getShapes();
    const hit = topmostHit(shapes, start, PICK_RADIUS);
    ctx.setSelection(hit?.id ?? null);
    drag = hit ? { start, original: hit, index: shapes.indexOf(hit), moved: false } : null;
  },

  onPointerMove(e, ctx) {
    if (!drag) return;
    const dx = e.clientX - drag.start.x;
    const dy = e.clientY - drag.start.y;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    const next = [...ctx.getShapes()];
    next[drag.index] = translateShape(drag.original, dx, dy);
    // Premier mouvement : nouvelle étape ; les suivants la complètent.
    if (drag.moved) ctx.amendShapes(next);
    else ctx.commitShapes(next);
    drag.moved = true;
  },

  onPointerUp() {
    drag = null;
  },
};
