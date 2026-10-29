/**
 * Fenêtre de la barre d'outils : petite, déplaçable, toujours au-dessus des overlays.
 * Elle n'ignore jamais la souris, elle reste donc cliquable en mode passif.
 * Elle n'est pas activable : cliquer un bouton ne vole le focus ni à l'overlay
 * (les raccourcis clavier continuent de fonctionner) ni à l'application en cours.
 */
import { BrowserWindow, screen } from 'electron';
import { hardenWindow, loadRendererPage, secureWebPreferences } from './window-utils';

const WIDTH = 784;
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
    focusable: false,
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

/**
 * Rend la barre activable et lui donne le focus : nécessaire pour ouvrir le sélecteur
 * de couleur natif de Windows. `setFocusable` réaffiche la fenêtre dans la barre des
 * tâches : on l'en retire aussitôt.
 */
export function beginToolbarFocus(): void {
  const win = getToolbar();
  if (!win) return;
  win.setFocusable(true);
  win.setSkipTaskbar(true);
  win.focus();
}

/**
 * Rend la barre de nouveau non activable. Sous Windows, `setFocusable(false)` donne le
 * focus à la fenêtre visible juste en dessous, c'est-à-dire un overlay ; l'appelant
 * décide ensuite où le focus doit finir.
 *
 * On ne touche jamais au niveau topmost de la barre : la sortir puis la remettre dans
 * cette couche la replace sous les overlays, où ses clics seraient interceptés.
 */
export function endToolbarFocus(): void {
  const win = getToolbar();
  if (!win) return;
  win.setFocusable(false);
  win.setSkipTaskbar(true);
}
