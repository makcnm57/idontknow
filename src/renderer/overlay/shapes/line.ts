/**
 * Rendu canvas d'une ligne ou d'une flèche.
 */
import type { LineShape } from '@shared/types';
import { arrowHead } from './shape-geometry';

export function drawLine(ctx: CanvasRenderingContext2D, shape: LineShape): void {
  const { from, to, color, size } = shape;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  if (shape.arrow) {
    // Pointe pleine, avec un contour arrondi pour adoucir les angles.
    const [left, tip, right] = arrowHead(from, to, size);
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
