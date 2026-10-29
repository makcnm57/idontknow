/**
 * Hit-test des formes (logique pure) : la gomme supprime les éléments touchés.
 */
import type { Shape, StrokeShape } from '@shared/types';

export interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Distance d'un point au segment [a, b]. */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  // Projection de p sur la droite (a, b), bornée au segment.
  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Boîte englobante des points d'un tracé, mise en cache (une forme validée ne change plus). */
const boundsCache = new WeakMap<StrokeShape, Bounds>();

function strokeBounds(shape: StrokeShape): Bounds {
  let bounds = boundsCache.get(shape);
  if (!bounds) {
    bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const { x, y } of shape.points) {
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
    boundsCache.set(shape, bounds);
  }
  return bounds;
}

/** Vrai si le disque (p, radius) touche le tracé (épaisseur comprise). */
export function hitStroke(shape: StrokeShape, p: Point, radius: number): boolean {
  const reach = radius + shape.size / 2;
  const b = strokeBounds(shape);
  // Rejet rapide : la plupart des formes sont loin du curseur.
  if (
    p.x < b.minX - reach ||
    p.x > b.maxX + reach ||
    p.y < b.minY - reach ||
    p.y > b.maxY + reach
  ) {
    return false;
  }

  const [first, ...rest] = shape.points;
  if (!first) return false;
  if (rest.length === 0) return Math.hypot(p.x - first.x, p.y - first.y) <= reach;

  let previous = first;
  for (const point of rest) {
    if (distanceToSegment(p, previous, point) <= reach) return true;
    previous = point;
  }
  return false;
}

const hitTesters: {
  [K in Shape['kind']]: (shape: Extract<Shape, { kind: K }>, p: Point, radius: number) => boolean;
} = {
  stroke: hitStroke,
};

export function hitShape(shape: Shape, p: Point, radius: number): boolean {
  return hitTesters[shape.kind](shape, p, radius);
}

/**
 * Points intermédiaires entre deux positions, espacés d'au plus `spacing`.
 * Un mouvement rapide de la gomme ne « saute » ainsi aucun trait fin.
 */
export function interpolate(from: Point, to: Point, spacing: number): Point[] {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / spacing));
  return Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / steps;
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  });
}
