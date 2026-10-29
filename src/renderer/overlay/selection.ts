/**
 * Cadre de sélection dessiné sur le calque actif autour de l'élément sélectionné.
 */
import type { Shape } from '@shared/types';
import { shapeBounds } from './shapes/transform';

/** Espace entre l'élément et son cadre. */
const PADDING = 6;

export function drawSelection(ctx: CanvasRenderingContext2D, shape: Shape, accent: string): void {
  const box = shapeBounds(shape);
  const x = box.x - PADDING;
  const y = box.y - PADDING;
  const width = box.width + PADDING * 2;
  const height = box.height + PADDING * 2;

  ctx.save();
  // Trait sombre en dessous puis pointillés colorés : visible sur tous les fonds.
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeRect(x, y, width, height);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = accent;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}
