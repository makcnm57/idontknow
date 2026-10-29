/**
 * Raccourcis globaux (actifs même quand une autre application a le focus), personnalisables.
 * Les raccourcis à une lettre sont gérés dans l'overlay, jamais ici.
 */
import { globalShortcut } from 'electron';
import { GLOBAL_ACTIONS, type GlobalAction, type ShortcutMap } from '@shared/shortcuts';

export type GlobalShortcutActions = Record<GlobalAction, () => void>;

let handlers: GlobalShortcutActions | null = null;
let active: ShortcutMap | null = null;

/**
 * Enregistre tous les raccourcis. Renvoie les actions dont le raccourci est déjà
 * pris par une autre application (Windows refuse alors l'enregistrement).
 */
export function registerGlobalShortcuts(
  map: ShortcutMap,
  actions: GlobalShortcutActions,
): GlobalAction[] {
  handlers = actions;
  active = { ...map };
  globalShortcut.unregisterAll();
  return GLOBAL_ACTIONS.filter((action) => !globalShortcut.register(map[action], actions[action]));
}

/**
 * Remplace le raccourci d'une action. En cas de refus de Windows (combinaison prise par
 * une autre application), l'ancien raccourci est réenregistré et `false` est renvoyé.
 */
export function rebindShortcut(action: GlobalAction, accelerator: string): boolean {
  if (!handlers || !active) return false;
  const previous = active[action];
  if (previous === accelerator) return true;
  globalShortcut.unregister(previous);
  if (globalShortcut.register(accelerator, handlers[action])) {
    active[action] = accelerator;
    return true;
  }
  globalShortcut.register(previous, handlers[action]);
  return false;
}

/**
 * Suspend les raccourcis le temps de saisir une nouvelle combinaison dans les paramètres :
 * sinon, appuyer sur Ctrl+Maj+D pour le réattribuer masquerait l'overlay.
 */
export function suspendGlobalShortcuts(suspended: boolean): void {
  if (suspended) globalShortcut.unregisterAll();
  else if (active && handlers) registerGlobalShortcuts(active, handlers);
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
}
