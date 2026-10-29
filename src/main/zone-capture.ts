/**
 * Capture d'une zone (Ctrl+Shift+X) : l'écran sous le curseur est capturé tel qu'affiché,
 * l'image figée est présentée dans l'overlay où l'on trace un rectangle, puis la zone est
 * découpée et livrée comme une capture complète (presse-papiers + fichier).
 */
import { ipcMain, screen } from 'electron';
import { IpcChannel } from '@shared/ipc-channels';
import { getState, isVisible, setVisible, updateState } from './controller';
import { getOverlayForDisplay, getOverlays } from './overlay';
import {
  captureWithoutInterface,
  deliverCapture,
  exclusiveCapture,
  notifyNoImage,
} from './screenshot';
import { getToolbar, setToolbarVisible } from './toolbar';
import { sendTo } from './window-utils';
import { toImageRect } from './zone-geometry';

/** Réponse attendue de l'overlay (rectangle choisi, ou `null` si annulé). */
let pendingResult: ((rect: unknown) => void) | null = null;

export function startZoneCapture(): Promise<void> {
  return exclusiveCapture(async () => {
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const image = await captureWithoutInterface(display);
    if (!image) {
      notifyNoImage();
      return;
    }
    const overlay = getOverlayForDisplay(display.id);
    if (!overlay) return;

    // L'overlay doit capter la souris et le clavier le temps de la sélection.
    const wasVisible = isVisible();
    const previousMode = getState().mode;
    setVisible(true);
    updateState({ mode: 'draw' });
    getToolbar()?.hide();
    overlay.focus();

    const result = await new Promise<unknown>((resolve) => {
      pendingResult = resolve;
      sendTo(overlay, IpcChannel.ZoneStart, { png: image.toPNG() });
    });
    pendingResult = null;

    // Retour à l'état d'avant, avant la livraison (qui peut prendre un peu de temps).
    updateState({ mode: previousMode });
    setVisible(wasVisible);
    setToolbarVisible(wasVisible);

    const size = image.getSize();
    const rect = toImageRect(result, size.width / display.size.width, size.width, size.height);
    if (rect) await deliverCapture(image.crop(rect));
  });
}

export function registerZoneCaptureHandlers(): void {
  ipcMain.on(IpcChannel.ZoneCaptureTake, () => void startZoneCapture());
  ipcMain.on(IpcChannel.ZoneResult, (event, payload: unknown) => {
    // Seul un overlay répond ; la donnée est validée par `toImageRect`.
    if (!getOverlays().some((win) => win.webContents.id === event.sender.id)) return;
    pendingResult?.((payload as { rect?: unknown } | null)?.rect ?? null);
  });
}
