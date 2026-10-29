/**
 * Loupe : grossit, dans un cercle qui suit le curseur, une capture figée de l'écran
 * prise à l'activation (annotations comprises).
 *
 * Une capture en direct filmerait la loupe elle-même ; exclure l'overlay des captures
 * le masquerait aussi dans Discord / Teams / OBS. D'où ce choix (voir CLAUDE.md, V3).
 * Désactiver puis réactiver la loupe rafraîchit la capture.
 */

/** Rayon de la loupe (pixels CSS). */
const LENS_RADIUS = 110;

export class Magnifier {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private snapshot: ImageBitmap | null = null;
  private enabled = false;
  private zoom = 2;
  private x = 0;
  private y = 0;
  /** Vrai quand le curseur est sur cet écran. */
  private inside = false;
  /** Numéro de la dernière demande de capture (ignore les réponses périmées). */
  private request = 0;
  private frame: number | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'magnifier';
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible');
    this.ctx = ctx;
    document.body.append(this.canvas);

    window.addEventListener('pointermove', (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
      this.inside = true;
      this.schedule();
    });
    document.documentElement.addEventListener('pointerleave', () => {
      this.inside = false;
      this.schedule();
    });
  }

  /** Active la loupe (capture de l'écran) ou la désactive (libère la capture). */
  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    const request = ++this.request;
    this.snapshot?.close();
    this.snapshot = null;
    this.schedule();
    if (!enabled) return;

    const png = await window.screendraw.captureScreen();
    // Désactivée entre-temps, ou demande plus récente en cours : on abandonne.
    if (!png || request !== this.request || !this.enabled) return;
    this.snapshot = await createImageBitmap(new Blob([png as BlobPart], { type: 'image/png' }));
    this.schedule();
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
    this.schedule();
  }

  /** Un seul redessin par image, jamais directement dans `pointermove`. */
  private schedule(): void {
    this.frame ??= requestAnimationFrame(() => {
      this.frame = null;
      this.render();
    });
  }

  private render(): void {
    const visible = this.enabled && this.snapshot !== null && this.inside;
    this.canvas.classList.toggle('visible', visible);
    if (!visible || !this.snapshot) return;

    const dpr = window.devicePixelRatio || 1;
    const size = Math.round(LENS_RADIUS * 2 * dpr);
    if (this.canvas.width !== size) {
      this.canvas.width = this.canvas.height = size;
      this.canvas.style.width = this.canvas.style.height = `${LENS_RADIUS * 2}px`;
    }
    this.canvas.style.left = `${this.x - LENS_RADIUS}px`;
    this.canvas.style.top = `${this.y - LENS_RADIUS}px`;

    // Zone source : un carré de côté (diamètre / zoom) centré sur le curseur,
    // converti en pixels de la capture (pixels physiques).
    const scale = this.snapshot.width / window.innerWidth;
    const half = LENS_RADIUS / this.zoom;
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      this.snapshot,
      (this.x - half) * scale,
      (this.y - half) * scale,
      half * 2 * scale,
      half * 2 * scale,
      0,
      0,
      size,
      size,
    );
    // Petit réticule au centre : le point visé reste repérable.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = dpr;
    const c = size / 2;
    const arm = 6 * dpr;
    ctx.beginPath();
    ctx.moveTo(c - arm, c);
    ctx.lineTo(c + arm, c);
    ctx.moveTo(c, c - arm);
    ctx.lineTo(c, c + arm);
    ctx.stroke();
    ctx.restore();
  }
}
