/**
 * Logique pure des pastilles numérotées : numéro suivant, taille, contraste du chiffre.
 */
import type { Shape } from '@shared/types';

/**
 * Numéro de la prochaine pastille : le plus grand de l'écran + 1. Annuler ou gommer
 * la dernière pastille fait donc reprendre la numérotation à son numéro.
 */
export function nextBadgeNumber(shapes: readonly Shape[]): number {
  let highest = 0;
  for (const shape of shapes) {
    if (shape.kind === 'badge') highest = Math.max(highest, shape.number);
  }
  return highest + 1;
}

/** Rayon de la pastille selon l'épaisseur choisie (fin 14 px, moyen 18 px, épais 26 px). */
export function badgeRadius(size: number): number {
  return 10 + size * 2;
}

/** Contraste minimal WCAG pour un texte large et gras (niveau AA). */
const LARGE_TEXT_CONTRAST = 3;

/**
 * Couleur du chiffre (blanc ou quasi-noir) selon la luminance relative de la pastille
 * (formule WCAG). Le blanc est préféré dès qu'il atteint le contraste requis pour un
 * texte large et gras (3:1) : chiffre blanc sur rouge, bleu ou violet, sombre sur
 * jaune, orange, vert ou blanc.
 */
export function badgeTextColor(background: string): string {
  const channel = (offset: number): number => {
    const value = parseInt(background.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithWhite >= LARGE_TEXT_CONTRAST ? '#ffffff' : '#1c1c1e';
}
