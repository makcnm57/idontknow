/**
 * Icône dans la zone de notification, avec menu contextuel.
 */
import { Menu, nativeImage, Tray } from 'electron';
import trayIconPath from '../../resources/tray.png?asset';

export interface TrayActions {
  isVisible(): boolean;
  isDrawing(): boolean;
  toggleVisible(): void;
  toggleMode(): void;
  screenshot(): void;
  quit(): void;
}

let tray: Tray | null = null;

function buildMenu(actions: TrayActions): Menu {
  return Menu.buildFromTemplate([
    {
      label: actions.isVisible() ? 'Masquer' : 'Afficher',
      accelerator: 'CommandOrControl+Shift+D',
      click: actions.toggleVisible,
    },
    {
      label: 'Mode dessin',
      type: 'checkbox',
      checked: actions.isDrawing(),
      accelerator: 'CommandOrControl+Shift+F',
      click: actions.toggleMode,
    },
    {
      label: "Capturer l'écran",
      accelerator: 'CommandOrControl+Shift+S',
      click: actions.screenshot,
    },
    { type: 'separator' },
    // La fenêtre de paramètres arrive en V4.
    { label: 'Paramètres…', enabled: false },
    { type: 'separator' },
    { label: 'Quitter', click: actions.quit },
  ]);
}

export function createTray(actions: TrayActions): void {
  const icon = nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('ScreenDraw');
  tray.on('click', actions.toggleVisible);
  refreshTray(actions);
}

/** Reconstruit le menu pour refléter l'état courant (libellés, case cochée). */
export function refreshTray(actions: TrayActions): void {
  tray?.setContextMenu(buildMenu(actions));
}
