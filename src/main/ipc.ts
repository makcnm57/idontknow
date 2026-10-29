/**
 * Gestionnaires IPC du processus main. Toute donnée venant du renderer est validée.
 */
import { app, ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { sanitizeStatePatch } from '@shared/draw-state';
import { IpcChannel } from '@shared/ipc-channels';
import type { AppInfo, DrawState } from '@shared/types';
import { getState, releaseToolbarFocus, setVisible, updateState } from './controller';
import { registerHistoryHandlers } from './history-router';
import { beginToolbarFocus, getToolbar } from './toolbar';

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

  // Réservé à la barre d'outils : aucune autre fenêtre ne peut changer sa focusabilité.
  const fromToolbar = (event: IpcMainEvent | IpcMainInvokeEvent): boolean =>
    event.sender.id === getToolbar()?.webContents.id;
  ipcMain.handle(IpcChannel.ToolbarFocus, (event) => {
    if (fromToolbar(event)) beginToolbarFocus();
  });
  ipcMain.on(IpcChannel.ToolbarRelease, (event) => {
    if (fromToolbar(event)) releaseToolbarFocus();
  });

  registerHistoryHandlers();
}
