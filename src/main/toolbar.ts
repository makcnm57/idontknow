/**
 * Fenêtre de la barre d'outils : petite, déplaçable, toujours au-dessus des overlays.
 * Elle n'ignore jamais la souris, elle reste donc cliquable en mode passif.
 */
import { BrowserWindow, screen } from 'electron';
import { hardenWindow, loadRendererPage, secureWebPreferences } from './window-utils';

const WIDTH = 220;
const HEIGHT = 52;
const TOP_MARGIN = 16;

let toolbar: BrowserWindow | null = null;

export function createToolbar(): BrowserWindow {
  const { workArea } = screen.getPrimaryDisplay();
  toolbar = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: Math.round(workArea.x + (workArea.width - WIDTH) / 2),
    y: workArea.y + TOP_MARGIN,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: secureWebPreferences(),
  });
  toolbar.setAlwaysOnTop(true, 'screen-saver');
  toolbar.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  toolbar.on('closed', () => (toolbar = null));
  hardenWindow(toolbar);
  loadRendererPage(toolbar, 'toolbar');
  return toolbar;
}

export function getToolbar(): BrowserWindow | null {
  return toolbar && !toolbar.isDestroyed() ? toolbar : null;
}

export function setToolbarVisible(visible: boolean): void {
  const win = getToolbar();
  if (!win) return;
  if (visible) {
    win.showInactive();
    raiseToolbar();
  } else {
    win.hide();
  }
}

/**
 * Remet la barre au premier plan. Sous Windows, toutes les fenêtres « screen-saver »
 * partagent le même niveau (`relativeLevel` est ignoré hors macOS) : la dernière
 * fenêtre activée passe devant. On rappelle donc cette fonction après chaque
 * affichage ou activation d'un overlay.
 */
export function raiseToolbar(): void {
  getToolbar()?.moveTop();
}
