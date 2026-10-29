import { afterEach, describe, expect, it, vi } from 'vitest';
import { withTimeout } from './async-utils';

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renvoie le résultat d’une promesse terminée à temps', async () => {
    await expect(withTimeout(Promise.resolve(42), 100, 'test')).resolves.toBe(42);
  });

  it('transmet l’erreur d’une promesse rejetée', async () => {
    await expect(withTimeout(Promise.reject(new Error('EPERM')), 100, 'test')).rejects.toThrow(
      'EPERM',
    );
  });

  it('rejette une promesse qui ne se termine jamais (écriture bloquée)', async () => {
    vi.useFakeTimers();
    const blocked = withTimeout(new Promise(() => {}), 3000, 'Écriture');
    vi.advanceTimersByTime(3000);
    await expect(blocked).rejects.toThrow('Écriture : pas de réponse après 3000 ms');
  });
});
