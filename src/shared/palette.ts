/**
 * Couleurs et tailles prédéfinies, partagées entre l'overlay (raccourcis) et la barre d'outils.
 */

/** 8 couleurs accessibles par les touches 1 à 8. */
export const PALETTE = [
  '#ff3b30', // rouge
  '#ff9500', // orange
  '#ffcc00', // jaune
  '#34c759', // vert
  '#007aff', // bleu
  '#af52de', // violet
  '#ffffff', // blanc
  '#1c1c1e', // noir
] as const;

/** Tailles « fin », « moyen », « épais » (diamètre du stylo en pixels CSS). */
export const SIZE_PRESETS = [2, 4, 8] as const;

/** Le surligneur est plus large que le stylo pour une même taille choisie. */
export const HIGHLIGHTER_SIZE_FACTOR = 4;

/** Opacité du surligneur. */
export const HIGHLIGHTER_OPACITY = 0.4;

/** Diamètre de la zone effacée par la gomme. */
export const ERASER_DIAMETER = 20;
