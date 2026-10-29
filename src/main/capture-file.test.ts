import { describe, expect, it } from 'vitest';
import { captureFileName } from './capture-file';

describe('captureFileName', () => {
  it('horodate le fichier avec des zéros de remplissage', () => {
    expect(captureFileName(new Date(2026, 0, 5, 9, 3, 7))).toBe(
      'ScreenDraw_2026-01-05_09-03-07.png',
    );
  });

  it('ne contient aucun caractère interdit dans un nom de fichier Windows', () => {
    expect(captureFileName(new Date())).not.toMatch(/[<>:"/\\|?*]/);
  });
});
