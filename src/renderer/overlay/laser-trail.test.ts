import { describe, expect, it } from 'vitest';
import { expiredCount, laserAlpha, LASER_LIFETIME_MS, LaserTrail } from './laser-trail';

const point = (time: number) => ({ x: time, y: 0, time });

describe('laserAlpha', () => {
  it('vaut 1 à la création et 0 en fin de vie', () => {
    expect(laserAlpha(0)).toBe(1);
    expect(laserAlpha(LASER_LIFETIME_MS)).toBe(0);
    expect(laserAlpha(LASER_LIFETIME_MS * 2)).toBe(0);
  });

  it('décroît de plus en plus vite (fondu accéléré)', () => {
    expect(laserAlpha(LASER_LIFETIME_MS / 2)).toBeCloseTo(0.25);
  });
});

describe('expiredCount', () => {
  it('compte les points expirés en tête de segment', () => {
    expect(expiredCount([point(0), point(100), point(900)], 1150)).toBe(2);
    expect(expiredCount([point(0)], 5000)).toBe(1);
    expect(expiredCount([point(500)], 600)).toBe(0);
  });
});

describe('LaserTrail', () => {
  it('continue d’ajouter des points au geste en cours après un nettoyage', () => {
    const trail = new LaserTrail();
    trail.start(point(0));
    trail.add(point(10));
    trail.prune(20);
    trail.add(point(30));
    expect(trail.pointCount).toBe(3);
  });

  it('garde le geste en cours même vidé (pointeur immobile plus d’une seconde)', () => {
    const trail = new LaserTrail();
    trail.start(point(0));
    trail.prune(5000);
    expect(trail.isAlive).toBe(false);
    trail.add(point(5001));
    expect(trail.pointCount).toBe(1);
  });

  it('disparaît entièrement une fois tous les points expirés', () => {
    const trail = new LaserTrail();
    trail.start(point(0));
    trail.add(point(100));
    trail.end();
    trail.start(point(200));
    trail.end();
    trail.prune(200 + LASER_LIFETIME_MS);
    expect(trail.isAlive).toBe(false);
    expect(trail.pointCount).toBe(0);
  });

  it('ne relie pas deux gestes séparés', () => {
    const trail = new LaserTrail();
    trail.start(point(0));
    trail.end();
    trail.add(point(10));
    expect(trail.pointCount).toBe(1);
  });
});
