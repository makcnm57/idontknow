/**
 * Fenêtres overlay : une fenêtre transparente plein écran par écran.
 * Les fenêtres sont conservées tant que leur écran existe, pour ne pas perdre les annotations.
 */
import { BrowserWindow, screen, type Display } from 'electron';
import type { InteractionMode } from '@shared/types';
import { hardenWindow, loadRendererPage, secureWebPreferences } from './window-utils';

/** Overlays indexés par identifiant d'écran. */
const overlays = new Map<number, BrowserWindow>();

function createOverlay(display: Display): BrowserWindow {
  const win = new BrowserWindow({
    ...display.bounds,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: secureWebPreferences(),
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Sous Windows avec des échelles différentes par écran, les bornes du constructeur
  // peuvent être converties avec le facteur du mauvais écran : on les réapplique.
  win.setBounds(display.bounds);
  hardenWindow(win);
  loadRendererPage(win, 'overlay');
  return win;
}

/**
 * Crée un overlay par écran et suit les branchements / changements de résolution.
 * `onCreated` permet d'appliquer l'état courant (visibilité, mode) aux nouvelles fenêtres.
 */
export function initOverlays(onCreated: (win: BrowserWindow) => void): void {
  const add = (display: Display): void => {
    const win = createOverlay(display);
    overlays.set(display.id, win);
    onCreated(win);
  };

  screen.getAllDisplays().forEach(add);

  screen.on('display-added', (_event, display) => add(display));
  screen.on('display-removed', (_event, display) => {
    overlays.get(display.id)?.destroy();
    overlays.delete(display.id);
  });
  screen.on('display-metrics-changed', (_event, display) => {
    overlays.get(display.id)?.setBounds(display.bounds);
  });
}

export function getOverlays(): BrowserWindow[] {
  return [...overlays.values()].filter((win) => !win.isDestroyed());
}

export function setOverlayVisible(win: BrowserWindow, visible: boolean): void {
  // showInactive : afficher l'overlay ne doit pas voler le focus de l'application en cours.
  if (visible) win.showInactive();
  else win.hide();
}

/**
 * Mode passif : les clics traversent l'overlay (`forward` garde les événements de survol).
 * Mode dessin : l'overlay capte la souris.
 *
 * On n'utilise volontairement pas `setFocusable(false)` : sous Windows, Electron y appelle
 * `blur()`, ce qui active la fenêtre visible suivante (souvent l'autre overlay).
 */
export function setOverlayMode(win: BrowserWindow, mode: InteractionMode): void {
  win.setIgnoreMouseEvents(mode === 'passive', { forward: true });
}

/**
 * Rend le focus clavier à l'application qui était active avant le mode dessin.
 *
 * Sous Windows, `blur()` active la fenêtre visible suivante dans l'ordre d'empilement :
 * ce serait l'autre overlay ou la barre des tâches (eux aussi « topmost »). On sort donc
 * brièvement l'overlay de la couche topmost : il se place juste au-dessus de la dernière
 * fenêtre normale active, qui reçoit alors le focus. Puis on le remet au premier plan.
 */
export function releaseOverlayFocus(): void {
  const focused = getOverlays().find((win) => win.isFocused());
  if (!focused) return;
  focused.setAlwaysOnTop(false);
  focused.blur();
  focused.setAlwaysOnTop(true, 'screen-saver');
}

/** Donne le focus à l'overlay de l'écran sous le curseur (pour les raccourcis clavier locaux). */
export function focusOverlayAtCursor(): void {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  overlays.get(display.id)?.focus();
}
