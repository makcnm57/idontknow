import { describe, expect, it } from 'vitest';
import { arrowHead, arrowHeadLength, boxFromDrag, constrainLine } from './shape-geometry';

describe('constrainLine', () => {
  const origin = { x: 0, y: 0 };

  it('aligne sur l’horizontale un trait presque horizontal', () => {
    const end = constrainLine(origin, { x: 100, y: 10 });
    expect(end.y).toBeCloseTo(0);
    expect(end.x).toBeCloseTo(Math.hypot(100, 10));
  });

  it('aligne sur la diagonale à 45°', () => {
    const end = constrainLine(origin, { x: 100, y: 90 });
    expect(end.x).toBeCloseTo(end.y);
  });

  it('aligne sur la verticale vers le haut', () => {
    const end = constrainLine(origin, { x: -5, y: -80 });
    expect(end.x).toBeCloseTo(0);
    expect(end.y).toBeLessThan(0);
  });
});

describe('boxFromDrag', () => {
  it('normalise un glissé vers le haut et la gauche', () => {
    expect(boxFromDrag({ x: 100, y: 100 }, { x: 40, y: 70 }, false)).toEqual({
      x: 40,
      y: 70,
      width: 60,
      height: 30,
    });
  });

  it('produit un carré avec Maj, dans le sens du glissé', () => {
    expect(boxFromDrag({ x: 100, y: 100 }, { x: 40, y: 130 }, true)).toEqual({
      x: 40,
      y: 100,
      width: 60,
      height: 60,
    });
  });

  it('gère un glissé nul', () => {
    expect(boxFromDrag({ x: 5, y: 5 }, { x: 5, y: 5 }, true)).toEqual({
      x: 5,
      y: 5,
      width: 0,
      height: 0,
    });
  });
});

describe('arrowHead', () => {
  it('place la pointe à l’extrémité et les ailes en arrière, symétriques', () => {
    const [left, tip, right] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 4);
    expect(tip).toEqual({ x: 100, y: 0 });
    expect(left.x).toBeLessThan(100);
    expect(right.x).toBeCloseTo(left.x);
    expect(left.y).toBeCloseTo(-right.y);
  });

  it('raccourcit la pointe sur un segment très court', () => {
    const [left] = arrowHead({ x: 0, y: 0 }, { x: 5, y: 0 }, 8);
    expect(Math.hypot(5 - left.x, left.y)).toBeCloseTo(5);
    expect(arrowHeadLength(8)).toBeGreaterThan(5);
  });
});
