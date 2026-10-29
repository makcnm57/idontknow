import type { ScreenDrawApi } from '@shared/api';

declare global {
  interface Window {
    /** API exposée par le preload (voir src/preload/index.ts). */
    screendraw: ScreenDrawApi;
  }
}

export {};
