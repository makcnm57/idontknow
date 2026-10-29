/**
 * Types partagés entre main, preload et renderer.
 * Ce fichier ne doit dépendre d'aucune API Electron ni du DOM.
 */

/** Identifiants des outils. Complété à chaque phase (V2 : formes, V3 : présentation…). */
export const TOOL_IDS = ['pen', 'highlighter', 'eraser'] as const;
export type ToolId = (typeof TOOL_IDS)[number];

/** Mode d'interaction de l'overlay. */
export type InteractionMode =
  /** L'overlay capte la souris pour dessiner. */
  | 'draw'
  /** Click-through : les annotations restent visibles, les clics passent aux fenêtres dessous. */
  | 'passive';

/** Point d'un tracé, en pixels CSS relatifs à l'écran, avec la pression du stylet (0 à 1). */
export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

/** Tracé à main levée (stylo ou surligneur). */
export interface StrokeShape {
  id: string;
  kind: 'stroke';
  tool: 'pen' | 'highlighter';
  points: StrokePoint[];
  color: string;
  size: number;
  /** Vrai pour la souris (pas de pression réelle) : l'épaisseur suit alors la vitesse. */
  simulatePressure: boolean;
}

/** Élément vectoriel affiché sur le canvas. Union étendue en V2 (rect, ellipse, flèche, texte…). */
export type Shape = StrokeShape;

/** Réglages de dessin courants, partagés entre la barre d'outils et tous les overlays. */
export interface DrawState {
  tool: ToolId;
  color: string;
  size: number;
  mode: InteractionMode;
}

/** Informations sur l'application, exposées au renderer. */
export interface AppInfo {
  name: string;
  version: string;
  platform: string;
}
