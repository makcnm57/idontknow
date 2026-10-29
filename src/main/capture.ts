/**
 * Captures d'écran (desktopCapturer), à pleine résolution (pixels physiques).
 * Utilisé par la loupe (capture figée demandée par un overlay) et par la capture PNG.
 */
import { desktopCapturer, ipcMain, screen, type Display, type NativeImage } from 'electron';
import { IpcChannel } from '@shared/ipc-channels';
import { getOverlays } from './overlay';

/** Image de l'écran `display` telle qu'affichée (fenêtres de l'app comprises). */
export async function captureDisplay(display: Display): Promise<NativeImage | null> {
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
  return source.thumbnail;
}

export function registerCaptureHandlers(): void {
  ipcMain.handle(IpcChannel.CaptureScreen, async (event) => {
    // Seuls les overlays peuvent demander une capture (figée) de leur écran.
    const overlay = getOverlays().find((win) => win.webContents.id === event.sender.id);
    if (!overlay) return null;
    const image = await captureDisplay(screen.getDisplayMatching(overlay.getBounds()));
    return image ? image.toPNG() : null;
  });
}
