export type ContentComparisonMode = 'size-only' | 'size-and-time' | 'content';

export interface ComparisonOptions {
  readonly recursive: boolean;
  readonly contentComparisonMode: ContentComparisonMode;
  readonly includeHiddenEntries: boolean;
  readonly excludedNamePatterns: readonly string[];
  readonly includedNamePatterns: readonly string[];
}

export const DEFAULT_EXCLUDED_NAME_PATTERNS: readonly string[] = [
  '.git',
  '.DS_Store',
  'node_modules',
  '.idea',
  '.vscode',
];

export const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  recursive: true,
  contentComparisonMode: 'content',
  includeHiddenEntries: false,
  excludedNamePatterns: DEFAULT_EXCLUDED_NAME_PATTERNS,
  includedNamePatterns: [],
};
