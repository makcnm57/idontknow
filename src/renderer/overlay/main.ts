/**
 * Overlay de dessin : assemble l'état, l'historique, les calques et les entrées.
 * Chaque écran a son propre overlay, donc sa propre liste de formes et ses instantanés.
 * L'ordre des actions entre écrans est tenu par le main (historique global) : chaque
 * nouvelle étape lui est signalée, et annuler / rétablir / tout effacer passent par lui.
 */
import {
  DEFAULT_DRAW_STATE,
  stepMagnifierZoom,
  stepSize,
  stepSpotlightRadius,
} from '@shared/draw-state';
import { HIGHLIGHTER_SIZE_FACTOR, PALETTE } from '@shared/palette';
import type { DrawState, Shape } from '@shared/types';
import { LayeredCanvas, watchPixelRatio } from './canvas';
import { History } from './history';
import { attachPointerInput, PEN_ERASER_BUTTON } from './input';
import { attachKeyboard, type OverlayAction } from './keyboard';
import { drawSelection } from './selection';
import { Magnifier } from './magnifier';
import { SizeIndicator } from './size-indicator';
import { Spotlight } from './spotlight';
import { getTool } from './tools/registry';
import { laserTrail } from './tools/laser';
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
/** Élément sélectionné (outil Sélection), retrouvé par son identifiant après undo / redo. */
let selectedId: string | null = null;
/** Vrai pendant une capture d'écran : l'interface de l'overlay est masquée. */
let capturing = false;
const history = new History<readonly Shape[]>([]);
const sizeIndicator = new SizeIndicator();
const spotlight = new Spotlight();
const magnifier = new Magnifier();

const activeCanvas = requireCanvas('layer-active');
const layers = new LayeredCanvas(
  requireCanvas('layer-committed'),
  activeCanvas,
  () => history.present,
  () => preview,
  (ctx) => {
    const selected = selectedShape();
    if (selected && !capturing) drawSelection(ctx, selected, state.color);
    if (laserTrail.isAlive) {
      laserTrail.draw(ctx, performance.now(), state.color, Math.max(4, state.size * 1.5));
      // Animation du fondu : une image de plus tant que la traînée n'a pas disparu.
      if (laserTrail.isAlive) layers.invalidateActive();
    }
  },
);

function selectedShape(): Shape | undefined {
  return selectedId === null ? undefined : history.present.find((s) => s.id === selectedId);
}

/** À appeler quand la liste des formes change : le cadre de sélection suit l'élément. */
function shapesChanged(): void {
  layers.invalidateCommitted();
  layers.invalidateActive();
}

const toolContext: ToolContext = {
  get state() {
    return state;
  },
  getShapes: () => history.present,
  commitShapes(next) {
    history.commit(next);
    shapesChanged();
    api.notifyCommitted();
  },
  amendShapes(next) {
    history.amend(next);
    shapesChanged();
  },
  requestActiveRender() {
    layers.invalidateActive();
  },
  setSelection(id) {
    selectedId = id;
    layers.invalidateActive();
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
  document.body.dataset['board'] = state.board;
  spotlight.setEnabled(state.spotlight);
  spotlight.setRadius(state.spotlightRadius);
  void magnifier.setEnabled(state.magnifier);
  magnifier.setZoom(state.magnifierZoom);
  document.documentElement.style.setProperty('--accent', state.color);
  activeCanvas.style.cursor = getTool(state.tool)?.cursor ?? 'default';
  // La saisie en cours suit couleur et taille ; changer d'outil la valide.
  textEditor.applyStyle(state);
  if (state.tool !== 'text') textEditor.commit();
  // La sélection n'a de sens qu'avec l'outil Sélection, en mode dessin.
  if (state.tool !== 'select' || state.mode !== 'draw') toolContext.setSelection(null);
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
  // Suppr : supprime la sélection s'il y en a une, sinon efface tout (tous les écrans).
  clear: () => {
    const selected = selectedShape();
    if (!selected) {
      api.clearAll();
      return;
    }
    toolContext.commitShapes(history.present.filter((s) => s !== selected));
    toolContext.setSelection(null);
  },
  // Échap, par étapes : désélectionner, fermer la loupe, éteindre le projecteur, fermer le tableau,
  // puis quitter le mode dessin.
  exit: () => {
    if (selectedShape()) toolContext.setSelection(null);
    else if (state.magnifier) api.updateState({ magnifier: false });
    else if (state.spotlight) api.updateState({ spotlight: false });
    else if (state.board !== 'none') api.updateState({ board: 'none' });
    else api.updateState({ mode: 'passive' });
  },
  // W / B : ouvre le tableau, ou le ferme s'il est déjà affiché.
  spotlight: () => api.updateState({ spotlight: !state.spotlight }),
  magnifier: () => api.updateState({ magnifier: !state.magnifier }),
  board: ({ board }) => api.updateState({ board: state.board === board ? 'none' : board }),
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
    const direction = e.deltaY < 0 ? 1 : -1;
    // Molette, par priorité : zoom de la loupe, rayon du projecteur, sinon épaisseur.
    if (state.magnifier) {
      api.updateState({ magnifierZoom: stepMagnifierZoom(state.magnifierZoom, direction) });
    } else if (state.spotlight) {
      api.updateState({ spotlightRadius: stepSpotlightRadius(state.spotlightRadius, direction) });
    } else {
      api.updateState({ size: stepSize(state.size, direction) });
    }
  },
  { passive: true },
);

// Capture d'écran : masque l'interface (liseré, sélection, loupe…), puis confirme au main
// une fois l'écran redessiné (deux images : la première applique, la seconde est affichée).
api.onCapturing((active) => {
  capturing = active;
  document.body.classList.toggle('capturing', active);
  layers.invalidateActive();
  if (active) requestAnimationFrame(() => requestAnimationFrame(() => api.notifyCaptureReady()));
});

// Ordres de l'historique global.
api.onUndoRequested(() => {
  if (history.undo()) shapesChanged();
});
api.onRedoRequested(() => {
  if (history.redo()) shapesChanged();
});
// « Tout effacer » est une étape comme une autre, rattachée au groupe multi-écrans.
api.onClearRequested((groupId) => {
  if (history.present.length === 0) return;
  history.commit([]);
  shapesChanged();
  api.notifyCommitted(groupId);
});

window.addEventListener('resize', () => layers.resize());
watchPixelRatio(() => layers.resize());

api.onStateChanged(render);
void api.getState().then(render);
