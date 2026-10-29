/**
 * Types partagés entre main, preload et renderer.
 * Ce fichier ne doit dépendre d'aucune API Electron ni du DOM.
 */

/** Identifiants des outils. Complété à chaque phase (V2 : formes, V3 : présentation…). */
export const TOOL_IDS = [
  'pen',
  'highlighter',
  'eraser',
  'line',
  'arrow',
  'rect',
  'ellipse',
  'text',
  'select',
] as const;
export type ToolId = (typeof TOOL_IDS)[number];

/** Mode d'interaction de l'overlay. */
export type InteractionMode =
  /** L'overlay capte la souris pour dessiner. */
  | 'draw'
  /** Click-through : les annotations restent visibles, les clics passent aux fenêtres dessous. */
  | 'passive';

/** Point en pixels CSS relatifs à l'écran. */
export interface Point {
  x: number;
  y: number;
}

/** Point d'un tracé, avec la pression du stylet (0 à 1). */
export interface StrokePoint extends Point {
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

/** Segment, avec ou sans pointe de flèche à l'arrivée. */
export interface LineShape {
  id: string;
  kind: 'line';
  from: Point;
  to: Point;
  arrow: boolean;
  color: string;
  size: number;
}

/** Boîte englobante (largeur et hauteur toujours positives). */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Forme définie par une boîte : rectangle, ou ellipse inscrite dans la boîte. */
interface BoxShapeBase extends Box {
  id: string;
  /** Vrai : forme pleine ; faux : contour seulement. */
  fill: boolean;
  color: string;
  size: number;
}

export interface RectShape extends BoxShapeBase {
  kind: 'rect';
}

export interface EllipseShape extends BoxShapeBase {
  kind: 'ellipse';
}

export type BoxShape = RectShape | EllipseShape;

/**
 * Texte, éventuellement sur plusieurs lignes. La boîte (x, y, largeur, hauteur) est
 * mesurée à la validation : elle sert au hit-test sans avoir besoin d'un canvas.
 */
export interface TextShape extends Box {
  id: string;
  kind: 'text';
  text: string;
  fontSize: number;
  color: string;
}

/** Élément vectoriel affiché sur le canvas. */
export type Shape = StrokeShape | LineShape | RectShape | EllipseShape | TextShape;

/** Réglages de dessin courants, partagés entre la barre d'outils et tous les overlays. */
export interface DrawState {
  tool: ToolId;
  color: string;
  size: number;
  /** Rectangles et ellipses pleins (vrai) ou en contour (faux). */
  fill: boolean;
  mode: InteractionMode;
}

/** Possibilité d'annuler / rétablir (pour griser les boutons de la barre). */
export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

/** Informations sur l'application, exposées au renderer. */
export interface AppInfo {
  name: string;
  version: string;
  platform: string;
}
