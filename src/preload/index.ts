/**
 * Preload : seul pont entre le renderer (sandboxé) et le main.
 * N'expose que des fonctions ciblées, jamais `ipcRenderer` brut.
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { ScreenDrawApi } from '@shared/api';
import { IpcChannel, type IpcEventMap, type IpcSendMap } from '@shared/ipc-channels';
import type { AppInfo, DrawState } from '@shared/types';

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
};

contextBridge.exposeInMainWorld('screendraw', api);
