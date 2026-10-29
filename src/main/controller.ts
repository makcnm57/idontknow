/**
 * Contrôleur de l'application : source de vérité de l'état de dessin et de la visibilité.
 * Toute modification passe par ici, puis est appliquée aux fenêtres et diffusée par IPC.
 */
import type { BrowserWindow } from 'electron';
import { applyStatePatch, DEFAULT_DRAW_STATE } from '@shared/draw-state';
import { IpcChannel } from '@shared/ipc-channels';
import type { DrawState } from '@shared/types';
import {
  focusOverlayAtCursor,
  getOverlays,
  releaseOverlayFocus,
  setOverlayMode,
  setOverlayVisible,
} from './overlay';
import { forgetOverlay } from './history-router';
import { raiseSettingsWindow } from './settings-window';
import { endToolbarFocus, getToolbar, raiseToolbar, setToolbarVisible } from './toolbar';
import { sendTo } from './window-utils';

let state: DrawState = DEFAULT_DRAW_STATE;
let visible = false;
const listeners = new Set<() => void>();

export function getState(): DrawState {
  return state;
}

export function isVisible(): boolean {
  return visible;
}

/** S'abonne aux changements (état ou visibilité), par exemple pour le menu du tray. */
export function onControllerChange(listener: () => void): void {
  listeners.add(listener);
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function broadcastState(): void {
  for (const win of [...getOverlays(), getToolbar()]) {
    sendTo(win, IpcChannel.StateChanged, state);
  }
}

/** En mode dessin, l'overlay sous le curseur prend le focus pour recevoir le clavier. */
function focusIfDrawing(): void {
  if (visible && state.mode === 'draw') {
    focusOverlayAtCursor();
    raiseToolbar();
  }
}

/** Fin du sélecteur de couleur : la barre redevient non activable et le focus est rendu. */
export function releaseToolbarFocus(): void {
  endToolbarFocus();
  // Le focus est passé à un overlay : on l'y laisse en mode dessin, sinon on le rend
  // à l'application d'en dessous (même mécanisme que le retour en mode passif).
  if (visible && state.mode === 'draw') focusIfDrawing();
  else releaseOverlayFocus();
  raiseToolbar();
}

/** Applique l'état courant à une fenêtre overlay (nouvelle ou existante). */
export function configureOverlay(win: BrowserWindow): void {
  setOverlayMode(win, state.mode);
  setOverlayVisible(win, visible);
  // Activer un overlay le fait passer devant la barre d'outils et les Paramètres : on les remonte.
  win.on('focus', () => {
    raiseSettingsWindow();
    raiseToolbar();
  });
  // L'identifiant n'est plus lisible une fois la fenêtre détruite : on le capture ici.
  const webContentsId = win.webContents.id;
  win.on('closed', () => forgetOverlay(webContentsId));
}

export function updateState(patch: Partial<DrawState>): void {
  const next = applyStatePatch(state, patch);
  if (next === state) return;
  const modeChanged = next.mode !== state.mode;
  state = next;

  if (modeChanged) {
    // Le focus est rendu avant de rendre les overlays non focusables.
    if (state.mode === 'passive') {
      releaseOverlayFocus();
      raiseToolbar();
    }
    getOverlays().forEach((win) => setOverlayMode(win, state.mode));
    // Passer en mode dessin alors que tout est masqué : on affiche d'abord.
    if (state.mode === 'draw' && !visible) setVisible(true);
    else focusIfDrawing();
  }
  broadcastState();
  notify();
}

export function setVisible(value: boolean): void {
  if (value === visible) return;
  visible = value;
  // Chromium masque sans activer d'autre fenêtre : on rend le focus explicitement.
  if (!visible) releaseOverlayFocus();
  getOverlays().forEach((win) => setOverlayVisible(win, visible));
  setToolbarVisible(visible);
  focusIfDrawing();
  notify();
}

export function toggleVisible(): void {
  setVisible(!visible);
}

export function toggleMode(): void {
  updateState({ mode: state.mode === 'draw' ? 'passive' : 'draw' });
}
