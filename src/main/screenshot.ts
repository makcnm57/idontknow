/**
 * Capture d'écran (Ctrl+Shift+S) : l'écran sous le curseur avec ses annotations,
 * copié dans le presse-papiers et enregistré en PNG.
 *
 * Avant la capture, la barre d'outils est masquée et l'overlay retire ses éléments
 * d'interface (liseré, cadre de sélection, loupe…) ; il confirme quand c'est redessiné.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  app,
  clipboard,
  ClipboardItem,
  ipcMain,
  Notification,
  screen,
  shell,
  type BrowserWindow,
  type Display,
  type IpcMainEvent,
  type NativeImage,
} from 'electron';
import { IpcChannel } from '@shared/ipc-channels';
import iconPath from '../../resources/icon.png?asset';
import { delay, withTimeout } from './async-utils';
import { captureDisplay } from './capture';
import { captureFileName } from './capture-file';
import { getOverlayForDisplay } from './overlay';
import { getToolbar, setToolbarVisible } from './toolbar';
import { sendTo } from './window-utils';

/** Délai maximal d'attente de la confirmation de l'overlay. */
const READY_TIMEOUT_MS = 500;
/** Marge laissée au compositeur de Windows pour afficher l'état masqué. */
const COMPOSITOR_DELAY_MS = 80;
/** Délai maximal d'une écriture disque (voir `withTimeout`). */
const WRITE_TIMEOUT_MS = 3000;

/** Attend que l'overlay confirme avoir masqué son interface (ou abandonne après un délai). */
function waitForOverlayReady(overlay: BrowserWindow): Promise<void> {
  return new Promise((resolve) => {
    const done = (): void => {
      clearTimeout(timer);
      ipcMain.removeListener(IpcChannel.CaptureReady, onReady);
      resolve();
    };
    const onReady = (event: IpcMainEvent): void => {
      if (event.sender.id === overlay.webContents.id) done();
    };
    const timer = setTimeout(done, READY_TIMEOUT_MS);
    ipcMain.on(IpcChannel.CaptureReady, onReady);
  });
}

/** Masque l'interface, capture l'écran, puis restaure aussitôt l'interface. */
export async function captureWithoutInterface(display: Display): Promise<NativeImage | null> {
  const overlay = getOverlayForDisplay(display.id);
  const toolbarWasVisible = getToolbar()?.isVisible() ?? false;
  try {
    getToolbar()?.hide();
    if (overlay?.isVisible()) {
      const ready = waitForOverlayReady(overlay);
      sendTo(overlay, IpcChannel.OverlayCapturing, { active: true });
      await ready;
    }
    await delay(COMPOSITOR_DELAY_MS);
    return await captureDisplay(display);
  } finally {
    sendTo(overlay ?? null, IpcChannel.OverlayCapturing, { active: false });
    if (toolbarWasVisible) setToolbarVisible(true);
  }
}

async function writeInto(folder: string, name: string, png: Buffer): Promise<string> {
  await withTimeout(mkdir(folder, { recursive: true }), WRITE_TIMEOUT_MS, 'Création du dossier');
  const file = join(folder, name);
  await withTimeout(writeFile(file, png), WRITE_TIMEOUT_MS, 'Écriture du fichier');
  return file;
}

/** Vrai si Images a déjà refusé une écriture pendant cette session. */
let picturesBlocked = false;

interface SavedCapture {
  file: string;
  /** Vrai si le fichier a atterri dans le dossier de repli (Téléchargements). */
  fallback: boolean;
}

/**
 * Enregistre dans Images\ScreenDraw ; si Windows le refuse (accès contrôlé aux dossiers
 * de Defender, qui protège Images, Documents, Bureau…), se replie sur
 * Téléchargements\ScreenDraw, non protégé par défaut. `null` si les deux échouent.
 */
async function saveCapture(png: Buffer, name: string): Promise<SavedCapture | null> {
  if (!picturesBlocked) {
    const preferred = join(app.getPath('pictures'), 'ScreenDraw');
    try {
      return { file: await writeInto(preferred, name, png), fallback: false };
    } catch (error) {
      // Retenu pour la session : les captures suivantes n'attendent plus le délai.
      picturesBlocked = true;
      console.warn('[capture] dossier Images inaccessible :', error);
    }
  }
  const fallback = join(app.getPath('downloads'), 'ScreenDraw');
  try {
    return { file: await writeInto(fallback, name, png), fallback: true };
  } catch (error) {
    console.error('[capture] dossier de repli inaccessible :', error);
    return null;
  }
}

function notify(title: string, body: string, file?: string): void {
  if (!Notification.isSupported()) return;
  const notification = new Notification({ title, body, icon: iconPath });
  // Clic sur la notification : ouvre l'explorateur sur le fichier.
  if (file) notification.on('click', () => shell.showItemInFolder(file));
  notification.show();
}

/** Une seule capture à la fois, complète ou de zone. */
let busy = false;

/** Exécute `task` si aucune capture n'est en cours ; toute erreur est notifiée. */
export async function exclusiveCapture(task: () => Promise<void>): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    await task();
  } catch (error) {
    console.error('[capture]', error);
    notify('Capture impossible', error instanceof Error ? error.message : String(error));
  } finally {
    busy = false;
  }
}

export function notifyNoImage(): void {
  notify('Capture impossible', "Windows n'a pas fourni d'image de cet écran.");
}

/**
 * Livre une image capturée : presse-papiers d'abord (l'image reste disponible même si
 * l'enregistrement échoue), puis fichier PNG, puis notification.
 */
export async function deliverCapture(image: NativeImage): Promise<void> {
  const png = image.toPNG();
  const name = captureFileName(new Date());
  // API presse-papiers d'Electron 45 (asynchrone, calquée sur celle du W3C).
  await clipboard.write([
    new ClipboardItem({ 'image/png': new Blob([png], { type: 'image/png' }) }),
  ]);

  const saved = await saveCapture(png, name);
  if (!saved) {
    notify('Capture copiée', "Elle n'a pas pu être enregistrée sur le disque.");
  } else if (saved.fallback) {
    notify(
      'Capture enregistrée dans Téléchargements',
      `Windows protège le dossier Images (accès contrôlé aux dossiers). ${name} est dans Téléchargements\\ScreenDraw et copiée.`,
      saved.file,
    );
  } else {
    notify('Capture enregistrée', `${name} — copiée dans le presse-papiers`, saved.file);
  }
}

/** Capture complète de l'écran sous le curseur (Ctrl+Shift+S). */
export function takeScreenshot(): Promise<void> {
  return exclusiveCapture(async () => {
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const image = await captureWithoutInterface(display);
    if (image) await deliverCapture(image);
    else notifyNoImage();
  });
}

export function registerScreenshotHandlers(): void {
  ipcMain.on(IpcChannel.ScreenshotTake, () => void takeScreenshot());
}
