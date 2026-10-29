import type { AppInfo, Box, DrawState, HistoryState } from './types';

/**
 * API exposée au renderer par le preload, via `contextBridge` sous `window.screendraw`.
 * C'est la seule porte d'entrée du renderer vers le processus main.
 */
export interface ScreenDrawApi {
  getAppInfo(): Promise<AppInfo>;
  getState(): Promise<DrawState>;
  /** Demande une modification ; le nouvel état revient via `onStateChanged`. */
  updateState(patch: Partial<DrawState>): void;
  /** S'abonne aux changements d'état. Renvoie la fonction de désabonnement. */
  onStateChanged(listener: (state: DrawState) => void): () => void;
  hideOverlay(): void;

  // Historique global (barre d'outils et raccourcis clavier).
  undo(): void;
  redo(): void;
  clearAll(): void;
  getHistoryState(): Promise<HistoryState>;
  onHistoryChanged(listener: (state: HistoryState) => void): () => void;

  // Barre d'outils : activable le temps du sélecteur de couleur natif.
  requestToolbarFocus(): Promise<void>;
  releaseToolbarFocus(): void;
  /** Ajuste la largeur de la fenêtre de la barre à son contenu. */
  resizeToolbar(width: number): void;

  // Côté overlay : capture figée de son écran (loupe).
  captureScreen(): Promise<Uint8Array | null>;

  /** Capture PNG de l'écran sous le curseur (fichier + presse-papiers). */
  takeScreenshot(): void;
  /** Côté overlay : masquer (vrai) ou réafficher (faux) l'interface pour une capture. */
  onCapturing(listener: (active: boolean) => void): () => void;
  /** Côté overlay : interface masquée et redessinée, prêt pour la capture. */
  notifyCaptureReady(): void;

  /** Lance une capture de zone (Ctrl+Shift+X). */
  startZoneCapture(): void;
  /** Côté overlay : afficher l'image figée pour choisir la zone. */
  onZoneStart(listener: (png: Uint8Array) => void): () => void;
  /** Côté overlay : zone choisie (pixels CSS), ou `null` si annulé. */
  sendZoneResult(rect: Box | null): void;

  // Côté overlay : ordres venant du main et signalement des nouvelles étapes.
  onUndoRequested(listener: () => void): () => void;
  onRedoRequested(listener: () => void): () => void;
  onClearRequested(listener: (groupId: string) => void): () => void;
  notifyCommitted(groupId?: string): void;
}
