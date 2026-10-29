/**
 * Rendu canvas des formes définies par une boîte : rectangle et ellipse.
 */
import type { BoxShape, EllipseShape, RectShape } from '@shared/types';

/** Remplit ou trace le contour du chemin courant selon la forme. */
function paint(ctx: CanvasRenderingContext2D, shape: BoxShape, buildPath: () => void): void {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = shape.size;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  buildPath();
  if (shape.fill) ctx.fill();
  else ctx.stroke();
  ctx.restore();
}

export function drawRect(ctx: CanvasRenderingContext2D, shape: RectShape): void {
  paint(ctx, shape, () => ctx.rect(shape.x, shape.y, shape.width, shape.height));
}

export function drawEllipse(ctx: CanvasRenderingContext2D, shape: EllipseShape): void {
  paint(ctx, shape, () =>
    ctx.ellipse(
      shape.x + shape.width / 2,
      shape.y + shape.height / 2,
      shape.width / 2,
      shape.height / 2,
      0,
      0,
      Math.PI * 2,
    ),
  );
}
