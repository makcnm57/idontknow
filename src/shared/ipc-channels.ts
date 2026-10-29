/**
 * Canaux IPC centralisés. Aucun nom de canal ne doit être écrit en dur ailleurs.
 * Convention de nommage : `domaine:action`.
 */
import type { AppInfo, DrawState } from './types';

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
} as const;

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel];

/** Canaux `invoke` / `handle` : arguments envoyés et valeur retournée. */
export interface IpcInvokeMap {
  [IpcChannel.AppInfo]: { args: []; result: AppInfo };
  [IpcChannel.StateGet]: { args: []; result: DrawState };
}

/** Canaux `send` / `on` du renderer vers le main : charge utile. */
export interface IpcSendMap {
  [IpcChannel.StateUpdate]: Partial<DrawState>;
  [IpcChannel.OverlayHide]: undefined;
}

/** Événements du main vers les renderers : charge utile. */
export interface IpcEventMap {
  [IpcChannel.StateChanged]: DrawState;
}
