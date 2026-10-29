/**
 * Captures d'écran (desktopCapturer). Utilisé par la loupe : chaque overlay demande
 * une capture figée de son propre écran, à pleine résolution.
 */
import { desktopCapturer, ipcMain, screen, type BrowserWindow } from 'electron';
import { IpcChannel } from '@shared/ipc-channels';
import { getOverlays } from './overlay';

/** Capture PNG de l'écran qui contient `win`, en pixels physiques (null si indisponible). */
async function captureDisplayOf(win: BrowserWindow): Promise<Uint8Array | null> {
  const display = screen.getDisplayMatching(win.getBounds());
  const { width, height } = display.size;
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    // Taille physique : à 150 %, un écran de 1707 × 960 CSS fait 2560 × 1440 pixels.
    thumbnailSize: {
      width: Math.round(width * display.scaleFactor),
      height: Math.round(height * display.scaleFactor),
    },
  });
  // `display_id` associe chaque source à son écran ; avec un seul écran il peut manquer.
  const source =
    sources.find((s) => s.display_id === String(display.id)) ??
    (sources.length === 1 ? sources[0] : undefined);
  if (!source || source.thumbnail.isEmpty()) return null;
  return source.thumbnail.toPNG();
}

export function registerCaptureHandlers(): void {
  ipcMain.handle(IpcChannel.CaptureScreen, (event) => {
    // Seuls les overlays peuvent demander une capture de leur écran.
    const overlay = getOverlays().find((win) => win.webContents.id === event.sender.id);
    return overlay ? captureDisplayOf(overlay) : null;
  });
}
