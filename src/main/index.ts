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
} from './controller';
import { registerIpcHandlers } from './ipc';
import { initOverlays } from './overlay';
import { takeScreenshot } from './screenshot';
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

  createToolbar();
  initOverlays(configureOverlay);

  const screenshot = (): void => void takeScreenshot();
  const trayActions: TrayActions = {
    isVisible,
    isDrawing: () => getState().mode === 'draw',
    toggleVisible,
    toggleMode,
    screenshot,
    quit: () => app.quit(),
  };
  createTray(trayActions);
  onControllerChange(() => refreshTray(trayActions));

  const failed = registerGlobalShortcuts({ toggleVisible, toggleMode, screenshot });
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

app.on('will-quit', unregisterGlobalShortcuts);
