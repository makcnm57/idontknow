/**
 * Rendu canvas d'une pastille numérotée : disque coloré et chiffre centré.
 */
import { TEXT_FONT_FAMILY } from '@shared/palette';
import type { BadgeShape } from '@shared/types';
import { badgeTextColor } from './badge-geometry';

export function drawBadge(ctx: CanvasRenderingContext2D, shape: BadgeShape): void {
  const { x, y, radius, number, color } = shape;
  ctx.save();

  // Disque avec une ombre douce et un liseré blanc : il se détache de tout fond.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(1.5, radius / 9);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Chiffre : plus petit à partir de deux chiffres pour rester dans le disque.
  const digits = String(number);
  const fontSize = radius * (digits.length > 1 ? 0.95 : 1.15);
  ctx.font = `600 ${fontSize}px ${TEXT_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = badgeTextColor(color);
  // Léger décalage : la ligne « middle » est un peu haute pour les chiffres.
  ctx.fillText(digits, x, y + fontSize * 0.04);
  ctx.restore();
}
