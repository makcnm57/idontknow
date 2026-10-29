/**
 * Paramètres persistants : forme, valeurs par défaut et validation (logique pure).
 * Le fichier peut être corrompu ou modifié à la main : tout est revalidé au chargement.
 */
import { DEFAULT_DRAW_STATE, sanitizeStatePatch } from '@shared/draw-state';
import { DEFAULT_PREFERENCES, parsePreferences, type Preferences } from '@shared/preferences';
import type { DrawState, Point } from '@shared/types';

/**
 * Préférences de dessin retenues d'une session à l'autre. Les états du moment
 * (mode, tableau, projecteur ou loupe allumés) repartent à zéro à chaque lancement.
 */
export const PERSISTED_DRAW_KEYS = [
  'tool',
  'color',
  'size',
  'fill',
  'spotlightRadius',
  'magnifierZoom',
] as const satisfies readonly (keyof DrawState)[];

export type PersistedDraw = Pick<DrawState, (typeof PERSISTED_DRAW_KEYS)[number]>;

/**
 * Position de la barre d'outils : son centre horizontal et son bord haut. Le centre,
 * et non le bord gauche, car la barre se recentre en ajustant sa largeur au contenu.
 */
export interface ToolbarPosition {
  centerX: number;
  y: number;
}

export interface Settings {
  version: 1;
  draw: PersistedDraw;
  toolbar: ToolbarPosition | null;
  /** Réglages de la fenêtre Paramètres (raccourcis, démarrage, dossier, thème). */
  preferences: Preferences;
}

export function pickPersisted(state: DrawState): PersistedDraw {
  const picked: Partial<PersistedDraw> = {};
  for (const key of PERSISTED_DRAW_KEYS) Object.assign(picked, { [key]: state[key] });
  return picked as PersistedDraw;
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  draw: pickPersisted(DEFAULT_DRAW_STATE),
  toolbar: null,
  preferences: DEFAULT_PREFERENCES,
};

function parseToolbar(raw: unknown): ToolbarPosition | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { centerX, y } = raw as Record<string, unknown>;
  return typeof centerX === 'number' &&
    Number.isFinite(centerX) &&
    typeof y === 'number' &&
    Number.isFinite(y)
    ? { centerX, y }
    : null;
}

/**
 * Paramètres lus depuis le fichier → paramètres sûrs. Les champs invalides ou inconnus
 * sont ignorés et remplacés par les valeurs par défaut ; jamais d'exception.
 */
export function parseSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const input = raw as Record<string, unknown>;
  // Même validation que les messages IPC, restreinte aux clés persistées.
  const clean = sanitizeStatePatch(input['draw']);
  const draw = { ...DEFAULT_SETTINGS.draw };
  for (const key of PERSISTED_DRAW_KEYS) {
    if (clean[key] !== undefined) Object.assign(draw, { [key]: clean[key] });
  }
  return {
    version: 1,
    draw,
    toolbar: parseToolbar(input['toolbar']),
    preferences: parsePreferences(input['preferences']),
  };
}

/** Vrai si le point est dans l'une des zones (zones de travail des écrans branchés). */
export function isOnSomeScreen(
  point: Point,
  areas: readonly { x: number; y: number; width: number; height: number }[],
): boolean {
  return areas.some(
    (a) => point.x >= a.x && point.x < a.x + a.width && point.y >= a.y && point.y < a.y + a.height,
  );
}
