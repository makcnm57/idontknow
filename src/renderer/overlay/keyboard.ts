/**
 * Raccourcis clavier locaux de l'overlay (actifs seulement quand il a le focus).
 */

export interface OverlayCommands {
  undo(): void;
  redo(): void;
  clearAll(): void;
  exitDrawMode(): void;
}

/** Associe une combinaison (ex. « ctrl+z ») à une commande. */
const BINDINGS: Record<string, keyof OverlayCommands> = {
  'ctrl+z': 'undo',
  'ctrl+y': 'redo',
  'ctrl+shift+z': 'redo',
  delete: 'clearAll',
  escape: 'exitDrawMode',
};

/**
 * Combinaison normalisée d'un événement. On utilise `e.key` (le caractère produit) et non
 * `e.code` (la touche physique), pour que Ctrl+Z corresponde à la lettre Z en AZERTY.
 */
export function comboOf(
  e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey'>,
): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

export function attachKeyboard(commands: OverlayCommands): void {
  window.addEventListener('keydown', (e) => {
    const command = BINDINGS[comboOf(e)];
    if (!command) return;
    e.preventDefault();
    commands[command]();
  });
}
