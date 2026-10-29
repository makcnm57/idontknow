/**
 * Point d'entrée du processus main : cycle de vie de l'application.
 */
import { app, dialog } from 'electron';
import { ACTION_LABELS, formatAccelerator } from '@shared/shortcuts';
import {
  configureOverlay,
  getState,
  isVisible,
  onControllerChange,
  setVisible,
  toggleMode,
  toggleVisible,
  updateState,
} from './controller';
import { registerIpcHandlers } from './ipc';
import { applyLaunchAtStartup, getPreferences, onPreferencesChange } from './preferences';
import { initOverlays } from './overlay';
import { takeScreenshot } from './screenshot';
import { flushSettings, loadSettings, updateSettings } from './settings';
import { openSettingsWindow } from './settings-window';
import { pickPersisted } from './settings-schema';
import { startZoneCapture } from './zone-capture';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts';
import { createToolbar } from './toolbar';
import { createTray, refreshTray, type TrayActions } from './tray';

// Une seule instance : relancer l'app ré-affiche simplement l'overlay existant.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => setVisible(true));
  void app.whenReady().then(start);
}

function start(): void {
  app.setAppUserModelId('com.kawa.screendraw');
  registerIpcHandlers();

  // Préférences de la session précédente (validées au chargement).
  const settings = loadSettings();
  updateState(settings.draw);
  onControllerChange(() => updateSettings({ draw: pickPersisted(getState()) }));

  createToolbar(settings.toolbar, (toolbar) => updateSettings({ toolbar }));
  initOverlays(configureOverlay);

  const screenshot = (): void => void takeScreenshot();
  const zoneCapture = (): void => void startZoneCapture();
  const trayActions: TrayActions = {
    isVisible,
    isDrawing: () => getState().mode === 'draw',
    toggleVisible,
    toggleMode,
    screenshot,
    zoneCapture,
    shortcuts: () => getPreferences().shortcuts,
    openSettings: openSettingsWindow,
    quit: () => app.quit(),
  };
  createTray(trayActions);
  onControllerChange(() => refreshTray(trayActions));
  onPreferencesChange(() => refreshTray(trayActions));
  applyLaunchAtStartup(getPreferences().launchAtStartup);

  const failed = registerGlobalShortcuts(getPreferences().shortcuts, {
    toggleVisible,
    toggleMode,
    screenshot,
    zoneCapture,
  });
  if (failed.length > 0) {
    const shortcuts = getPreferences().shortcuts;
    const list = failed
      .map((action) => `${ACTION_LABELS[action]} : ${formatAccelerator(shortcuts[action])}`)
      .join('\n');
    dialog.showErrorBox(
      'ScreenDraw — raccourcis indisponibles',
      `Ces raccourcis sont déjà utilisés par une autre application :\n${list}\n\n` +
        "Choisissez-en d'autres dans Paramètres (menu de l'icône ScreenDraw).",
    );
  }

  setVisible(true);
}

// L'application vit dans la zone de notification : fermer les fenêtres ne la quitte pas.
app.on('window-all-closed', () => {
  /* rien : on quitte uniquement via le menu du tray */
});

app.on('will-quit', () => {
  unregisterGlobalShortcuts();
  // Écrit immédiatement les derniers changements encore en attente.
  flushSettings();
});
