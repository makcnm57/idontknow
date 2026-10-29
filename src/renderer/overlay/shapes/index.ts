/**
 * Registre de rendu : associe chaque type de forme à sa fonction de dessin.
 * Ajouter une forme = créer son fichier dans `shapes/` et l'ajouter à la table.
 */
import type { Shape } from '@shared/types';
import { drawBadge } from './badge';
import { drawEllipse, drawRect } from './box';
import { drawLine } from './line';
import { drawStroke } from './stroke';
import { drawText } from './text';

type ShapeKind = Shape['kind'];
type ShapeOfKind<K extends ShapeKind> = Extract<Shape, { kind: K }>;
type ShapeRenderer<S extends Shape> = (
  ctx: CanvasRenderingContext2D,
  shape: S,
  complete: boolean,
) => void;

const renderers: { [K in ShapeKind]: ShapeRenderer<ShapeOfKind<K>> } = {
  stroke: drawStroke,
  line: drawLine,
  rect: drawRect,
  ellipse: drawEllipse,
  text: drawText,
  badge: drawBadge,
};

/** Dessine une forme. `complete` : forme validée (faux pendant le tracé). */
export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, complete: boolean): void {
  // La table garantit que le rendu correspond au `kind` : le transtypage est sûr.
  const render = renderers[shape.kind] as ShapeRenderer<Shape>;
  render(ctx, shape, complete);
}
