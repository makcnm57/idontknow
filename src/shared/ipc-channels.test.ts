import { describe, expect, it } from 'vitest';
import { IpcChannel } from './ipc-channels';

describe('IpcChannel', () => {
  const names = Object.values(IpcChannel);

  it('ne contient aucun doublon', () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it('respecte la convention domaine:action', () => {
    for (const name of names) {
      expect(name).toMatch(/^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*$/);
    }
  });
});
