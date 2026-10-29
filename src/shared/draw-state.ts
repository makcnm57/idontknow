/**
 * État de dessin : valeurs par défaut et validation des modifications.
 * Les patchs arrivent du renderer par IPC : on ne leur fait pas confiance aveuglément.
 */
import { PALETTE, SIZE_PRESETS } from './palette';
import { TOOL_IDS, type DrawState, type InteractionMode, type ToolId } from './types';

export const MIN_SIZE = 1;
export const MAX_SIZE = 64;

export const DEFAULT_DRAW_STATE: DrawState = {
  tool: 'pen',
  color: PALETTE[0],
  size: SIZE_PRESETS[1],
  mode: 'passive',
};

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
  if (typeof input['size'] === 'number' && Number.isFinite(input['size'])) {
    clean.size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(input['size'])));
  }
  return clean;
}

/** Applique un patch déjà validé ; renvoie le même objet si rien ne change. */
export function applyStatePatch(state: DrawState, patch: Partial<DrawState>): DrawState {
  const next = { ...state, ...patch };
  const changed = (Object.keys(next) as (keyof DrawState)[]).some((k) => next[k] !== state[k]);
  return changed ? next : state;
}
