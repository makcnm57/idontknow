import { describe, expect, it } from 'vitest';
import { toImageRect } from './zone-geometry';

describe('toImageRect', () => {
  it('convertit les pixels CSS en pixels de l’image (écran à 150 %)', () => {
    expect(toImageRect({ x: 100, y: 50, width: 200, height: 100 }, 1.5, 2560, 1440)).toEqual({
      x: 150,
      y: 75,
      width: 300,
      height: 150,
    });
  });

  it('borne la zone aux limites de l’image', () => {
    expect(toImageRect({ x: -50, y: 1400, width: 300, height: 100 }, 1, 2560, 1440)).toEqual({
      x: 0,
      y: 1400,
      width: 250,
      height: 40,
    });
  });

  it('ignore une zone trop petite (simple clic)', () => {
    expect(toImageRect({ x: 10, y: 10, width: 2, height: 2 }, 1, 2560, 1440)).toBeNull();
  });

  it('rejette une donnée invalide venant du renderer', () => {
    expect(toImageRect(null, 1, 2560, 1440)).toBeNull();
    expect(toImageRect({ x: '1', y: 0, width: 10, height: 10 }, 1, 2560, 1440)).toBeNull();
    expect(toImageRect({ x: 0, y: 0, width: Infinity, height: 10 }, 1, 2560, 1440)).toBeNull();
    expect(toImageRect({ x: 0, y: 0, width: 10, height: 10 }, 0, 2560, 1440)).toBeNull();
  });
});
