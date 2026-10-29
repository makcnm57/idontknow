/**
 * Gestionnaires IPC du processus main. Toute donnée venant du renderer est validée.
 */
import { app, ipcMain } from 'electron';
import { sanitizeStatePatch } from '@shared/draw-state';
import { IpcChannel } from '@shared/ipc-channels';
import type { AppInfo, DrawState } from '@shared/types';
import { getState, setVisible, updateState } from './controller';

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.AppInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
  }));

  ipcMain.handle(IpcChannel.StateGet, (): DrawState => getState());

  ipcMain.on(IpcChannel.StateUpdate, (_event, patch: unknown) => {
    updateState(sanitizeStatePatch(patch));
  });

  ipcMain.on(IpcChannel.OverlayHide, () => setVisible(false));
}
