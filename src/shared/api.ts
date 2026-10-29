import type { AppInfo, DrawState } from './types';

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
}
