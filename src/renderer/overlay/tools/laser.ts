/**
 * Pointeur laser : trait lumineux qui s'efface en une seconde, sans laisser de trace
 * dans les annotations ni dans l'historique.
 */
import { LaserTrail } from '../laser-trail';
import type { Tool } from './tool';

/** Traînée de l'overlay, dessinée par `main.ts` sur le calque actif. */
export const laserTrail = new LaserTrail();

const at = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY, time: performance.now() });

export const laserTool: Tool = {
  id: 'laser',
  cursor: 'crosshair',

  onPointerDown(e, ctx) {
    laserTrail.start(at(e));
    ctx.requestActiveRender();
  },

  onPointerMove(e, ctx) {
    laserTrail.add(at(e));
    ctx.requestActiveRender();
  },

  onPointerUp() {
    laserTrail.end();
  },
};
