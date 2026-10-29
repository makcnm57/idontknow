/**
 * Géométrie des formes (logique pure) : contraintes Maj, boîtes, pointes de flèche.
 */
import type { Box, Point } from '@shared/types';

const SNAP_ANGLE = Math.PI / 4;

/**
 * Ligne contrainte par Maj : l'angle est arrondi au multiple de 45° le plus proche,
 * la longueur est conservée.
 */
export function constrainLine(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.round(Math.atan2(dy, dx) / SNAP_ANGLE) * SNAP_ANGLE;
  return { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
}

/**
 * Boîte tracée de `start` à `current`, quel que soit le sens du glissé.
 * `square` (Maj) : côtés égaux au plus grand des deux, dans le sens du glissé
 * (carré pour un rectangle, cercle pour une ellipse).
 */
export function boxFromDrag(start: Point, current: Point, square: boolean): Box {
  let dx = current.x - start.x;
  let dy = current.y - start.y;
  if (square) {
    const side = Math.max(Math.abs(dx), Math.abs(dy));
    dx = Math.sign(dx || 1) * side;
    dy = Math.sign(dy || 1) * side;
  }
  return {
    x: Math.min(start.x, start.x + dx),
    y: Math.min(start.y, start.y + dy),
    width: Math.abs(dx),
    height: Math.abs(dy),
  };
}

/** Longueur de la pointe de flèche, proportionnelle à l'épaisseur du trait. */
export function arrowHeadLength(size: number): number {
  return Math.max(12, size * 4);
}

const HEAD_HALF_ANGLE = (28 * Math.PI) / 180;

/**
 * Pointe de flèche à l'extrémité `to` : triangle [gauche, pointe, droite].
 * La pointe est raccourcie si le segment est plus court qu'elle.
 */
export function arrowHead(from: Point, to: Point, size: number): [Point, Point, Point] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const length = Math.min(arrowHeadLength(size), Math.hypot(to.x - from.x, to.y - from.y));
  const wing = (side: 1 | -1): Point => ({
    x: to.x - length * Math.cos(angle + side * HEAD_HALF_ANGLE),
    y: to.y - length * Math.sin(angle + side * HEAD_HALF_ANGLE),
  });
  return [wing(1), to, wing(-1)];
}
