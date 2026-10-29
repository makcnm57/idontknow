/**
 * Rendu canvas d'un tracé à main levée (stylo ou surligneur).
 */
import { HIGHLIGHTER_OPACITY } from '@shared/palette';
import type { StrokeShape } from '@shared/types';
import { outlineToSvgPath, strokeOutline } from './stroke-geometry';

/**
 * Chemins des tracés terminés, calculés une seule fois. Une forme validée n'est plus
 * jamais modifiée : la WeakMap libère l'entrée quand la forme disparaît de l'historique.
 */
const pathCache = new WeakMap<StrokeShape, Path2D>();

function buildPath(shape: StrokeShape, complete: boolean): Path2D {
  return new Path2D(outlineToSvgPath(strokeOutline(shape, complete)));
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  shape: StrokeShape,
  complete: boolean,
): void {
  let path = complete ? pathCache.get(shape) : undefined;
  if (!path) {
    path = buildPath(shape, complete);
    if (complete) pathCache.set(shape, path);
  }

  ctx.save();
  if (shape.tool === 'highlighter') {
    // Le contour est un seul polygone : un trait qui se recoupe ne fonce pas.
    // `multiply` ne s'applique qu'entre annotations : le canvas ne voit pas le bureau.
    ctx.globalAlpha = HIGHLIGHTER_OPACITY;
    ctx.globalCompositeOperation = 'multiply';
  }
  ctx.fillStyle = shape.color;
  ctx.fill(path);
  ctx.restore();
}
