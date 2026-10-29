/**
 * Numérotation : chaque clic place une pastille 1, 2, 3… (numérotation propre à l'écran).
 */
import { badgeRadius, nextBadgeNumber } from '../shapes/badge-geometry';
import type { Tool } from './tool';

export const badgeTool: Tool = {
  id: 'number',
  cursor: 'crosshair',

  onPointerDown(e, ctx) {
    const shapes = ctx.getShapes();
    ctx.commitShapes([
      ...shapes,
      {
        id: crypto.randomUUID(),
        kind: 'badge',
        x: e.clientX,
        y: e.clientY,
        number: nextBadgeNumber(shapes),
        radius: badgeRadius(ctx.state.size),
        color: ctx.state.color,
      },
    ]);
  },

  onPointerMove() {
    /* rien : la pastille est posée à l'appui */
  },

  onPointerUp() {
    /* rien */
  },
};
