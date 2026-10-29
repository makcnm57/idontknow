/**
 * État de dessin : valeurs par défaut et validation des modifications.
 * Les patchs arrivent du renderer par IPC : on ne leur fait pas confiance aveuglément.
 */
import { PALETTE, SIZE_PRESETS } from './palette';
import { TOOL_IDS, type Board, type DrawState, type InteractionMode, type ToolId } from './types';

export const MIN_SIZE = 1;
export const MAX_SIZE = 64;
export const MIN_SPOTLIGHT_RADIUS = 40;
export const MAX_SPOTLIGHT_RADIUS = 900;

export const DEFAULT_DRAW_STATE: DrawState = {
  tool: 'pen',
  color: PALETTE[0],
  size: SIZE_PRESETS[1],
  fill: false,
  board: 'none',
  spotlight: false,
  spotlightRadius: 180,
  mode: 'passive',
};

const clampRadius = (radius: number): number =>
  Math.round(Math.min(MAX_SPOTLIGHT_RADIUS, Math.max(MIN_SPOTLIGHT_RADIUS, radius)));

/** Rayon du projecteur après un cran de molette : ±10 %, pour un réglage fluide à toute taille. */
export function stepSpotlightRadius(radius: number, direction: 1 | -1): number {
  return clampRadius(radius * (direction === 1 ? 1.1 : 1 / 1.1));
}

/**
 * Taille suivante pour un cran de molette (`direction` : +1 ou -1).
 * Le pas grandit avec la taille pour rester perceptible sur les gros traits.
 */
export function stepSize(size: number, direction: 1 | -1): number {
  const step = Math.max(1, Math.round(size * 0.15));
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, size + direction * step));
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isToolId(value: unknown): value is ToolId {
  return typeof value === 'string' && (TOOL_IDS as readonly string[]).includes(value);
}

function isBoard(value: unknown): value is Board {
  return value === 'none' || value === 'white' || value === 'black';
}

function isMode(value: unknown): value is InteractionMode {
  return value === 'draw' || value === 'passive';
}

/**
 * Ne garde que les champs valides d'un patch reçu par IPC.
 * La taille est bornée et arrondie, les valeurs inconnues sont ignorées.
 */
export function sanitizeStatePatch(patch: unknown): Partial<DrawState> {
  if (typeof patch !== 'object' || patch === null) return {};
  const input = patch as Record<string, unknown>;
  const clean: Partial<DrawState> = {};

  if (isToolId(input['tool'])) clean.tool = input['tool'];
  if (isMode(input['mode'])) clean.mode = input['mode'];
  if (typeof input['color'] === 'string' && HEX_COLOR.test(input['color'])) {
    clean.color = input['color'].toLowerCase();
  }
  if (typeof input['fill'] === 'boolean') clean.fill = input['fill'];
  if (isBoard(input['board'])) clean.board = input['board'];
  if (typeof input['spotlight'] === 'boolean') clean.spotlight = input['spotlight'];
  if (typeof input['spotlightRadius'] === 'number' && Number.isFinite(input['spotlightRadius'])) {
    clean.spotlightRadius = clampRadius(input['spotlightRadius']);
  }
  if (typeof input['size'] === 'number' && Number.isFinite(input['size'])) {
    clean.size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(input['size'])));
  }
  return clean;
}

/**
 * Applique un patch déjà validé ; renvoie le même objet si rien ne change.
 *
 * Règle du tableau : l'ouvrir passe en mode dessin (on ouvre un tableau pour dessiner),
 * et repasser en mode passif le ferme (un fond opaque traversé par les clics serait
 * déroutant). Elle s'applique quel que soit le déclencheur : clavier, barre, menu.
 */
export function applyStatePatch(state: DrawState, patch: Partial<DrawState>): DrawState {
  const next = { ...state, ...patch };
  if (next.board !== 'none' && next.board !== state.board) next.mode = 'draw';
  else if (next.mode === 'passive' && state.mode === 'draw') next.board = 'none';
  const changed = (Object.keys(next) as (keyof DrawState)[]).some((k) => next[k] !== state[k]);
  return changed ? next : state;
}
