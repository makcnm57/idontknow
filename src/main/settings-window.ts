/**
 * Fenêtre Paramètres : une fenêtre classique (cadre, barre des tâches), unique.
 */
import { BrowserWindow } from 'electron';
import iconPath from '../../resources/icon.png?asset';
import { hardenWindow, loadRendererPage, secureWebPreferences } from './window-utils';

let settingsWindow: BrowserWindow | null = null;

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow && !settingsWindow.isDestroyed() ? settingsWindow : null;
}

/** Ouvre la fenêtre, ou la ramène au premier plan si elle est déjà ouverte. */
export function openSettingsWindow(): void {
  const existing = getSettingsWindow();
  if (existing) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 560,
    // Assez haute pour tout afficher sans défilement (tient sur un écran de 900 px).
    height: 760,
    minWidth: 480,
    minHeight: 480,
    title: 'ScreenDraw — Paramètres',
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    // Au-dessus des overlays « screen-saver » pour rester utilisable pendant l'annotation.
    alwaysOnTop: true,
    webPreferences: secureWebPreferences(),
  });
  settingsWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  settingsWindow.setMenu(null);
  settingsWindow.once('ready-to-show', () => settingsWindow?.show());
  settingsWindow.on('closed', () => (settingsWindow = null));
  hardenWindow(settingsWindow);
  loadRendererPage(settingsWindow, 'settings');
}
