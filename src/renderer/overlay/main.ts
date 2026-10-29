/**
 * Overlay de dessin. Étape 1 : affichage du mode et touche Échap.
 * Le moteur (calques, outils, historique) arrive à l'étape 2.
 */
import type { DrawState } from '@shared/types';

const api = window.screendraw;

function render(state: DrawState): void {
  document.body.classList.toggle('mode-draw', state.mode === 'draw');
  document.documentElement.style.setProperty('--accent', state.color);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') api.updateState({ mode: 'passive' });
});

api.onStateChanged(render);
void api.getState().then(render);
