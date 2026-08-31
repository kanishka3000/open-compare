import type { OpenCompareApi } from '../shared/ipc';

declare global {
  interface Window {
    readonly openCompare: OpenCompareApi;
  }
}

export {};
