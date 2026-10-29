import { describe, expect, it } from 'vitest';
import { comboOf, resolveShortcut } from './keyboard';

interface Mods {
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  alt?: boolean;
}

const key = (k: string, code = '', mods: Mods = {}) => ({
  key: k,
  code,
  ctrlKey: mods.ctrl ?? false,
  shiftKey: mods.shift ?? false,
  metaKey: mods.meta ?? false,
  altKey: mods.alt ?? false,
});

describe('comboOf', () => {
  it('normalise la casse et les modificateurs', () => {
    expect(comboOf(key('z', 'KeyW', { ctrl: true }))).toBe('ctrl+z');
    expect(comboOf(key('Z', 'KeyW', { ctrl: true, shift: true }))).toBe('ctrl+shift+z');
    expect(comboOf(key('Delete'))).toBe('delete');
  });

  it('traite Cmd (macOS) comme Ctrl', () => {
    expect(comboOf(key('y', 'KeyY', { meta: true }))).toBe('ctrl+y');
  });
});

describe('resolveShortcut', () => {
  it('reconnaît Ctrl+Z sur la lettre Z en AZERTY (touche physique W)', () => {
    expect(resolveShortcut(key('z', 'KeyW', { ctrl: true }))).toEqual({ type: 'undo' });
  });

  it('sélectionne les outils par leur lettre', () => {
    expect(resolveShortcut(key('p', 'KeyP'))).toEqual({ type: 'tool', tool: 'pen' });
    expect(resolveShortcut(key('H', 'KeyH', { shift: true }))).toBeUndefined();
    expect(resolveShortcut(key('e', 'KeyE'))).toEqual({ type: 'tool', tool: 'eraser' });
    expect(resolveShortcut(key('a', 'KeyQ'))).toEqual({ type: 'tool', tool: 'arrow' });
    expect(resolveShortcut(key('o', 'KeyO'))).toEqual({ type: 'tool', tool: 'ellipse' });
  });

  it('choisit la couleur par la touche physique, même en AZERTY sans Maj', () => {
    expect(resolveShortcut(key('&', 'Digit1'))).toEqual({ type: 'color', index: 0 });
    expect(resolveShortcut(key('8', 'Numpad8'))).toEqual({ type: 'color', index: 7 });
    expect(resolveShortcut(key('ç', 'Digit9'))).toBeUndefined();
  });

  it('ignore les combinaisons avec AltGr (Ctrl+Alt)', () => {
    expect(resolveShortcut(key('z', 'KeyW', { ctrl: true, alt: true }))).toBeUndefined();
    expect(resolveShortcut(key('2', 'Digit2', { ctrl: true, alt: true }))).toBeUndefined();
  });
});

describe('tableaux', () => {
  it('W et B ouvrent les tableaux blanc et noir', () => {
    expect(resolveShortcut(key('w', 'KeyZ'))).toEqual({ type: 'board', board: 'white' });
    expect(resolveShortcut(key('b', 'KeyB'))).toEqual({ type: 'board', board: 'black' });
  });
});
