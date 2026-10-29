/**
 * Preload : seul pont entre le renderer (sandboxé) et le main.
 * N'expose que des fonctions ciblées, jamais `ipcRenderer` brut.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { ScreenDrawApi } from '@shared/api';
import { IpcChannel, type IpcEventMap, type IpcSendMap } from '@shared/ipc-channels';
import type { AppInfo, DrawState, HistoryState } from '@shared/types';

function send<C extends keyof IpcSendMap>(channel: C, payload: IpcSendMap[C]): void {
  ipcRenderer.send(channel, payload);
}

function subscribe<C extends keyof IpcEventMap>(
  channel: C,
  listener: (payload: IpcEventMap[C]) => void,
): () => void {
  // L'objet `event` n'est jamais transmis au renderer (il donnerait accès à `sender`).
  const handler = (_event: IpcRendererEvent, payload: IpcEventMap[C]): void => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api: ScreenDrawApi = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke(IpcChannel.AppInfo),
  getState: (): Promise<DrawState> => ipcRenderer.invoke(IpcChannel.StateGet),
  updateState: (patch) => send(IpcChannel.StateUpdate, patch),
  onStateChanged: (listener) => subscribe(IpcChannel.StateChanged, listener),
  hideOverlay: () => send(IpcChannel.OverlayHide, undefined),

  undo: () => send(IpcChannel.HistoryUndo, undefined),
  redo: () => send(IpcChannel.HistoryRedo, undefined),
  clearAll: () => send(IpcChannel.HistoryClear, undefined),
  getHistoryState: (): Promise<HistoryState> => ipcRenderer.invoke(IpcChannel.HistoryGet),
  onHistoryChanged: (listener) => subscribe(IpcChannel.HistoryChanged, listener),

  requestToolbarFocus: (): Promise<void> => ipcRenderer.invoke(IpcChannel.ToolbarFocus),
  releaseToolbarFocus: () => send(IpcChannel.ToolbarRelease, undefined),
  resizeToolbar: (width) => send(IpcChannel.ToolbarResize, { width }),

  captureScreen: (): Promise<Uint8Array | null> => ipcRenderer.invoke(IpcChannel.CaptureScreen),

  takeScreenshot: () => send(IpcChannel.ScreenshotTake, undefined),
  onCapturing: (listener) =>
    subscribe(IpcChannel.OverlayCapturing, ({ active }) => listener(active)),
  notifyCaptureReady: () => send(IpcChannel.CaptureReady, undefined),
  startZoneCapture: () => send(IpcChannel.ZoneCaptureTake, undefined),
  onZoneStart: (listener) => subscribe(IpcChannel.ZoneStart, ({ png }) => listener(png)),
  sendZoneResult: (rect) => send(IpcChannel.ZoneResult, { rect }),

  onUndoRequested: (listener) => subscribe(IpcChannel.OverlayUndo, () => listener()),
  onRedoRequested: (listener) => subscribe(IpcChannel.OverlayRedo, () => listener()),
  onClearRequested: (listener) =>
    subscribe(IpcChannel.OverlayClear, ({ groupId }) => listener(groupId)),
  notifyCommitted: (groupId) => send(IpcChannel.HistoryCommitted, { groupId }),
};

contextBridge.exposeInMainWorld('screendraw', api);
