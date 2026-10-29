/**
 * Transformations des formes (logique pure) : déplacement et boîte englobante.
 * Les formes sont immuables : déplacer renvoie une nouvelle forme, avec le même `id`.
 */
import type { Box, Point, Shape } from '@shared/types';
import { arrowHead } from './shape-geometry';

type ShapeKind = Shape['kind'];
type ShapeOfKind<K extends ShapeKind> = Extract<Shape, { kind: K }>;

const offset = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });
const moveBox = <S extends Box>(shape: S, dx: number, dy: number): S => ({
  ...shape,
  x: shape.x + dx,
  y: shape.y + dy,
});

const translators: {
  [K in ShapeKind]: (shape: ShapeOfKind<K>, dx: number, dy: number) => ShapeOfKind<K>;
} = {
  stroke: (shape, dx, dy) => ({
    ...shape,
    points: shape.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
  }),
  line: (shape, dx, dy) => ({
    ...shape,
    from: offset(shape.from, dx, dy),
    to: offset(shape.to, dx, dy),
  }),
  rect: moveBox,
  ellipse: moveBox,
  text: moveBox,
  badge: (shape, dx, dy) => ({ ...shape, x: shape.x + dx, y: shape.y + dy }),
};

/** Forme déplacée de (dx, dy). */
export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  // La table garantit que la fonction correspond au `kind` : le transtypage est sûr.
  const translate = translators[shape.kind] as (s: Shape, dx: number, dy: number) => Shape;
  return translate(shape, dx, dy);
}

/** Boîte englobant des points, élargie de `pad` de chaque côté. */
export function pointsBounds(points: readonly Point[], pad: number): Box {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) + pad - minX,
    height: Math.max(...ys) + pad - minY,
  };
}

const padBox = (box: Box, pad: number): Box => ({
  x: box.x - pad,
  y: box.y - pad,
  width: box.width + pad * 2,
  height: box.height + pad * 2,
});

const bounders: { [K in ShapeKind]: (shape: ShapeOfKind<K>) => Box } = {
  stroke: (shape) => pointsBounds(shape.points, shape.size / 2),
  line: (shape) =>
    pointsBounds(
      shape.arrow
        ? [shape.from, ...arrowHead(shape.from, shape.to, shape.size)]
        : [shape.from, shape.to],
      shape.size / 2,
    ),
  // Un contour déborde de la moitié de son épaisseur ; une forme pleine non.
  rect: (shape) => padBox(shape, shape.fill ? 0 : shape.size / 2),
  ellipse: (shape) => padBox(shape, shape.fill ? 0 : shape.size / 2),
  text: (shape) => padBox(shape, 0),
  badge: (shape) => pointsBounds([shape], shape.radius),
};

/** Boîte englobante visible d'une forme (épaisseur du trait comprise). */
export function shapeBounds(shape: Shape): Box {
  const bound = bounders[shape.kind] as (s: Shape) => Box;
  return bound(shape);
}
