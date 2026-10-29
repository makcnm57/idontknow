/**
 * Point d'entrée du processus main : cycle de vie de l'application.
 */
import { app, dialog } from 'electron';
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
import { initOverlays } from './overlay';
import { takeScreenshot } from './screenshot';
import { flushSettings, loadSettings, updateSettings } from './settings';
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
    quit: () => app.quit(),
  };
  createTray(trayActions);
  onControllerChange(() => refreshTray(trayActions));

  const failed = registerGlobalShortcuts({
    toggleVisible,
    toggleMode,
    screenshot,
    zoneCapture,
  });
  if (failed.length > 0) {
    dialog.showErrorBox(
      'ScreenDraw — raccourcis indisponibles',
      `Ces raccourcis sont déjà utilisés par une autre application :\n${failed.join('\n')}`,
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
