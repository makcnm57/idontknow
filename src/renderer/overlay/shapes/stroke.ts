/**
 * Rendu canvas d'un tracé à main levée.
 */
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
  ctx.fillStyle = shape.color;
  ctx.fill(path);
}
