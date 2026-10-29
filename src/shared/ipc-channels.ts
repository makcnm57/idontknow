/**
 * Canaux IPC centralisés. Aucun nom de canal ne doit être écrit en dur ailleurs.
 * Convention de nommage : `domaine:action`.
 */
import type { AppInfo, Box, DrawState, HistoryState } from './types';

export const IpcChannel = {
  /** renderer → main (invoke) : informations sur l'application. */
  AppInfo: 'app:info',
  /** renderer → main (invoke) : état de dessin courant. */
  StateGet: 'state:get',
  /** renderer → main (send) : demande de modification de l'état (validée côté main). */
  StateUpdate: 'state:update',
  /** main → renderers : nouvel état diffusé à toutes les fenêtres. */
  StateChanged: 'state:changed',
  /** renderer → main (send) : masquer l'overlay et la barre d'outils. */
  OverlayHide: 'overlay:hide',

  /** renderer → main (send) : annuler / rétablir la dernière action, tous écrans confondus. */
  HistoryUndo: 'history:undo',
  HistoryRedo: 'history:redo',
  /** renderer → main (send) : tout effacer, sur tous les écrans. */
  HistoryClear: 'history:clear',
  /** overlay → main (send) : une nouvelle étape d'historique vient d'être créée. */
  HistoryCommitted: 'history:committed',
  /** renderer → main (invoke) : possibilité d'annuler / rétablir. */
  HistoryGet: 'history:get',
  /** main → barre d'outils : possibilité d'annuler / rétablir a changé. */
  HistoryChanged: 'history:changed',

  /**
   * barre d'outils → main : la rendre activable le temps du sélecteur de couleur natif
   * (Windows n'ouvre pas la boîte de dialogue depuis une fenêtre non activable), puis l'inverse.
   */
  ToolbarFocus: 'toolbar:focus',
  ToolbarRelease: 'toolbar:release',
  /** barre d'outils → main : largeur de son contenu, pour ajuster la fenêtre. */
  ToolbarResize: 'toolbar:resize',
  /** barre d'outils → main : nouvelle position pendant un déplacement par la poignée. */
  ToolbarMove: 'toolbar:move',

  /** overlay → main (invoke) : capture PNG de son écran (loupe). */
  CaptureScreen: 'capture:screen',
  /** renderer → main (send) : prendre une capture PNG (écran sous le curseur). */
  ScreenshotTake: 'screenshot:take',
  /** main → overlay : masquer / réafficher l'interface le temps d'une capture. */
  OverlayCapturing: 'overlay:capturing',
  /** overlay → main (send) : interface masquée et redessinée, prêt pour la capture. */
  CaptureReady: 'capture:ready',
  /** renderer → main (send) : lancer une capture de zone. */
  ZoneCaptureTake: 'zone:take',
  /** main → overlay : afficher l'image figée pour choisir la zone. */
  ZoneStart: 'zone:start',
  /** overlay → main (send) : zone choisie (pixels CSS) ou `null` si annulé. */
  ZoneResult: 'zone:result',

  /** main → overlay : annuler / rétablir une étape locale. */
  OverlayUndo: 'overlay:undo',
  OverlayRedo: 'overlay:redo',
  /** main → overlay : tout effacer (étape rattachée au groupe `groupId`). */
  OverlayClear: 'overlay:clear',
} as const;

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel];

/** Canaux `invoke` / `handle` : arguments envoyés et valeur retournée. */
export interface IpcInvokeMap {
  [IpcChannel.AppInfo]: { args: []; result: AppInfo };
  [IpcChannel.StateGet]: { args: []; result: DrawState };
  [IpcChannel.HistoryGet]: { args: []; result: HistoryState };
  [IpcChannel.ToolbarFocus]: { args: []; result: undefined };
  [IpcChannel.CaptureScreen]: { args: []; result: Uint8Array | null };
}

/** Canaux `send` / `on` du renderer vers le main : charge utile. */
export interface IpcSendMap {
  [IpcChannel.StateUpdate]: Partial<DrawState>;
  [IpcChannel.OverlayHide]: undefined;
  [IpcChannel.HistoryUndo]: undefined;
  [IpcChannel.HistoryRedo]: undefined;
  [IpcChannel.HistoryClear]: undefined;
  [IpcChannel.HistoryCommitted]: { groupId?: string };
  [IpcChannel.ToolbarRelease]: undefined;
  [IpcChannel.ToolbarResize]: { width: number };
  [IpcChannel.ToolbarMove]: { x: number; y: number };
  [IpcChannel.ScreenshotTake]: undefined;
  [IpcChannel.CaptureReady]: undefined;
  [IpcChannel.ZoneCaptureTake]: undefined;
  [IpcChannel.ZoneResult]: { rect: Box | null };
}

/** Événements du main vers les renderers : charge utile. */
export interface IpcEventMap {
  [IpcChannel.StateChanged]: DrawState;
  [IpcChannel.HistoryChanged]: HistoryState;
  [IpcChannel.OverlayUndo]: undefined;
  [IpcChannel.OverlayRedo]: undefined;
  [IpcChannel.OverlayClear]: { groupId: string };
  [IpcChannel.OverlayCapturing]: { active: boolean };
  [IpcChannel.ZoneStart]: { png: Uint8Array };
}
