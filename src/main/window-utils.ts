/**
 * Utilitaires communs aux fenêtres : sécurité, chargement des pages, envoi typé.
 */
import { join } from 'node:path';
import { app, type BrowserWindow, type WebPreferences } from 'electron';
import type { IpcEventMap } from '@shared/ipc-channels';

/** Préférences web imposées à toutes les fenêtres (renderer isolé et sandboxé). */
export function secureWebPreferences(): WebPreferences {
  return {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  };
}

/** Interdit toute navigation et toute ouverture de nouvelle fenêtre depuis le renderer. */
export function hardenWindow(win: BrowserWindow): void {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
}

/** Charge une page du renderer : serveur Vite en dev, fichiers du build sinon. */
export function loadRendererPage(
  win: BrowserWindow,
  page: 'overlay' | 'toolbar' | 'settings',
): void {
  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (!app.isPackaged && devServerUrl) {
    void win.loadURL(`${devServerUrl}/${page}/index.html`);
  } else {
    void win.loadFile(join(__dirname, `../renderer/${page}/index.html`));
  }
}

/** Envoie un événement typé à une fenêtre, si elle existe encore. */
export function sendTo<C extends keyof IpcEventMap>(
  win: BrowserWindow | null,
  channel: C,
  payload: IpcEventMap[C],
): void {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}
