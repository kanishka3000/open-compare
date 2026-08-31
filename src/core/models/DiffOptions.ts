export type WhitespaceSensitivity = 'exact' | 'ignore-trailing' | 'ignore-all';

export interface DiffOptions {
  readonly whitespaceSensitivity: WhitespaceSensitivity;
  readonly ignoreCase: boolean;
  readonly ignoreBlankLines: boolean;
  readonly tabWidth: number;
}

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  whitespaceSensitivity: 'exact',
  ignoreCase: false,
  ignoreBlankLines: false,
  tabWidth: 4,
};
