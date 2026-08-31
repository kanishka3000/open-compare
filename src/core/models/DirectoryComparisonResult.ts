import type { ComparisonNode, ComparisonSummary } from './ComparisonNode';
import type { ComparisonOptions } from './ComparisonOptions';

export interface DirectoryComparisonResult {
  readonly leftRoot: string;
  readonly rightRoot: string;
  readonly options: ComparisonOptions;
  readonly children: readonly ComparisonNode[];
  readonly summary: ComparisonSummary;
  readonly unreadablePaths: readonly string[];
}

export interface ComparisonProgress {
  readonly scannedEntries: number;
  readonly currentRelativePath: string;
}
