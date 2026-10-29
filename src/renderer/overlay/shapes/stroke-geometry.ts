/**
 * Géométrie des tracés à main levée (logique pure, sans canvas).
 * perfect-freehand transforme les points saisis en contour de polygone à remplir.
 */
import { getStroke, type StrokeOptions } from 'perfect-freehand';
import type { StrokeShape } from '@shared/types';

/** Options perfect-freehand d'un tracé. `complete` : tracé terminé (fin du trait finalisée). */
export function strokeOptions(shape: StrokeShape, complete: boolean): StrokeOptions {
  const common = { size: shape.size, smoothing: 0.5, streamline: 0.5, last: complete };
  if (shape.tool === 'highlighter') {
    // Surligneur : largeur constante, la pression et la vitesse n'ont aucun effet.
    return { ...common, thinning: 0, simulatePressure: false };
  }
  return { ...common, thinning: 0.5, simulatePressure: shape.simulatePressure };
}

/** Contour du tracé : liste de sommets [x, y]. */
export function strokeOutline(shape: StrokeShape, complete: boolean): number[][] {
  return getStroke(shape.points, strokeOptions(shape, complete));
}

const fmt = (value: number): string => value.toFixed(2);

/**
 * Convertit un contour en chemin SVG fermé et lissé : des courbes quadratiques
 * passent par le milieu de chaque segment, en utilisant les sommets comme points de contrôle.
 */
export function outlineToSvgPath(outline: readonly (readonly number[])[]): string {
  const count = outline.length;
  if (count < 3) return '';

  const vertex = (i: number): [number, number] => {
    const [x = 0, y = 0] = outline[i % count] ?? [];
    return [x, y];
  };
  const midpoint = (i: number): string => {
    const [ax, ay] = vertex(i);
    const [bx, by] = vertex(i + 1);
    return `${fmt((ax + bx) / 2)},${fmt((ay + by) / 2)}`;
  };

  let path = `M${midpoint(0)}`;
  for (let i = 1; i <= count; i++) {
    const [x, y] = vertex(i);
    path += ` Q${fmt(x)},${fmt(y)} ${midpoint(i)}`;
  }
  return `${path} Z`;
}
