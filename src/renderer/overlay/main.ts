/**
 * Overlay de dessin : assemble l'état, l'historique, les calques et les entrées.
 * Chaque écran a son propre overlay, donc sa propre liste de formes et son historique.
 */
import { DEFAULT_DRAW_STATE } from '@shared/draw-state';
import type { DrawState, Shape } from '@shared/types';
import { LayeredCanvas, watchPixelRatio } from './canvas';
import { History } from './history';
import { attachPointerInput } from './input';
import { attachKeyboard } from './keyboard';
import { getTool } from './tools/registry';
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
  },
  setPreview(shape) {
    preview = shape;
    layers.invalidateActive();
  },
};

function render(next: DrawState): void {
  state = next;
  document.body.classList.toggle('mode-draw', state.mode === 'draw');
  document.documentElement.style.setProperty('--accent', state.color);
  activeCanvas.style.cursor = getTool(state.tool)?.cursor ?? 'default';
}

attachPointerInput(activeCanvas, () => getTool(state.tool), toolContext);

attachKeyboard({
  undo: () => {
    if (history.undo()) layers.invalidateCommitted();
  },
  redo: () => {
    if (history.redo()) layers.invalidateCommitted();
  },
  // « Tout effacer » est une étape d'historique comme une autre : Ctrl+Z la rattrape.
  clearAll: () => toolContext.commitShapes([]),
  exitDrawMode: () => api.updateState({ mode: 'passive' }),
});

window.addEventListener('resize', () => layers.resize());
watchPixelRatio(() => layers.resize());

api.onStateChanged(render);
void api.getState().then(render);
