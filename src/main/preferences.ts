/**
 * Préférences de l'application : lecture, modification validée et effets de bord
 * (raccourcis, lancement au démarrage, thème), plus les gestionnaires IPC associés.
 */
import { join } from 'node:path';
import { app, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IpcChannel } from '@shared/ipc-channels';
import {
  sanitizePreferencesPatch,
  type Preferences,
  type SettingsUpdateResult,
  type SettingsView,
} from '@shared/preferences';
import { ACTION_LABELS, GLOBAL_ACTIONS } from '@shared/shortcuts';
import { getSettings, updateSettings } from './settings';
import { getSettingsWindow, openSettingsWindow } from './settings-window';
import { rebindShortcut, suspendGlobalShortcuts } from './shortcuts';
import { getToolbar } from './toolbar';
import { sendTo } from './window-utils';

const listeners = new Set<() => void>();

export function getPreferences(): Preferences {
  return getSettings().preferences;
}

/** S'abonne aux changements de préférences (menu du tray, par exemple). */
export function onPreferencesChange(listener: () => void): void {
  listeners.add(listener);
}

export const defaultCaptureFolder = (): string => join(app.getPath('pictures'), 'ScreenDraw');

function view(): SettingsView {
  return {
    ...getPreferences(),
    defaultCaptureFolder: defaultCaptureFolder(),
    isPackaged: app.isPackaged,
  };
}

/**
 * Lancement au démarrage : seulement pour l'app installée. En développement, Windows
 * lancerait `electron.exe` seul au démarrage, sans ScreenDraw.
 */
export function applyLaunchAtStartup(enabled: boolean): void {
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: enabled });
}

function applyPatch(input: unknown): SettingsUpdateResult {
  const patch = sanitizePreferencesPatch(input);
  const current = getPreferences();
  const next: Preferences = { ...current, ...patch, shortcuts: { ...current.shortcuts } };
  const errors: SettingsUpdateResult['errors'] = {};

  for (const action of GLOBAL_ACTIONS) {
    const accelerator = patch.shortcuts?.[action];
    if (!accelerator || accelerator === current.shortcuts[action]) continue;
    const owner = GLOBAL_ACTIONS.find(
      (other) => other !== action && next.shortcuts[other] === accelerator,
    );
    if (owner) {
      errors[`shortcut:${action}`] = `Déjà utilisé par « ${ACTION_LABELS[owner]} ».`;
    } else if (!rebindShortcut(action, accelerator)) {
      errors[`shortcut:${action}`] = 'Déjà utilisé par une autre application.';
    } else {
      next.shortcuts[action] = accelerator;
    }
  }
  if (patch.launchAtStartup !== undefined) applyLaunchAtStartup(patch.launchAtStartup);

  updateSettings({ preferences: next });
  const updated = view();
  // Le thème concerne la barre d'outils et la fenêtre Paramètres.
  sendTo(getToolbar(), IpcChannel.PrefsChanged, updated);
  sendTo(getSettingsWindow(), IpcChannel.PrefsChanged, updated);
  listeners.forEach((listener) => listener());
  return { view: updated, errors };
}

const fromSettingsWindow = (event: IpcMainInvokeEvent): boolean =>
  event.sender.id === getSettingsWindow()?.webContents.id;

export function registerPreferencesHandlers(): void {
  // Lecture ouverte à toutes nos fenêtres (la barre lit le thème).
  ipcMain.handle(IpcChannel.PrefsGet, (): SettingsView => view());

  ipcMain.handle(IpcChannel.PrefsUpdate, (event, patch: unknown): SettingsUpdateResult | null =>
    fromSettingsWindow(event) ? applyPatch(patch) : null,
  );

  ipcMain.handle(
    IpcChannel.PrefsChooseFolder,
    async (event): Promise<SettingsUpdateResult | null> => {
      const win = getSettingsWindow();
      if (!win || !fromSettingsWindow(event)) return null;
      const result = await dialog.showOpenDialog(win, {
        title: 'Dossier des captures',
        defaultPath: getPreferences().captureFolder ?? defaultCaptureFolder(),
        properties: ['openDirectory', 'createDirectory'],
      });
      const folder = result.filePaths[0];
      return result.canceled || !folder ? null : applyPatch({ captureFolder: folder });
    },
  );

  ipcMain.on(IpcChannel.SettingsOpen, (event) => {
    if (event.sender.id === getToolbar()?.webContents.id) openSettingsWindow();
  });

  ipcMain.on(IpcChannel.PrefsRecording, (event, payload: unknown) => {
    if (event.sender.id !== getSettingsWindow()?.webContents.id) return;
    suspendGlobalShortcuts((payload as { active?: unknown } | null)?.active === true);
  });
}
