/**
 * Fenêtre de la barre d'outils : petite, déplaçable, toujours au-dessus des overlays.
 * Elle n'ignore jamais la souris, elle reste donc cliquable en mode passif.
 * Elle n'est pas activable : cliquer un bouton ne vole le focus ni à l'overlay
 * (les raccourcis clavier continuent de fonctionner) ni à l'application en cours.
 */
import { BrowserWindow, screen } from 'electron';
import { isOnSomeScreen, type ToolbarPosition } from './settings-schema';
import { hardenWindow, loadRendererPage, secureWebPreferences } from './window-utils';

/** Largeur initiale ; ajustée ensuite au contenu par `resizeToolbar`. */
const WIDTH = 784;
const MIN_WIDTH = 200;
const MAX_WIDTH = 2000;
const HEIGHT = 52;
const TOP_MARGIN = 16;

/**
 * Centre horizontal d'une fenêtre, en entier. Tous les calculs de centre utilisent cette
 * même convention (demi-largeur arrondie à l'inférieur) : sinon, avec une largeur impaire,
 * la barre se décalerait d'un pixel à chaque lancement.
 */
const centerOf = (x: number, width: number): number => x + Math.floor(width / 2);
const leftFor = (centerX: number, width: number): number =>
  Math.round(centerX) - Math.floor(width / 2);

let toolbar: BrowserWindow | null = null;
let onToolbarMoved: (position: ToolbarPosition) => void = () => {};

/**
 * Position de départ : celle enregistrée si elle tombe encore sur un écran branché,
 * sinon en haut au centre de l'écran principal.
 */
function initialPosition(saved: ToolbarPosition | null): ToolbarPosition {
  const areas = screen.getAllDisplays().map((d) => d.workArea);
  if (saved && isOnSomeScreen({ x: saved.centerX, y: saved.y + HEIGHT / 2 }, areas)) return saved;
  const { workArea } = screen.getPrimaryDisplay();
  return { centerX: centerOf(workArea.x, workArea.width), y: workArea.y + TOP_MARGIN };
}

/**
 * Crée la barre. `onMoved` reçoit sa nouvelle position après chaque déplacement
 * par la poignée (pour l'enregistrer dans les paramètres).
 */
export function createToolbar(
  saved: ToolbarPosition | null,
  onMoved: (position: ToolbarPosition) => void,
): BrowserWindow {
  const start = initialPosition(saved);
  toolbar = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: leftFor(start.centerX, WIDTH),
    y: Math.round(start.y),
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
  onToolbarMoved = onMoved;
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
  const win = getToolbar();
  // Sous Windows, `moveTop` réaffiche une fenêtre masquée : on ne remonte qu'une barre visible.
  if (win?.isVisible()) win.moveTop();
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

/**
 * Ajuste la largeur de la fenêtre à celle de son contenu, en gardant la barre centrée
 * sur sa position actuelle. La valeur vient du renderer : elle est bornée.
 */
export function resizeToolbar(contentWidth: number): void {
  const win = getToolbar();
  if (!win || !Number.isFinite(contentWidth)) return;
  const width = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, contentWidth)));
  const bounds = win.getBounds();
  if (width === bounds.width) return;
  win.setBounds({ ...bounds, x: leftFor(centerOf(bounds.x, bounds.width), width), width });
}

/**
 * Déplacement par la poignée, piloté par le renderer. Une fenêtre non activable
 * (`focusable: false`) ne peut pas être déplacée par Windows via `-webkit-app-region: drag` :
 * la barre envoie donc elle-même sa position pendant le glissé.
 */
export function moveToolbarTo(x: number, y: number): void {
  const win = getToolbar();
  if (!win || !Number.isFinite(x) || !Number.isFinite(y)) return;
  win.setPosition(Math.round(x), Math.round(y));
  const bounds = win.getBounds();
  onToolbarMoved({ centerX: centerOf(bounds.x, bounds.width), y: bounds.y });
}
