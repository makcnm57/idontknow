import { describe, expect, it } from 'vitest';
import { DEFAULT_DRAW_STATE } from '@shared/draw-state';
import { DEFAULT_SETTINGS, isOnSomeScreen, parseSettings, pickPersisted } from './settings-schema';

describe('pickPersisted', () => {
  it('ne garde que les préférences, pas les états du moment', () => {
    const picked = pickPersisted({ ...DEFAULT_DRAW_STATE, mode: 'draw', spotlight: true });
    expect(picked).not.toHaveProperty('mode');
    expect(picked).not.toHaveProperty('spotlight');
    expect(picked).not.toHaveProperty('board');
    expect(picked).toHaveProperty('color');
  });
});

describe('parseSettings', () => {
  it('relit des paramètres valides', () => {
    const saved = {
      version: 1,
      draw: { tool: 'highlighter', color: '#007aff', size: 8, fill: true },
      toolbar: { centerX: 1280, y: 40 },
    };
    const settings = parseSettings(saved);
    expect(settings.draw).toMatchObject({
      tool: 'highlighter',
      color: '#007aff',
      size: 8,
      fill: true,
    });
    expect(settings.toolbar).toEqual({ centerX: 1280, y: 40 });
  });

  it('remplace les champs invalides par les valeurs par défaut', () => {
    const settings = parseSettings({ draw: { tool: 'marteau', size: -50, color: 'rouge' } });
    expect(settings.draw.tool).toBe(DEFAULT_SETTINGS.draw.tool);
    expect(settings.draw.color).toBe(DEFAULT_SETTINGS.draw.color);
    expect(settings.draw.size).toBe(1); // borné, pas rejeté
  });

  it('ignore un état du moment glissé dans le fichier', () => {
    const settings = parseSettings({ draw: { mode: 'draw', board: 'black', spotlight: true } });
    expect(settings.draw).toEqual(DEFAULT_SETTINGS.draw);
  });

  it('résiste à un fichier corrompu ou vide', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{oups')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ toolbar: { centerX: 'loin' } }).toolbar).toBeNull();
  });
});

describe('isOnSomeScreen', () => {
  const screens = [
    { x: 0, y: 0, width: 2560, height: 1400 },
    { x: -1440, y: 0, width: 1440, height: 860 },
  ];

  it('reconnaît un point sur l’un des écrans', () => {
    expect(isOnSomeScreen({ x: 1280, y: 40 }, screens)).toBe(true);
    expect(isOnSomeScreen({ x: -700, y: 40 }, screens)).toBe(true);
  });

  it('détecte un point sur un écran débranché', () => {
    expect(isOnSomeScreen({ x: 3500, y: 40 }, screens)).toBe(false);
    expect(isOnSomeScreen({ x: -700, y: 1000 }, screens)).toBe(false);
  });
});
