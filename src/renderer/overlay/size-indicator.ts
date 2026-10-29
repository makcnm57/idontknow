/**
 * Indicateur de taille : cercle affiché brièvement sous le curseur quand la taille change
 * (molette), pour voir l'épaisseur du trait avant de dessiner.
 */
const VISIBLE_MS = 700;

export class SizeIndicator {
  private readonly element: HTMLDivElement;
  private x = window.innerWidth / 2;
  private y = window.innerHeight / 2;
  private hideTimer: number | undefined;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'size-indicator';
    document.body.append(this.element);
    // Suit le curseur (survol compris) pour afficher le cercle au bon endroit.
    window.addEventListener('pointermove', (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
    });
  }

  /** Affiche un cercle de `diameter` pixels CSS, dans la couleur courante. */
  show(diameter: number, color: string): void {
    const style = this.element.style;
    style.width = style.height = `${diameter}px`;
    style.left = `${this.x - diameter / 2}px`;
    style.top = `${this.y - diameter / 2}px`;
    style.setProperty('--indicator-color', color);
    this.element.classList.add('visible');
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => this.element.classList.remove('visible'), VISIBLE_MS);
  }
}
