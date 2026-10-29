/**
 * Sélection d'une zone à capturer : l'image figée de l'écran s'affiche sous un voile,
 * on trace un rectangle (dimensions affichées en pixels réels), Échap annule.
 */
import type { Box, Point } from '@shared/types';
import { boxFromDrag } from './shapes/shape-geometry';

/** En dessous de cette taille (pixels CSS), un glissé est considéré comme un clic. */
const MIN_DRAG = 4;

export class ZoneSelector {
  private root: HTMLDivElement | null = null;
  private imageUrl: string | null = null;
  private onDone: ((rect: Box | null) => void) | null = null;

  open(png: Uint8Array, onDone: (rect: Box | null) => void): void {
    this.finish(null);
    this.onDone = onDone;
    this.imageUrl = URL.createObjectURL(new Blob([png as BlobPart], { type: 'image/png' }));

    const root = document.createElement('div');
    root.className = 'zone-selector';
    root.style.backgroundImage = `url("${this.imageUrl}")`;
    const veil = document.createElement('div');
    veil.className = 'zone-veil';
    const frame = document.createElement('div');
    frame.className = 'zone-frame';
    const label = document.createElement('div');
    label.className = 'zone-label';
    root.append(veil, frame, label);
    document.body.append(root);
    this.root = root;

    let start: Point | null = null;
    let box: Box | null = null;
    root.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY };
      root.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', (e) => {
      if (!start) return;
      box = boxFromDrag(start, { x: e.clientX, y: e.clientY }, false);
      root.classList.add('selecting');
      Object.assign(frame.style, {
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      });
      const dpr = window.devicePixelRatio || 1;
      label.textContent = `${Math.round(box.width * dpr)} × ${Math.round(box.height * dpr)}`;
      label.style.left = `${box.x}px`;
      label.style.top = `${Math.max(0, box.y - 28)}px`;
    });
    root.addEventListener('pointerup', () => {
      if (box && box.width >= MIN_DRAG && box.height >= MIN_DRAG) {
        this.finish(box);
        return;
      }
      // Simple clic : on laisse recommencer.
      start = null;
      box = null;
      root.classList.remove('selecting');
    });

    window.addEventListener('keydown', this.onKeyDown, { capture: true });
  }

  /** Pendant la sélection, le clavier n'atteint pas les raccourcis de l'overlay ; Échap annule. */
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    e.stopImmediatePropagation();
    e.preventDefault();
    if (e.key === 'Escape') this.finish(null);
  };

  private finish(rect: Box | null): void {
    window.removeEventListener('keydown', this.onKeyDown, { capture: true });
    this.root?.remove();
    this.root = null;
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    this.imageUrl = null;
    const onDone = this.onDone;
    this.onDone = null;
    onDone?.(rect);
  }
}
