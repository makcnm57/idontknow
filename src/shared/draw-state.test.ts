import { describe, expect, it } from 'vitest';
import {
  applyStatePatch,
  DEFAULT_DRAW_STATE,
  MAX_SIZE,
  MIN_SIZE,
  sanitizeStatePatch,
  stepSize,
} from './draw-state';

describe('sanitizeStatePatch', () => {
  it('garde les champs valides', () => {
    expect(
      sanitizeStatePatch({ tool: 'rect', color: '#00FF00', size: 12, mode: 'draw', fill: true }),
    ).toEqual({ tool: 'rect', color: '#00ff00', size: 12, mode: 'draw', fill: true });
  });

  it('ignore les valeurs inconnues ou mal typées', () => {
    expect(
      sanitizeStatePatch({
        tool: 'rm -rf',
        color: 'red',
        size: '12',
        mode: 'fly',
        fill: 'yes',
        extra: 1,
      }),
    ).toEqual({});
  });

  it('borne et arrondit la taille', () => {
    expect(sanitizeStatePatch({ size: 999 }).size).toBe(MAX_SIZE);
    expect(sanitizeStatePatch({ size: -3 }).size).toBe(MIN_SIZE);
    expect(sanitizeStatePatch({ size: 4.6 }).size).toBe(5);
    expect(sanitizeStatePatch({ size: Number.NaN })).toEqual({});
  });

  it('renvoie un objet vide pour une entrée non objet', () => {
    expect(sanitizeStatePatch(null)).toEqual({});
    expect(sanitizeStatePatch('pen')).toEqual({});
  });
});

describe('applyStatePatch', () => {
  it('renvoie un nouvel état si un champ change', () => {
    const next = applyStatePatch(DEFAULT_DRAW_STATE, { mode: 'draw' });
    expect(next).not.toBe(DEFAULT_DRAW_STATE);
    expect(next.mode).toBe('draw');
  });

  it('renvoie le même objet si rien ne change', () => {
    expect(applyStatePatch(DEFAULT_DRAW_STATE, { tool: DEFAULT_DRAW_STATE.tool })).toBe(
      DEFAULT_DRAW_STATE,
    );
  });
});

describe('stepSize', () => {
  it('augmente et diminue par crans', () => {
    expect(stepSize(4, 1)).toBe(5);
    expect(stepSize(4, -1)).toBe(3);
  });

  it('agrandit le pas pour les grandes tailles', () => {
    expect(stepSize(40, 1)).toBe(46);
  });

  it('reste dans les bornes', () => {
    expect(stepSize(MIN_SIZE, -1)).toBe(MIN_SIZE);
    expect(stepSize(MAX_SIZE, 1)).toBe(MAX_SIZE);
  });
});

describe('tableau blanc / noir', () => {
  it('accepte uniquement les valeurs connues', () => {
    expect(sanitizeStatePatch({ board: 'black' })).toEqual({ board: 'black' });
    expect(sanitizeStatePatch({ board: 'vert' })).toEqual({});
  });

  it('ouvrir un tableau passe en mode dessin', () => {
    const next = applyStatePatch(DEFAULT_DRAW_STATE, { board: 'white' });
    expect(next).toMatchObject({ board: 'white', mode: 'draw' });
  });

  it('repasser en mode passif ferme le tableau', () => {
    const drawing = applyStatePatch(DEFAULT_DRAW_STATE, { board: 'black' });
    expect(applyStatePatch(drawing, { mode: 'passive' })).toMatchObject({
      board: 'none',
      mode: 'passive',
    });
  });

  it('fermer le tableau garde le mode dessin', () => {
    const drawing = applyStatePatch(DEFAULT_DRAW_STATE, { board: 'white' });
    expect(applyStatePatch(drawing, { board: 'none' })).toMatchObject({
      board: 'none',
      mode: 'draw',
    });
  });

  it('passer du blanc au noir reste en mode dessin', () => {
    const white = applyStatePatch(DEFAULT_DRAW_STATE, { board: 'white' });
    expect(applyStatePatch(white, { board: 'black' })).toMatchObject({
      board: 'black',
      mode: 'draw',
    });
  });
});
