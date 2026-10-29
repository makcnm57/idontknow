/**
 * Overlay de dessin : assemble l'état, l'historique, les calques et les entrées.
 * Chaque écran a son propre overlay, donc sa propre liste de formes et ses instantanés.
 * L'ordre des actions entre écrans est tenu par le main (historique global) : chaque
 * nouvelle étape lui est signalée, et annuler / rétablir / tout effacer passent par lui.
 */
import { DEFAULT_DRAW_STATE, stepSize } from '@shared/draw-state';
import { HIGHLIGHTER_SIZE_FACTOR, PALETTE } from '@shared/palette';
import type { DrawState, Shape } from '@shared/types';
import { LayeredCanvas, watchPixelRatio } from './canvas';
import { History } from './history';
import { attachPointerInput, PEN_ERASER_BUTTON } from './input';
import { attachKeyboard, type OverlayAction } from './keyboard';
import { SizeIndicator } from './size-indicator';
import { getTool } from './tools/registry';
import { textEditor } from './tools/text';
import type { ToolContext } from './tools/tool';

const api = window.screendraw;

function requireCanvas(id: string): HTMLCanvasElement {
  const canvas = document.getElementById(id);
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error(`Canvas #${id} introuvable`);
  return canvas;
}

let state: DrawState = DEFAULT_DRAW_STATE;
let preview: Shape | null = null;
const history = new History<readonly Shape[]>([]);
const sizeIndicator = new SizeIndicator();

const activeCanvas = requireCanvas('layer-active');
const layers = new LayeredCanvas(
  requireCanvas('layer-committed'),
  activeCanvas,
  () => history.present,
  () => preview,
);

const toolContext: ToolContext = {
  get state() {
    return state;
  },
  getShapes: () => history.present,
  commitShapes(next) {
    history.commit(next);
    layers.invalidateCommitted();
    api.notifyCommitted();
  },
  amendShapes(next) {
    history.amend(next);
    layers.invalidateCommitted();
  },
  setPreview(shape) {
    preview = shape;
    layers.invalidateActive();
  },
};

function render(next: DrawState): void {
  const sizeChanged = next.size !== state.size;
  state = next;
  document.body.classList.toggle('mode-draw', state.mode === 'draw');
  document.documentElement.style.setProperty('--accent', state.color);
  activeCanvas.style.cursor = getTool(state.tool)?.cursor ?? 'default';
  // La saisie en cours suit couleur et taille ; changer d'outil la valide.
  textEditor.applyStyle(state);
  if (state.tool !== 'text') textEditor.commit();
  // Seul l'overlay sous le curseur (celui qui a le focus) affiche l'indicateur.
  if (sizeChanged && document.hasFocus()) {
    const factor = state.tool === 'highlighter' ? HIGHLIGHTER_SIZE_FACTOR : 1;
    sizeIndicator.show(state.size * factor, state.color);
  }
}

/** Exécution des raccourcis : une entrée par type d'action. */
type ActionHandlers = {
  [K in OverlayAction['type']]: (action: Extract<OverlayAction, { type: K }>) => void;
};

const actions: ActionHandlers = {
  // Annuler / rétablir / effacer agissent sur tous les écrans : le main décide lesquels.
  undo: () => api.undo(),
  redo: () => api.redo(),
  clear: () => api.clearAll(),
  exit: () => api.updateState({ mode: 'passive' }),
  tool: ({ tool }) => api.updateState({ tool }),
  color: ({ index }) => {
    const color = PALETTE[index];
    if (color) api.updateState({ color });
  },
};

attachKeyboard((action) => {
  (actions[action.type] as (a: OverlayAction) => void)(action);
});

// Le bout gomme d'un stylet efface, quel que soit l'outil sélectionné.
attachPointerInput(
  activeCanvas,
  (e) => getTool(e.button === PEN_ERASER_BUTTON ? 'eraser' : state.tool),
  toolContext,
);

// Molette : ajuste la taille du trait (vers le haut = plus épais).
window.addEventListener(
  'wheel',
  (e) => {
    if (state.mode !== 'draw' || e.deltaY === 0) return;
    api.updateState({ size: stepSize(state.size, e.deltaY < 0 ? 1 : -1) });
  },
  { passive: true },
);

// Ordres de l'historique global.
api.onUndoRequested(() => {
  if (history.undo()) layers.invalidateCommitted();
});
api.onRedoRequested(() => {
  if (history.redo()) layers.invalidateCommitted();
});
// « Tout effacer » est une étape comme une autre, rattachée au groupe multi-écrans.
api.onClearRequested((groupId) => {
  if (history.present.length === 0) return;
  history.commit([]);
  layers.invalidateCommitted();
  api.notifyCommitted(groupId);
});

window.addEventListener('resize', () => layers.resize());
watchPixelRatio(() => layers.resize());

api.onStateChanged(render);
void api.getState().then(render);
