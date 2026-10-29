/**
 * Icône dans la zone de notification, avec menu contextuel.
 */
import { Menu, nativeImage, Tray } from 'electron';
import type { ShortcutMap } from '@shared/shortcuts';
import trayIconPath from '../../resources/tray.png?asset';

export interface TrayActions {
  isVisible(): boolean;
  isDrawing(): boolean;
  /** Raccourcis actuels, affichés dans le menu (ils sont personnalisables). */
  shortcuts(): ShortcutMap;
  toggleVisible(): void;
  toggleMode(): void;
  screenshot(): void;
  zoneCapture(): void;
  openSettings(): void;
  quit(): void;
}

let tray: Tray | null = null;

function buildMenu(actions: TrayActions): Menu {
  const shortcuts = actions.shortcuts();
  return Menu.buildFromTemplate([
    {
      label: actions.isVisible() ? 'Masquer' : 'Afficher',
      accelerator: shortcuts.toggleVisible,
      click: actions.toggleVisible,
    },
    {
      label: 'Mode dessin',
      type: 'checkbox',
      checked: actions.isDrawing(),
      accelerator: shortcuts.toggleMode,
      click: actions.toggleMode,
    },
    {
      label: "Capturer l'écran",
      accelerator: shortcuts.screenshot,
      click: actions.screenshot,
    },
    {
      label: 'Capturer une zone',
      accelerator: shortcuts.zoneCapture,
      click: actions.zoneCapture,
    },
    { type: 'separator' },
    { label: 'Paramètres…', click: actions.openSettings },
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

/** Reconstruit le menu pour refléter l'état courant (libellés, case cochée, raccourcis). */
export function refreshTray(actions: TrayActions): void {
  tray?.setContextMenu(buildMenu(actions));
}
