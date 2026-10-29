/**
 * Raccourcis clavier locaux de l'overlay (actifs seulement quand il a le focus).
 * La résolution touche → action est pure et testée ; l'exécution est faite par l'appelant.
 */
import type { ToolId } from '@shared/types';

export type OverlayAction =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear' }
  | { type: 'exit' }
  | { type: 'tool'; tool: ToolId }
  | { type: 'color'; index: number };

type KeyInfo = Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>;

const COMBOS: Record<string, OverlayAction> = {
  'ctrl+z': { type: 'undo' },
  'ctrl+y': { type: 'redo' },
  'ctrl+shift+z': { type: 'redo' },
  delete: { type: 'clear' },
  escape: { type: 'exit' },
  p: { type: 'tool', tool: 'pen' },
  h: { type: 'tool', tool: 'highlighter' },
  e: { type: 'tool', tool: 'eraser' },
};

/**
 * Combinaison normalisée d'un événement. On utilise `e.key` (le caractère produit) et non
 * `e.code` (la touche physique), pour que Ctrl+Z corresponde à la lettre Z en AZERTY.
 */
export function comboOf(e: Omit<KeyInfo, 'code'>): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  // AltGr est vu comme Ctrl+Alt sous Windows : « alt » évite de déclencher Ctrl+Z avec AltGr.
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

export function resolveShortcut(e: KeyInfo): OverlayAction | undefined {
  // Couleurs 1 à 8 : touche physique (`code`), car en AZERTY la rangée du haut
  // produit « & é " ' … » sans Maj. Le pavé numérique fonctionne aussi.
  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    const digit = /^(?:Digit|Numpad)([1-8])$/.exec(e.code)?.[1];
    if (digit) return { type: 'color', index: Number(digit) - 1 };
  }
  return COMBOS[comboOf(e)];
}

export function attachKeyboard(run: (action: OverlayAction) => void): void {
  window.addEventListener('keydown', (e) => {
    const action = resolveShortcut(e);
    if (!action) return;
    e.preventDefault();
    run(action);
  });
}
