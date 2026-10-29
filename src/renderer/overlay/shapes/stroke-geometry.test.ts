import { describe, expect, it } from 'vitest';
import type { StrokeShape } from '@shared/types';
import { outlineToSvgPath, strokeOutline } from './stroke-geometry';

function makeStroke(points: [number, number][], size = 8): StrokeShape {
  return {
    id: 'test',
    kind: 'stroke',
    tool: 'pen',
    color: '#ff0000',
    size,
    simulatePressure: false,
    points: points.map(([x, y]) => ({ x, y, pressure: 0.5 })),
  };
}

describe('strokeOutline', () => {
  it('produit un point visible pour un simple clic', () => {
    expect(strokeOutline(makeStroke([[100, 100]]), true).length).toBeGreaterThan(3);
  });

  it('reste dans une enveloppe proche du tracé', () => {
    const size = 8;
    const outline = strokeOutline(
      makeStroke(
        [
          [0, 0],
          [50, 0],
          [100, 0],
        ],
        size,
      ),
      true,
    );
    for (const [x = 0, y = 0] of outline) {
      expect(x).toBeGreaterThanOrEqual(-size);
      expect(x).toBeLessThanOrEqual(100 + size);
      expect(Math.abs(y)).toBeLessThanOrEqual(size);
    }
  });
});

describe('outlineToSvgPath', () => {
  it('renvoie une chaîne vide pour un contour dégénéré', () => {
    expect(outlineToSvgPath([])).toBe('');
    expect(
      outlineToSvgPath([
        [0, 0],
        [1, 1],
      ]),
    ).toBe('');
  });

  it('produit un chemin fermé qui revient à son point de départ', () => {
    const path = outlineToSvgPath([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
    expect(path.startsWith('M5.00,0.00')).toBe(true);
    expect(path.endsWith('5.00,0.00 Z')).toBe(true);
    expect(path.match(/Q/g)).toHaveLength(4);
  });
});
