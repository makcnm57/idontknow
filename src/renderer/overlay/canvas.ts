/**
 * Gestion des deux calques canvas et du redessin.
 *
 * - Calque « figé » : les formes validées. Redessiné uniquement quand la liste change.
 * - Calque « actif » : la forme en cours de tracé. Redessiné à chaque mouvement.
 *
 * Les redessins sont regroupés dans `requestAnimationFrame` (au plus un par image),
 * jamais exécutés directement dans un gestionnaire `pointermove`.
 */
import type { Shape } from '@shared/types';
import { drawShape } from './shapes';

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');
  return ctx;
}

export class LayeredCanvas {
  private readonly committedCtx: CanvasRenderingContext2D;
  private readonly activeCtx: CanvasRenderingContext2D;
  private committedDirty = true;
  private activeDirty = true;
  private frame: number | null = null;

  constructor(
    private readonly committed: HTMLCanvasElement,
    private readonly active: HTMLCanvasElement,
    private readonly getShapes: () => readonly Shape[],
    private readonly getPreview: () => Shape | null,
  ) {
    this.committedCtx = get2dContext(committed);
    this.activeCtx = get2dContext(active);
    this.resize();
  }

  /**
   * Adapte la résolution interne à la taille de la fenêtre et au facteur d'échelle
   * (HiDPI) : le canvas fait `largeur × devicePixelRatio` pixels réels, et `setTransform`
   * permet de continuer à dessiner en pixels CSS.
   */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);
    for (const [canvas, ctx] of [
      [this.committed, this.committedCtx],
      [this.active, this.activeCtx],
    ] as const) {
      // Redimensionner un canvas efface son contenu : tout sera redessiné.
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.committedDirty = true;
    this.activeDirty = true;
    this.schedule();
  }

  /** À appeler quand la liste des formes validées change. */
  invalidateCommitted(): void {
    this.committedDirty = true;
    this.schedule();
  }

  /** À appeler quand la forme en cours change. */
  invalidateActive(): void {
    this.activeDirty = true;
    this.schedule();
  }

  private schedule(): void {
    this.frame ??= requestAnimationFrame(() => this.render());
  }

  private render(): void {
    this.frame = null;
    if (this.committedDirty) {
      this.committedDirty = false;
      this.clear(this.committedCtx);
      for (const shape of this.getShapes()) drawShape(this.committedCtx, shape, true);
    }
    if (this.activeDirty) {
      this.activeDirty = false;
      this.clear(this.activeCtx);
      const preview = this.getPreview();
      if (preview) drawShape(this.activeCtx, preview, false);
    }
  }

  private clear(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
}

/**
 * Surveille les changements de `devicePixelRatio` (fenêtre déplacée vers un écran
 * à une autre échelle, ou échelle Windows modifiée) sans attendre un `resize`.
 */
export function watchPixelRatio(onChange: () => void): void {
  const query = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  query.addEventListener(
    'change',
    () => {
      onChange();
      watchPixelRatio(onChange);
    },
    { once: true },
  );
}
