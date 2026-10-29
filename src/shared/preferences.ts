/**
 * Préférences de l'application (fenêtre Paramètres) : types et validation (logique pure).
 * Une même fonction valide le fichier relu au démarrage et les demandes venant de l'IPC.
 */
import {
  DEFAULT_SHORTCUTS,
  GLOBAL_ACTIONS,
  isValidAccelerator,
  type ShortcutMap,
} from './shortcuts';

export type Theme = 'system' | 'light' | 'dark';

export interface Preferences {
  shortcuts: ShortcutMap;
  launchAtStartup: boolean;
  /** Dossier des captures ; `null` = Images\ScreenDraw. */
  captureFolder: string | null;
  theme: Theme;
}

export const DEFAULT_PREFERENCES: Preferences = {
  shortcuts: DEFAULT_SHORTCUTS,
  launchAtStartup: false,
  captureFolder: null,
  theme: 'system',
};

/** Ce que la fenêtre Paramètres affiche (préférences + informations utiles). */
export interface SettingsView extends Preferences {
  defaultCaptureFolder: string;
  /** Faux en développement : le lancement au démarrage n'y est pas appliqué. */
  isPackaged: boolean;
}

/** Résultat d'une modification : vue à jour, et erreurs éventuelles par champ. */
export interface SettingsUpdateResult {
  view: SettingsView;
  errors: Partial<Record<keyof Preferences | `shortcut:${string}`, string>>;
}

export type PreferencesPatch = Partial<Omit<Preferences, 'shortcuts'>> & {
  shortcuts?: Partial<ShortcutMap>;
};

const isTheme = (v: unknown): v is Theme => v === 'system' || v === 'light' || v === 'dark';

/** Chemin Windows absolu (lecteur ou partage réseau), sans caractère de contrôle. */
const isAbsoluteWindowsPath = (v: unknown): v is string =>
  typeof v === 'string' &&
  v.length < 500 &&
  /^([a-zA-Z]:\\|\\\\)/.test(v) &&
  // eslint-disable-next-line no-control-regex -- refuse justement les caractères de contrôle
  !/[\u0000-\u001f]/.test(v);

/** Ne garde que les champs valides d'une demande de modification. */
export function sanitizePreferencesPatch(input: unknown): PreferencesPatch {
  if (typeof input !== 'object' || input === null) return {};
  const raw = input as Record<string, unknown>;
  const patch: PreferencesPatch = {};

  if (typeof raw['launchAtStartup'] === 'boolean') patch.launchAtStartup = raw['launchAtStartup'];
  if (isTheme(raw['theme'])) patch.theme = raw['theme'];
  if (raw['captureFolder'] === null || isAbsoluteWindowsPath(raw['captureFolder'])) {
    patch.captureFolder = raw['captureFolder'];
  }
  const shortcuts = raw['shortcuts'];
  if (typeof shortcuts === 'object' && shortcuts !== null) {
    const clean: Partial<ShortcutMap> = {};
    for (const action of GLOBAL_ACTIONS) {
      const value = (shortcuts as Record<string, unknown>)[action];
      if (isValidAccelerator(value)) clean[action] = value;
    }
    if (Object.keys(clean).length > 0) patch.shortcuts = clean;
  }
  return patch;
}

/** Préférences complètes à partir d'une valeur quelconque (fichier relu, par exemple). */
export function parsePreferences(input: unknown): Preferences {
  const patch = sanitizePreferencesPatch(input);
  return {
    ...DEFAULT_PREFERENCES,
    ...patch,
    shortcuts: { ...DEFAULT_SHORTCUTS, ...patch.shortcuts },
  };
}
