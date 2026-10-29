/**
 * Fabrique des outils de forme tracée par glissé (ligne, flèche, rectangle, ellipse) :
 * appui = point de départ, déplacement = aperçu, relâchement = forme validée.
 * Maj enfoncé pendant le glissé applique la contrainte de la forme (45°, carré, cercle).
 */
import type { Point, Shape, ToolId } from '@shared/types';
import type { Tool, ToolContext } from './tool';

/** En dessous de cette taille (pixels CSS), un glissé est un simple clic : rien n'est créé. */
const MIN_DRAG = 3;

interface DragShapeOptions {
  id: ToolId;
  /** Construit la forme entre `start` et `current` ; `constrain` vaut vrai si Maj est enfoncé. */
  build(id: string, start: Point, current: Point, constrain: boolean, ctx: ToolContext): Shape;
}

export function createDragShapeTool({ id, build }: DragShapeOptions): Tool {
  let start: Point | null = null;
  let shape: Shape | null = null;
  let shapeId = '';

  const update = (e: PointerEvent, ctx: ToolContext): void => {
    if (!start) return;
    shape = build(shapeId, start, { x: e.clientX, y: e.clientY }, e.shiftKey, ctx);
    ctx.setPreview(shape);
  };

  return {
    id,
    cursor: 'crosshair',

    onPointerDown(e) {
      start = { x: e.clientX, y: e.clientY };
      shapeId = crypto.randomUUID();
      shape = null;
    },

    onPointerMove: update,

    onPointerUp(e, ctx) {
      update(e, ctx);
      const end = { x: e.clientX, y: e.clientY };
      const dragged = start && Math.hypot(end.x - start.x, end.y - start.y) >= MIN_DRAG;
      if (shape && dragged) ctx.commitShapes([...ctx.getShapes(), shape]);
      start = null;
      shape = null;
      ctx.setPreview(null);
    },
  };
}
