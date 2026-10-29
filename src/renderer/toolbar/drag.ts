/**
 * Déplacement de la barre par sa poignée.
 *
 * La fenêtre n'est pas activable : Windows ignore alors `-webkit-app-region: drag`.
 * On capture donc le pointeur et on calcule la position à partir du point de départ
 * (coordonnées écran), ce qui évite toute dérive pendant le glissé.
 */
export function attachDragHandle(handle: HTMLElement, move: (x: number, y: number) => void): void {
  let start: { pointerX: number; pointerY: number; windowX: number; windowY: number } | null = null;

  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    start = {
      pointerX: e.screenX,
      pointerY: e.screenY,
      windowX: window.screenX,
      windowY: window.screenY,
    };
    handle.setPointerCapture(e.pointerId);
    handle.classList.add('dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (!start) return;
    move(start.windowX + e.screenX - start.pointerX, start.windowY + e.screenY - start.pointerY);
  });

  const end = (): void => {
    start = null;
    handle.classList.remove('dragging');
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}
