/**
 * Rendu canvas d'un texte multiligne, aligné sur la zone de saisie (`text-editor.ts`).
 */
import { TEXT_FONT_FAMILY, TEXT_LINE_HEIGHT } from '@shared/palette';
import type { TextShape } from '@shared/types';

/** Ombre légère : le texte reste lisible sur fond clair comme sur fond foncé. */
export const TEXT_SHADOW = { color: 'rgba(0, 0, 0, 0.45)', blur: 3 };

export function drawText(ctx: CanvasRenderingContext2D, shape: TextShape): void {
  const lineHeight = shape.fontSize * TEXT_LINE_HEIGHT;
  // En CSS, chaque ligne est centrée dans sa hauteur de ligne (demi-interlignage) :
  // on applique le même décalage pour que le texte validé ne bouge pas.
  const halfLeading = (lineHeight - shape.fontSize) / 2;

  ctx.save();
  ctx.font = `${shape.fontSize}px ${TEXT_FONT_FAMILY}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = shape.color;
  ctx.shadowColor = TEXT_SHADOW.color;
  ctx.shadowBlur = TEXT_SHADOW.blur;
  shape.text.split('\n').forEach((line, index) => {
    ctx.fillText(line, shape.x, shape.y + index * lineHeight + halfLeading);
  });
  ctx.restore();
}
