import { describe, expect, it } from 'vitest';
import { comboOf } from './keyboard';

const key = (k: string, mods: { ctrl?: boolean; shift?: boolean; meta?: boolean } = {}) => ({
  key: k,
  ctrlKey: mods.ctrl ?? false,
  shiftKey: mods.shift ?? false,
  metaKey: mods.meta ?? false,
});

describe('comboOf', () => {
  it('normalise la casse et les modificateurs', () => {
    expect(comboOf(key('z', { ctrl: true }))).toBe('ctrl+z');
    expect(comboOf(key('Z', { ctrl: true, shift: true }))).toBe('ctrl+shift+z');
    expect(comboOf(key('Delete'))).toBe('delete');
  });

  it('traite Cmd (macOS) comme Ctrl', () => {
    expect(comboOf(key('y', { meta: true }))).toBe('ctrl+y');
  });
});
