/**
 * Contrat commun à tous les outils de dessin.
 * Ajouter un outil = créer un fichier dans `tools/` et l'enregistrer dans `registry.ts`.
 */
import type { DrawState, Shape, StrokePoint, ToolId } from '@shared/types';

/** Ce qu'un outil peut lire et modifier pendant une interaction. */
export interface ToolContext {
  /** Réglages courants (couleur, taille…). */
  readonly state: DrawState;
  /** Formes validées, dans l'ordre d'affichage. */
  getShapes(): readonly Shape[];
  /** Remplace la liste des formes : crée une étape d'historique (annulable). */
  commitShapes(next: readonly Shape[]): void;
  /** Remplace la liste des formes dans la même étape d'historique (geste en cours). */
  amendShapes(next: readonly Shape[]): void;
  /** Forme en cours affichée sur le calque actif (`null` pour l'effacer). */
  setPreview(shape: Shape | null): void;
}

export interface Tool {
  id: ToolId;
  cursor: string;
  onPointerDown(e: PointerEvent, ctx: ToolContext): void;
  onPointerMove(e: PointerEvent, ctx: ToolContext): void;
  onPointerUp(e: PointerEvent, ctx: ToolContext): void;
  onKeyDown?(e: KeyboardEvent, ctx: ToolContext): void;
}

/** Point d'un événement pointeur, en pixels CSS de la fenêtre (= de l'écran). */
export function toStrokePoint(e: PointerEvent): StrokePoint {
  return { x: e.clientX, y: e.clientY, pressure: e.pressure };
}
