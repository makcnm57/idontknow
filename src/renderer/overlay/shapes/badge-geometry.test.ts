import { describe, expect, it } from 'vitest';
import type { Shape } from '@shared/types';
import { badgeRadius, badgeTextColor, nextBadgeNumber } from './badge-geometry';

const badge = (number: number): Shape => ({
  id: `b${number}`,
  kind: 'badge',
  x: 0,
  y: 0,
  number,
  radius: 18,
  color: '#ff3b30',
});

describe('nextBadgeNumber', () => {
  it('commence à 1 sur un écran sans pastille', () => {
    expect(nextBadgeNumber([])).toBe(1);
  });

  it('prend le plus grand numéro + 1, même si des pastilles manquent', () => {
    expect(nextBadgeNumber([badge(1), badge(4), badge(2)])).toBe(5);
  });

  it('ignore les autres éléments', () => {
    const rect: Shape = {
      id: 'r',
      kind: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: false,
      color: '#000000',
      size: 2,
    };
    expect(nextBadgeNumber([rect, badge(1)])).toBe(2);
  });
});

describe('badgeTextColor', () => {
  it('met un chiffre sombre sur les couleurs claires', () => {
    expect(badgeTextColor('#ffcc00')).toBe('#1c1c1e');
    expect(badgeTextColor('#ffffff')).toBe('#1c1c1e');
    expect(badgeTextColor('#34c759')).toBe('#1c1c1e');
    expect(badgeTextColor('#ff9500')).toBe('#1c1c1e');
  });

  it('met un chiffre blanc sur les couleurs foncées', () => {
    expect(badgeTextColor('#007aff')).toBe('#ffffff');
    expect(badgeTextColor('#1c1c1e')).toBe('#ffffff');
    expect(badgeTextColor('#af52de')).toBe('#ffffff');
    expect(badgeTextColor('#ff3b30')).toBe('#ffffff');
  });
});

describe('badgeRadius', () => {
  it('grandit avec l’épaisseur', () => {
    expect(badgeRadius(2)).toBeLessThan(badgeRadius(8));
  });
});
