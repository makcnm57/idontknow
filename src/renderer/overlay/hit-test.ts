/**
 * Hit-test des formes (logique pure) : la gomme supprime les éléments touchés.
 */
import type {
  EllipseShape,
  LineShape,
  Point,
  RectShape,
  Shape,
  StrokeShape,
  TextShape,
} from '@shared/types';
import { arrowHead } from './shapes/shape-geometry';

export type { Point };

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

/** Ligne ou flèche : le segment, plus les deux côtés de la pointe. */
export function hitLine(shape: LineShape, p: Point, radius: number): boolean {
  const reach = radius + shape.size / 2;
  if (distanceToSegment(p, shape.from, shape.to) <= reach) return true;
  if (!shape.arrow) return false;
  const [left, tip, right] = arrowHead(shape.from, shape.to, shape.size);
  return distanceToSegment(p, left, tip) <= reach || distanceToSegment(p, right, tip) <= reach;
}

/** Rectangle : l'intérieur s'il est plein, sinon seulement ses bords. */
export function hitRect(shape: RectShape, p: Point, radius: number): boolean {
  const reach = radius + shape.size / 2;
  const { x, y, width, height } = shape;
  const inside =
    p.x >= x - reach && p.x <= x + width + reach && p.y >= y - reach && p.y <= y + height + reach;
  if (!inside) return false;
  if (shape.fill) return true;
  const corners: Point[] = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
  return corners.some((corner, i) => {
    const next = corners[(i + 1) % corners.length] ?? corner;
    return distanceToSegment(p, corner, next) <= reach;
  });
}

/**
 * Ellipse : l'intérieur si elle est pleine, sinon une bande autour du contour.
 * La distance au contour est approchée par l'écart au rayon normalisé, ramené au plus
 * petit rayon : exact pour un cercle, légèrement prudent pour une ellipse allongée.
 */
export function hitEllipse(shape: EllipseShape, p: Point, radius: number): boolean {
  const reach = radius + shape.size / 2;
  const rx = shape.width / 2;
  const ry = shape.height / 2;
  const cx = shape.x + rx;
  const cy = shape.y + ry;
  // Ellipse aplatie (largeur ou hauteur nulle) : c'est un segment.
  if (rx < 1 || ry < 1) {
    return distanceToSegment(p, { x: cx - rx, y: cy - ry }, { x: cx + rx, y: cy + ry }) <= reach;
  }
  const normalized = Math.hypot((p.x - cx) / rx, (p.y - cy) / ry);
  if (shape.fill && normalized <= 1) return true;
  return Math.abs(normalized - 1) * Math.min(rx, ry) <= reach;
}

/** Texte : sa boîte mesurée à la validation. */
export function hitText(shape: TextShape, p: Point, radius: number): boolean {
  return (
    p.x >= shape.x - radius &&
    p.x <= shape.x + shape.width + radius &&
    p.y >= shape.y - radius &&
    p.y <= shape.y + shape.height + radius
  );
}

const hitTesters: {
  [K in Shape['kind']]: (shape: Extract<Shape, { kind: K }>, p: Point, radius: number) => boolean;
} = {
  stroke: hitStroke,
  line: hitLine,
  rect: hitRect,
  ellipse: hitEllipse,
  text: hitText,
};

type HitTester = (shape: Shape, p: Point, radius: number) => boolean;

export function hitShape(shape: Shape, p: Point, radius: number): boolean {
  // La table garantit que le test correspond au `kind` : le transtypage est sûr.
  return (hitTesters[shape.kind] as HitTester)(shape, p, radius);
}

/** Élément affiché au-dessus des autres sous le point (le dernier de la liste), s'il y en a un. */
export function topmostHit(shapes: readonly Shape[], p: Point, radius: number): Shape | undefined {
  return shapes.findLast((shape) => hitShape(shape, p, radius));
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
