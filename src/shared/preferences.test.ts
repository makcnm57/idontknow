import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, parsePreferences, sanitizePreferencesPatch } from './preferences';
import { DEFAULT_SHORTCUTS } from './shortcuts';

describe('sanitizePreferencesPatch', () => {
  it('garde les champs valides', () => {
    expect(
      sanitizePreferencesPatch({
        theme: 'dark',
        launchAtStartup: true,
        captureFolder: 'D:\\Captures',
        shortcuts: { screenshot: 'Alt+F9' },
      }),
    ).toEqual({
      theme: 'dark',
      launchAtStartup: true,
      captureFolder: 'D:\\Captures',
      shortcuts: { screenshot: 'Alt+F9' },
    });
  });

  it('accepte null pour revenir au dossier par défaut', () => {
    expect(sanitizePreferencesPatch({ captureFolder: null })).toEqual({ captureFolder: null });
  });

  it('rejette les valeurs invalides ou dangereuses', () => {
    expect(
      sanitizePreferencesPatch({
        theme: 'fluo',
        launchAtStartup: 'oui',
        captureFolder: '..\\..\\Windows',
        shortcuts: { screenshot: 'Shift+S', inconnu: 'Alt+X' },
      }),
    ).toEqual({});
    expect(sanitizePreferencesPatch({ captureFolder: 'C:\\a\u0000b' })).toEqual({});
  });
});

describe('parsePreferences', () => {
  it('complète avec les valeurs par défaut', () => {
    const prefs = parsePreferences({ shortcuts: { zoneCapture: 'Alt+Z' } });
    expect(prefs.shortcuts).toEqual({ ...DEFAULT_SHORTCUTS, zoneCapture: 'Alt+Z' });
    expect(prefs.theme).toBe('system');
  });

  it('résiste à une valeur absente ou corrompue', () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('nimporte quoi')).toEqual(DEFAULT_PREFERENCES);
  });
});
