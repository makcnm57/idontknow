import { describe, expect, it } from 'vitest';
import {
  acceleratorFromKey,
  DEFAULT_SHORTCUTS,
  duplicateActions,
  formatAccelerator,
  isValidAccelerator,
} from './shortcuts';

const press = (
  key: string,
  code: string,
  mods: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {},
) => ({
  key,
  code,
  ctrlKey: mods.ctrl ?? false,
  altKey: mods.alt ?? false,
  shiftKey: mods.shift ?? false,
  metaKey: mods.meta ?? false,
});

describe('isValidAccelerator', () => {
  it('accepte les raccourcis par défaut', () => {
    for (const accelerator of Object.values(DEFAULT_SHORTCUTS)) {
      expect(isValidAccelerator(accelerator)).toBe(true);
    }
  });

  it('exige Ctrl, Alt ou Windows, sauf pour les touches de fonction', () => {
    expect(isValidAccelerator('Shift+D')).toBe(false);
    expect(isValidAccelerator('D')).toBe(false);
    expect(isValidAccelerator('F9')).toBe(true);
    expect(isValidAccelerator('Shift+F9')).toBe(true);
    expect(isValidAccelerator('Alt+Space')).toBe(true);
  });

  it('rejette les formes invalides', () => {
    expect(isValidAccelerator('CommandOrControl+')).toBe(false);
    expect(isValidAccelerator('Shift+Shift+D')).toBe(false);
    expect(isValidAccelerator('Hyper+D')).toBe(false);
    expect(isValidAccelerator('CommandOrControl+Shift+Ä')).toBe(false);
    expect(isValidAccelerator(42)).toBe(false);
  });
});

describe('acceleratorFromKey', () => {
  it('construit l’accélérateur dans l’ordre canonique', () => {
    expect(acceleratorFromKey(press('d', 'KeyD', { ctrl: true, shift: true }))).toBe(
      'CommandOrControl+Shift+D',
    );
  });

  it('prend la lettre tapée en AZERTY (A sur la touche physique Q)', () => {
    expect(acceleratorFromKey(press('a', 'KeyQ', { ctrl: true, alt: true }))).toBe(
      'CommandOrControl+Alt+A',
    );
  });

  it('prend le chiffre de la touche physique (AZERTY sans Maj)', () => {
    expect(acceleratorFromKey(press('&', 'Digit1', { ctrl: true }))).toBe('CommandOrControl+1');
  });

  it('refuse un modificateur seul ou une combinaison trop faible', () => {
    expect(acceleratorFromKey(press('Control', 'ControlLeft', { ctrl: true }))).toBeNull();
    expect(acceleratorFromKey(press('d', 'KeyD', { shift: true }))).toBeNull();
    expect(acceleratorFromKey(press('d', 'KeyD'))).toBeNull();
  });

  it('gère les touches nommées', () => {
    expect(acceleratorFromKey(press('ArrowUp', 'ArrowUp', { alt: true }))).toBe('Alt+Up');
    expect(acceleratorFromKey(press('F8', 'F8'))).toBe('F8');
  });
});

describe('formatAccelerator', () => {
  it('affiche en français', () => {
    expect(formatAccelerator('CommandOrControl+Shift+D')).toBe('Ctrl + Maj + D');
    expect(formatAccelerator('Super+Alt+Up')).toBe('Win + Alt + ↑');
  });
});

describe('duplicateActions', () => {
  it('signale les actions qui partagent un raccourci', () => {
    expect(duplicateActions(DEFAULT_SHORTCUTS)).toEqual([]);
    expect(
      duplicateActions({ ...DEFAULT_SHORTCUTS, screenshot: DEFAULT_SHORTCUTS.toggleVisible }),
    ).toEqual(['toggleVisible', 'screenshot']);
  });
});
