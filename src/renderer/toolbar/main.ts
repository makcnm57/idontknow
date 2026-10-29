/**
 * Barre d'outils. Étape 1 : bascule dessin / passif et bouton masquer.
 * Les outils, couleurs et tailles sont ajoutés à l'étape 4.
 */
import type { DrawState } from '@shared/types';

const api = window.screendraw;
const modeToggle = document.querySelector<HTMLButtonElement>('#mode-toggle');
const modeLabel = document.querySelector<HTMLSpanElement>('#mode-label');
const hideButton = document.querySelector<HTMLButtonElement>('#hide');

let currentState: DrawState | null = null;

function render(state: DrawState): void {
  currentState = state;
  const drawing = state.mode === 'draw';
  document.body.classList.toggle('mode-draw', drawing);
  document.documentElement.style.setProperty('--accent', state.color);
  if (modeLabel) modeLabel.textContent = drawing ? 'Dessin' : 'Passif';
  modeToggle?.setAttribute('aria-pressed', String(drawing));
}

modeToggle?.addEventListener('click', () => {
  if (!currentState) return;
  api.updateState({ mode: currentState.mode === 'draw' ? 'passive' : 'draw' });
});

hideButton?.addEventListener('click', () => api.hideOverlay());

api.onStateChanged(render);
void api.getState().then(render);
