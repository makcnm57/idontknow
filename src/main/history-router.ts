/**
 * Routage de l'historique entre les écrans : relaie annuler / rétablir / tout effacer
 * vers les bons overlays, et tient la barre d'outils informée.
 */
import { randomUUID } from 'node:crypto';
import { ipcMain, type BrowserWindow, type IpcMainEvent } from 'electron';
import { IpcChannel } from '@shared/ipc-channels';
import type { HistoryState } from '@shared/types';
import { GlobalHistory } from './global-history';
import { getOverlays } from './overlay';
import { getToolbar } from './toolbar';
import { sendTo } from './window-utils';

const history = new GlobalHistory();

function historyState(): HistoryState {
  return { canUndo: history.canUndo, canRedo: history.canRedo };
}

function broadcastHistory(): void {
  sendTo(getToolbar(), IpcChannel.HistoryChanged, historyState());
}

/** Overlay correspondant à un identifiant de webContents. */
function overlayById(id: number): BrowserWindow | undefined {
  return getOverlays().find((win) => win.webContents.id === id);
}

function isOverlaySender(event: IpcMainEvent): boolean {
  return overlayById(event.sender.id) !== undefined;
}

export function undo(): void {
  history
    .takeUndo()
    ?.forEach((id) => sendTo(overlayById(id) ?? null, IpcChannel.OverlayUndo, undefined));
  broadcastHistory();
}

export function redo(): void {
  history
    .takeRedo()
    ?.forEach((id) => sendTo(overlayById(id) ?? null, IpcChannel.OverlayRedo, undefined));
  broadcastHistory();
}

/** Tout effacer : chaque overlay non vide crée une étape, regroupée sous le même `groupId`. */
export function clearAll(): void {
  const groupId = randomUUID();
  getOverlays().forEach((win) => sendTo(win, IpcChannel.OverlayClear, { groupId }));
}

/** À appeler quand un overlay disparaît (écran débranché). */
export function forgetOverlay(webContentsId: number): void {
  history.removeSource(webContentsId);
  broadcastHistory();
}

export function registerHistoryHandlers(): void {
  ipcMain.handle(IpcChannel.HistoryGet, (): HistoryState => historyState());
  ipcMain.on(IpcChannel.HistoryUndo, undo);
  ipcMain.on(IpcChannel.HistoryRedo, redo);
  ipcMain.on(IpcChannel.HistoryClear, clearAll);

  ipcMain.on(IpcChannel.HistoryCommitted, (event, payload: unknown) => {
    // Seuls les overlays créent des étapes ; le groupe est un identifiant court.
    if (!isOverlaySender(event)) return;
    const groupId = (payload as { groupId?: unknown } | null)?.groupId;
    const validGroup = typeof groupId === 'string' && groupId.length <= 64 ? groupId : undefined;
    history.recordCommit(event.sender.id, validGroup);
    broadcastHistory();
  });
}
