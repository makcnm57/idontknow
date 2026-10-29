/**
 * Barre d'outils : outils, couleurs, épaisseurs, historique et mode.
 * Elle ne garde aucun état propre : tout vient du main (`onStateChanged`, `onHistoryChanged`),
 * ce qui la garde synchronisée avec les raccourcis clavier de l'overlay.
 */
import { PALETTE, SIZE_PRESETS } from '@shared/palette';
import { attachColorPicker } from './color-picker';
import { TOOL_IDS, type DrawState, type HistoryState, type ToolId } from '@shared/types';

const api = window.screendraw;

function $<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Élément ${selector} introuvable`);
  return element;
}

const SIZE_LABELS = ['Fin', 'Moyen', 'Épais'];
/** Diamètre du point affiché pour chaque taille (indicatif, pas à l'échelle réelle). */
const SIZE_DOTS = [5, 9, 13];

let currentState: DrawState | null = null;

// --- Outils : choisir un outil passe en mode dessin (on veut alors dessiner).
const toolButtons = new Map<ToolId, HTMLButtonElement>();
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
  const tool = button.dataset['tool'];
  if (!TOOL_IDS.some((id) => id === tool)) continue;
  toolButtons.set(tool as ToolId, button);
  button.addEventListener('click', () => api.updateState({ tool: tool as ToolId, mode: 'draw' }));
}

// --- Couleurs : 8 pastilles + sélecteur personnalisé.
const customSwatch = $<HTMLLabelElement>('#custom-swatch');
const customInput = $<HTMLInputElement>('#custom-color');
const swatches = PALETTE.map((color, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'swatch';
  button.style.setProperty('--swatch', color);
  button.title = `Couleur ${index + 1} (touche ${index + 1})`;
  button.setAttribute('aria-label', button.title);
  button.addEventListener('click', () => api.updateState({ color }));
  customSwatch.before(button);
  return { color: color as string, button };
});
attachColorPicker(customSwatch, customInput, (color) => api.updateState({ color }));

// --- Épaisseurs : 3 tailles prédéfinies (la molette sur l'overlay ajuste finement).
const sizesGroup = $<HTMLDivElement>('#sizes');
const sizeButtons = SIZE_PRESETS.map((size, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'size-button';
  button.title = `${SIZE_LABELS[index] ?? ''} — molette pour ajuster`;
  button.setAttribute('aria-label', SIZE_LABELS[index] ?? `Taille ${size}`);
  const dot = document.createElement('span');
  dot.className = 'size-dot';
  dot.style.width = dot.style.height = `${SIZE_DOTS[index] ?? size}px`;
  button.append(dot);
  button.addEventListener('click', () => api.updateState({ size }));
  sizesGroup.append(button);
  return { size: size as number, button };
});

// --- Tableaux blanc / noir : un clic ouvre, un second clic ferme.
const boardButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-board]')];
for (const button of boardButtons) {
  button.addEventListener('click', () => {
    const board = button.dataset['board'] === 'black' ? 'black' : 'white';
    if (currentState) api.updateState({ board: currentState.board === board ? 'none' : board });
  });
}

// --- Projecteur : interrupteur, utilisable aussi en mode passif.
const spotlightToggle = $<HTMLButtonElement>('#spotlight-toggle');
spotlightToggle.addEventListener('click', () => {
  if (currentState) api.updateState({ spotlight: !currentState.spotlight });
});

// --- Loupe : interrupteur, utilisable aussi en mode passif.
const magnifierToggle = $<HTMLButtonElement>('#magnifier-toggle');
magnifierToggle.addEventListener('click', () => {
  if (currentState) api.updateState({ magnifier: !currentState.magnifier });
});

// --- Formes pleines ou en contour (rectangle, ellipse).
const fillToggle = $<HTMLButtonElement>('#fill-toggle');
fillToggle.addEventListener('click', () => {
  if (currentState) api.updateState({ fill: !currentState.fill });
});

// --- Historique, mode, masquer.
const undoButton = $<HTMLButtonElement>('#undo');
const redoButton = $<HTMLButtonElement>('#redo');
undoButton.addEventListener('click', () => api.undo());
redoButton.addEventListener('click', () => api.redo());
$<HTMLButtonElement>('#clear').addEventListener('click', () => api.clearAll());

const modeToggle = $<HTMLButtonElement>('#mode-toggle');
const modeLabel = $<HTMLSpanElement>('#mode-label');
modeToggle.addEventListener('click', () => {
  if (!currentState) return;
  api.updateState({ mode: currentState.mode === 'draw' ? 'passive' : 'draw' });
});
$<HTMLButtonElement>('#hide').addEventListener('click', () => api.hideOverlay());

function render(state: DrawState): void {
  currentState = state;
  const drawing = state.mode === 'draw';
  document.body.classList.toggle('mode-draw', drawing);
  document.documentElement.style.setProperty('--accent', state.color);
  modeLabel.textContent = drawing ? 'Dessin' : 'Passif';
  modeToggle.setAttribute('aria-pressed', String(drawing));

  for (const [tool, button] of toolButtons) {
    button.setAttribute('aria-pressed', String(tool === state.tool));
  }

  let inPalette = false;
  for (const { color, button } of swatches) {
    const selected = color === state.color;
    inPalette ||= selected;
    button.setAttribute('aria-pressed', String(selected));
  }
  // Couleur hors palette : la pastille personnalisée la montre et passe en « active ».
  customSwatch.classList.toggle('active', !inPalette);
  customSwatch.style.setProperty('--swatch', state.color);
  customInput.value = state.color;

  for (const button of boardButtons) {
    button.setAttribute('aria-pressed', String(button.dataset['board'] === state.board));
  }
  spotlightToggle.setAttribute('aria-pressed', String(state.spotlight));
  magnifierToggle.setAttribute('aria-pressed', String(state.magnifier));
  fillToggle.setAttribute('aria-pressed', String(state.fill));
  fillToggle.title = state.fill
    ? 'Formes pleines (cliquer pour : contour)'
    : 'Formes en contour (cliquer pour : pleines)';

  for (const { size, button } of sizeButtons) {
    button.setAttribute('aria-pressed', String(size === state.size));
  }
}

function renderHistory(history: HistoryState): void {
  undoButton.disabled = !history.canUndo;
  redoButton.disabled = !history.canRedo;
}

// La fenêtre prend la largeur exacte de la barre (qui dépend du nombre d'outils).
const toolbarElement = $<HTMLDivElement>('.toolbar');
api.resizeToolbar(Math.ceil(toolbarElement.getBoundingClientRect().width));

api.onStateChanged(render);
api.onHistoryChanged(renderHistory);
void api.getState().then(render);
void api.getHistoryState().then(renderHistory);
