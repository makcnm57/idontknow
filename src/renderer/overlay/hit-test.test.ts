import { describe, expect, it } from 'vitest';
import type { StrokeShape } from '@shared/types';
import { distanceToSegment, hitStroke, interpolate } from './hit-test';

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
