/**
 * Fenêtre Paramètres : chaque réglage s'applique immédiatement (pas de bouton Enregistrer).
 * Toutes les valeurs sont revalidées côté main ; les erreurs reviennent par champ.
 */
import type { SettingsUpdateResult, SettingsView, Theme } from '@shared/preferences';
import {
  ACTION_LABELS,
  acceleratorFromKey,
  DEFAULT_SHORTCUTS,
  formatAccelerator,
  GLOBAL_ACTIONS,
  type GlobalAction,
} from '@shared/shortcuts';

const api = window.screendraw;

function $<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Élément ${selector} introuvable`);
  return element;
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph']);

// --- Raccourcis : une ligne par action (libellé, touche cliquable, réinitialiser, erreur).
const list = $<HTMLDivElement>('#shortcuts');
const rows = new Map<GlobalAction, { key: HTMLButtonElement; error: HTMLDivElement }>();
for (const action of GLOBAL_ACTIONS) {
  const label = document.createElement('span');
  label.textContent = ACTION_LABELS[action];
  const key = document.createElement('button');
  key.type = 'button';
  key.className = 'shortcut-key';
  key.dataset['action'] = action;
  key.setAttribute('aria-label', `Raccourci : ${ACTION_LABELS[action]}`);
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'secondary';
  reset.dataset['reset'] = action;
  reset.textContent = 'Défaut';
  reset.title = formatAccelerator(DEFAULT_SHORTCUTS[action]);
  const error = document.createElement('div');
  error.className = 'shortcut-error';
  error.hidden = true;
  list.append(label, key, reset, error);
  rows.set(action, { key, error });

  key.addEventListener('click', () => startRecording(action));
  reset.addEventListener(
    'click',
    () => void update({ shortcuts: { [action]: DEFAULT_SHORTCUTS[action] } }),
  );
}

let view: SettingsView | null = null;
let recording: GlobalAction | null = null;

function showError(action: GlobalAction, message: string | undefined): void {
  const row = rows.get(action);
  if (!row) return;
  row.error.textContent = message ?? '';
  row.error.hidden = !message;
}

function stopRecording(): void {
  if (recording === null) return;
  rows.get(recording)?.key.classList.remove('recording');
  recording = null;
  // Les raccourcis globaux reprennent dès la fin de la saisie.
  api.setShortcutRecording(false);
  if (view) render(view);
}

function startRecording(action: GlobalAction): void {
  stopRecording();
  recording = action;
  const row = rows.get(action);
  if (!row) return;
  showError(action, undefined);
  row.key.classList.add('recording');
  row.key.textContent = 'Appuyez sur la combinaison…';
  api.setShortcutRecording(true);
}

window.addEventListener(
  'keydown',
  (e) => {
    if (recording === null) return;
    e.preventDefault();
    e.stopPropagation();
    const action = recording;
    if (e.key === 'Escape') return stopRecording();
    if (MODIFIER_KEYS.has(e.key)) return; // on attend la touche principale
    const accelerator = acceleratorFromKey(e);
    if (!accelerator) {
      showError(
        action,
        'Combinaison non valide : ajoutez Ctrl, Alt ou Windows (ou une touche F1…F24).',
      );
      return;
    }
    stopRecording();
    void update({ shortcuts: { [action]: accelerator } });
  },
  { capture: true },
);
// Fenêtre quittée pendant la saisie : on abandonne, et les raccourcis reprennent.
window.addEventListener('blur', stopRecording);

// --- Dossier, démarrage, thème.
const folderPath = $<HTMLDivElement>('#folder-path');
$<HTMLButtonElement>('#choose-folder').addEventListener('click', () => {
  void api.chooseCaptureFolder().then((result) => result && apply(result));
});
$<HTMLButtonElement>('#default-folder').addEventListener(
  'click',
  () => void update({ captureFolder: null }),
);

const startup = $<HTMLInputElement>('#startup');
startup.addEventListener('change', () => void update({ launchAtStartup: startup.checked }));

const themeInputs = [...document.querySelectorAll<HTMLInputElement>('input[name=theme]')];
for (const input of themeInputs) {
  input.addEventListener('change', () => void update({ theme: input.value as Theme }));
}

function render(next: SettingsView): void {
  view = next;
  document.documentElement.dataset['theme'] = next.theme;
  for (const [action, row] of rows) {
    if (action !== recording) row.key.textContent = formatAccelerator(next.shortcuts[action]);
  }
  folderPath.textContent = next.captureFolder ?? `${next.defaultCaptureFolder} (par défaut)`;
  folderPath.title = next.captureFolder ?? next.defaultCaptureFolder;
  startup.checked = next.launchAtStartup;
  $<HTMLParagraphElement>('#startup-note').hidden = next.isPackaged;
  for (const input of themeInputs) input.checked = input.value === next.theme;
}

function apply(result: SettingsUpdateResult): void {
  render(result.view);
  for (const action of GLOBAL_ACTIONS) showError(action, result.errors[`shortcut:${action}`]);
}

async function update(patch: Parameters<typeof api.updatePreferences>[0]): Promise<void> {
  const result = await api.updatePreferences(patch);
  if (result) apply(result);
}

api.onPreferencesChanged(render);
void api.getPreferences().then(render);
