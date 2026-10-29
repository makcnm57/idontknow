/**
 * Raccourcis globaux personnalisables (logique pure) : actions, valeurs par défaut,
 * validation des accélérateurs Electron, conversion d'une touche pressée, affichage.
 */

export const GLOBAL_ACTIONS = ['toggleVisible', 'toggleMode', 'screenshot', 'zoneCapture'] as const;
export type GlobalAction = (typeof GLOBAL_ACTIONS)[number];
export type ShortcutMap = Record<GlobalAction, string>;

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  toggleVisible: 'CommandOrControl+Shift+D',
  toggleMode: 'CommandOrControl+Shift+F',
  screenshot: 'CommandOrControl+Shift+S',
  zoneCapture: 'CommandOrControl+Shift+X',
};

export const ACTION_LABELS: Record<GlobalAction, string> = {
  toggleVisible: 'Afficher / masquer',
  toggleMode: 'Mode dessin / passif',
  screenshot: "Capturer l'écran",
  zoneCapture: 'Capturer une zone',
};

/** Modificateurs, dans l'ordre canonique d'écriture. */
const MODIFIERS = ['CommandOrControl', 'Alt', 'Shift', 'Super'] as const;

/** Touches autorisées comme touche principale. */
const KEY =
  /^([A-Z]|[0-9]|F([1-9]|1[0-9]|2[0-4])|Space|Up|Down|Left|Right|Home|End|PageUp|PageDown|Insert|Delete)$/;
const FUNCTION_KEY = /^F([1-9]|1[0-9]|2[0-4])$/;

/**
 * Vrai pour un accélérateur utilisable en raccourci global : modificateurs connus, sans
 * doublon, puis une touche. Ctrl, Alt ou Windows est exigé (Maj seul intercepterait des
 * caractères tapés partout), sauf pour les touches de fonction F1…F24.
 */
export function isValidAccelerator(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 60) return false;
  const parts = value.split('+');
  const key = parts.pop();
  if (!key || !KEY.test(key)) return false;
  if (new Set(parts).size !== parts.length) return false;
  if (!parts.every((p) => (MODIFIERS as readonly string[]).includes(p))) return false;
  const strong = parts.some((p) => p !== 'Shift');
  return strong || FUNCTION_KEY.test(key);
}

/** Champs utiles d'un événement clavier (sans dépendre des types du DOM : code partagé). */
interface KeyInfo {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

const NAMED_KEYS: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Insert: 'Insert',
  Delete: 'Delete',
};

/**
 * Accélérateur correspondant à une touche pressée, ou `null` (modificateur seul, touche
 * non prise en charge, combinaison trop faible). Les lettres viennent du caractère produit
 * (A en AZERTY reste A), les chiffres de la touche physique (sans Maj en AZERTY).
 */
export function acceleratorFromKey(e: KeyInfo): string | null {
  let key: string | undefined;
  const digit = /^(?:Digit|Numpad)([0-9])$/.exec(e.code)?.[1];
  if (digit) key = digit;
  else if (/^[a-z]$/i.test(e.key)) key = e.key.toUpperCase();
  else if (FUNCTION_KEY.test(e.key)) key = e.key;
  else key = NAMED_KEYS[e.key];
  if (!key) return null;

  const parts: string[] = [];
  if (e.ctrlKey) parts.push('CommandOrControl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Super');
  const accelerator = [...parts, key].join('+');
  return isValidAccelerator(accelerator) ? accelerator : null;
}

const DISPLAY: Record<string, string> = {
  CommandOrControl: 'Ctrl',
  Shift: 'Maj',
  Super: 'Win',
  Space: 'Espace',
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
  Delete: 'Suppr',
  Insert: 'Inser',
  PageUp: 'Pg préc',
  PageDown: 'Pg suiv',
  Home: 'Début',
  End: 'Fin',
};

/** Affichage lisible en français : « Ctrl + Maj + D ». */
export function formatAccelerator(accelerator: string): string {
  return accelerator
    .split('+')
    .map((part) => DISPLAY[part] ?? part)
    .join(' + ');
}

/** Actions qui partagent leur raccourci avec une autre. */
export function duplicateActions(map: ShortcutMap): GlobalAction[] {
  return GLOBAL_ACTIONS.filter((action) =>
    GLOBAL_ACTIONS.some((other) => other !== action && map[other] === map[action]),
  );
}
