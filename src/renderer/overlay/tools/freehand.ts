/**
 * Fabrique des outils de tracé à main levée (stylo, surligneur) : même geste,
 * seuls le type de tracé, la largeur et le curseur changent.
 */
import type { StrokeShape } from '@shared/types';
import { toStrokePoint, type Tool } from './tool';

interface FreehandOptions {
  tool: StrokeShape['tool'];
  /** Multiplicateur appliqué à la taille choisie. */
  sizeFactor: number;
  cursor: string;
}

export function createFreehandTool({ tool, sizeFactor, cursor }: FreehandOptions): Tool {
  let current: StrokeShape | null = null;

  return {
    id: tool,
    cursor,

    onPointerDown(e, ctx) {
      current = {
        id: crypto.randomUUID(),
        kind: 'stroke',
        tool,
        color: ctx.state.color,
        size: ctx.state.size * sizeFactor,
        // Seul un vrai stylet fournit une pression ; sinon on la simule par la vitesse.
        simulatePressure: e.pointerType !== 'pen',
        points: [toStrokePoint(e)],
      };
      ctx.setPreview(current);
    },

    onPointerMove(e, ctx) {
      if (!current) return;
      current.points.push(toStrokePoint(e));
      ctx.setPreview(current);
    },

    onPointerUp(_e, ctx) {
      if (!current) return;
      // À partir d'ici la forme est figée : elle ne sera plus jamais modifiée.
      ctx.commitShapes([...ctx.getShapes(), current]);
      current = null;
      ctx.setPreview(null);
    },
  };
}
