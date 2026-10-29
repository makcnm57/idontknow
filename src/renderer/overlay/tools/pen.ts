/**
 * Stylo : tracé à main levée, sensible à la pression avec un stylet.
 */
import type { StrokeShape } from '@shared/types';
import { toStrokePoint, type Tool } from './tool';

let current: StrokeShape | null = null;

export const penTool: Tool = {
  id: 'pen',
  cursor: 'crosshair',

  onPointerDown(e, ctx) {
    current = {
      id: crypto.randomUUID(),
      kind: 'stroke',
      tool: 'pen',
      color: ctx.state.color,
      size: ctx.state.size,
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
