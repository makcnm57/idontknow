/**
 * Raccourcis globaux (actifs même quand une autre application a le focus).
 * Les raccourcis à une lettre sont gérés dans l'overlay, jamais ici.
 */
import { globalShortcut } from 'electron';

export interface GlobalShortcutActions {
  toggleVisible(): void;
  toggleMode(): void;
}

const BINDINGS: Record<string, keyof GlobalShortcutActions> = {
  'CommandOrControl+Shift+D': 'toggleVisible',
  'CommandOrControl+Shift+F': 'toggleMode',
};

/**
 * Enregistre les raccourcis globaux.
 * Renvoie ceux qui n'ont pas pu l'être (déjà pris par une autre application).
 */
export function registerGlobalShortcuts(actions: GlobalShortcutActions): string[] {
  const failed: string[] = [];
  for (const [accelerator, action] of Object.entries(BINDINGS)) {
    const ok = globalShortcut.register(accelerator, () => actions[action]());
    if (!ok) failed.push(accelerator);
  }
  return failed;
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}
