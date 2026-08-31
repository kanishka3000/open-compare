import type { MacCompareApi } from '../shared/ipc';

declare global {
  interface Window {
    readonly macCompare: MacCompareApi;
  }
}

export {};
