import { describe, expect, it } from 'vitest';
import type { Shape } from '@shared/types';
import { pointsBounds, shapeBounds, translateShape } from './transform';

const style = { id: 'a', color: '#000000', size: 4 };

const shapes: Shape[] = [
  {
    ...style,
    kind: 'stroke',
    tool: 'pen',
    simulatePressure: false,
    points: [
      { x: 0, y: 0, pressure: 0.5 },
      { x: 10, y: 20, pressure: 0.7 },
    ],
  },
  { ...style, kind: 'line', from: { x: 0, y: 0 }, to: { x: 10, y: 20 }, arrow: true },
  { ...style, kind: 'rect', x: 0, y: 0, width: 10, height: 20, fill: false },
  { ...style, kind: 'ellipse', x: 0, y: 0, width: 10, height: 20, fill: true },
  {
    id: 'a',
    kind: 'text',
    text: 'Salut',
    x: 0,
    y: 0,
    width: 10,
    height: 20,
    fontSize: 16,
    color: '#000000',
  },
  { id: 'a', kind: 'badge', x: 5, y: 5, number: 3, radius: 18, color: '#000000' },
];

describe('translateShape', () => {
  it.each(shapes.map((s) => [s.kind, s] as const))(
    'déplace un élément %s sans changer son identifiant ni l’original',
    (_kind, shape) => {
      const before = shapeBounds(shape);
      const moved = translateShape(shape, 30, -5);
      const after = shapeBounds(moved);

      expect(moved.id).toBe(shape.id);
      expect(moved).not.toBe(shape);
      expect(after.x).toBeCloseTo(before.x + 30);
      expect(after.y).toBeCloseTo(before.y - 5);
      expect(after.width).toBeCloseTo(before.width);
      expect(shapeBounds(shape)).toEqual(before);
    },
  );

  it('conserve la pression des points d’un tracé', () => {
    const moved = translateShape(shapes[0] as Shape, 1, 1);
    expect(moved.kind === 'stroke' && moved.points[1]?.pressure).toBe(0.7);
  });
});

describe('shapeBounds', () => {
  it('inclut la demi-épaisseur d’un contour, pas celle d’une forme pleine', () => {
    expect(shapeBounds(shapes[2] as Shape)).toEqual({ x: -2, y: -2, width: 14, height: 24 });
    expect(shapeBounds(shapes[3] as Shape)).toEqual({ x: 0, y: 0, width: 10, height: 20 });
  });

  it('inclut la pointe d’une flèche', () => {
    const arrow = shapeBounds(shapes[1] as Shape);
    const line = shapeBounds({
      ...(shapes[1] as Shape & { arrow: boolean }),
      arrow: false,
    } as Shape);
    expect(arrow.width).toBeGreaterThanOrEqual(line.width);
  });
});

describe('pointsBounds', () => {
  it('englobe tous les points avec la marge demandée', () => {
    expect(
      pointsBounds(
        [
          { x: 5, y: 5 },
          { x: -5, y: 15 },
        ],
        1,
      ),
    ).toEqual({ x: -6, y: 4, width: 12, height: 12 });
  });
});
