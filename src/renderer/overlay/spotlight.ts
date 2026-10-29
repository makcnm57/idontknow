/**
 * Projecteur : voile sombre sur l'écran, sauf un cercle autour du curseur.
 *
 * C'est un calque CSS (dégradé radial) plutôt qu'un dessin canvas : le GPU le recompose
 * à chaque mouvement sans redessiner les annotations. En mode passif, Windows transmet
 * les mouvements de souris à l'overlay (`setIgnoreMouseEvents(…, { forward: true })`) :
 * le cercle suit donc le curseur même quand les clics traversent.
 */
export class Spotlight {
  private readonly element: HTMLDivElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'spotlight';
    document.body.append(this.element);
    // Curseur sur un autre écran au départ : voile complet jusqu'au premier mouvement.
    this.hideHole();

    window.addEventListener('pointermove', (e) => this.moveTo(e.clientX, e.clientY));
    // Curseur parti sur un autre écran : celui-ci reste entièrement voilé.
    document.documentElement.addEventListener('pointerleave', () => this.hideHole());
  }

  setEnabled(enabled: boolean): void {
    this.element.classList.toggle('visible', enabled);
  }

  setRadius(radius: number): void {
    this.element.style.setProperty('--spot-r', `${radius}px`);
  }

  private moveTo(x: number, y: number): void {
    this.element.style.setProperty('--spot-x', `${x}px`);
    this.element.style.setProperty('--spot-y', `${y}px`);
  }

  /** Place le cercle hors de l'écran. */
  private hideHole(): void {
    this.moveTo(-10000, -10000);
  }
}
