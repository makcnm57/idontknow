import { describe, expect, it } from 'vitest';
import type { StrokeShape } from '@shared/types';
import {
  distanceToSegment,
  hitEllipse,
  hitLine,
  hitRect,
  hitStroke,
  interpolate,
} from './hit-test';
import { arrowHead } from './shapes/shape-geometry';

function stroke(points: [number, number][], size = 4): StrokeShape {
  return {
    id: 's',
    kind: 'stroke',
    tool: 'pen',
    color: '#000000',
    size,
    simulatePressure: false,
    points: points.map(([x, y]) => ({ x, y, pressure: 0.5 })),
  };
}

describe('distanceToSegment', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };

  it('mesure la distance perpendiculaire au milieu du segment', () => {
    expect(distanceToSegment({ x: 5, y: 3 }, a, b)).toBeCloseTo(3);
  });

  it('mesure la distance à l’extrémité la plus proche hors du segment', () => {
    expect(distanceToSegment({ x: 13, y: 4 }, a, b)).toBeCloseTo(5);
  });

  it('gère un segment de longueur nulle', () => {
    expect(distanceToSegment({ x: 3, y: 4 }, a, a)).toBeCloseTo(5);
  });
});

describe('hitStroke', () => {
  const line = stroke([
    [0, 0],
    [100, 0],
  ]);

  it('touche un point proche du trait (rayon + demi-épaisseur)', () => {
    expect(hitStroke(line, { x: 50, y: 11 }, 10)).toBe(true);
    expect(hitStroke(line, { x: 50, y: 13 }, 10)).toBe(false);
  });

  it('rejette un point loin de la boîte englobante', () => {
    expect(hitStroke(line, { x: 500, y: 500 }, 10)).toBe(false);
  });

  it('gère un tracé réduit à un point (simple clic)', () => {
    const dot = stroke([[20, 20]]);
    expect(hitStroke(dot, { x: 25, y: 20 }, 4)).toBe(true);
    expect(hitStroke(dot, { x: 40, y: 20 }, 4)).toBe(false);
  });

  it('tient compte de l’épaisseur (surligneur large)', () => {
    const wide = stroke(
      [
        [0, 0],
        [100, 0],
      ],
      40,
    );
    expect(hitStroke(wide, { x: 50, y: 25 }, 6)).toBe(true);
  });
});

describe('interpolate', () => {
  it('découpe un grand déplacement en pas réguliers', () => {
    const points = interpolate({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);
    expect(points).toHaveLength(10);
    expect(points.at(-1)).toEqual({ x: 100, y: 0 });
  });

  it('renvoie au moins le point d’arrivée', () => {
    expect(interpolate({ x: 0, y: 0 }, { x: 0, y: 0 }, 10)).toEqual([{ x: 0, y: 0 }]);
  });
});

const base = { id: 's', color: '#000000', size: 4 };

describe('hitLine', () => {
  const arrow = {
    ...base,
    kind: 'line' as const,
    from: { x: 0, y: 0 },
    to: { x: 100, y: 0 },
    arrow: true,
  };

  it('touche le segment', () => {
    expect(hitLine(arrow, { x: 50, y: 8 }, 6)).toBe(true);
    expect(hitLine(arrow, { x: 50, y: 30 }, 6)).toBe(false);
  });

  it('touche une aile de la pointe de flèche, pas celle d’une simple ligne', () => {
    const [left] = arrowHead(arrow.from, arrow.to, arrow.size);
    expect(hitLine(arrow, left, 2)).toBe(true);
    expect(hitLine({ ...arrow, arrow: false }, { x: left.x, y: left.y - 5 }, 2)).toBe(false);
  });
});

describe('hitRect', () => {
  const rect = { ...base, kind: 'rect' as const, x: 0, y: 0, width: 100, height: 50, fill: false };

  it('ne touche que les bords d’un rectangle vide', () => {
    expect(hitRect(rect, { x: 50, y: 2 }, 4)).toBe(true);
    expect(hitRect(rect, { x: 50, y: 25 }, 4)).toBe(false);
  });

  it('touche l’intérieur d’un rectangle plein', () => {
    expect(hitRect({ ...rect, fill: true }, { x: 50, y: 25 }, 4)).toBe(true);
    expect(hitRect({ ...rect, fill: true }, { x: 150, y: 25 }, 4)).toBe(false);
  });
});

describe('hitEllipse', () => {
  const circle = {
    ...base,
    kind: 'ellipse' as const,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fill: false,
  };

  it('ne touche que le contour d’une ellipse vide', () => {
    expect(hitEllipse(circle, { x: 100, y: 50 }, 4)).toBe(true);
    expect(hitEllipse(circle, { x: 50, y: 50 }, 4)).toBe(false);
  });

  it('touche le centre d’une ellipse pleine', () => {
    expect(hitEllipse({ ...circle, fill: true }, { x: 50, y: 50 }, 4)).toBe(true);
  });

  it('gère une ellipse aplatie comme un segment', () => {
    const flat = { ...circle, height: 0 };
    expect(hitEllipse(flat, { x: 50, y: 3 }, 4)).toBe(true);
  });
});
