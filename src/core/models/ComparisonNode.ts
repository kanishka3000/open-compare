import type { ComparisonStatus } from './ComparisonStatus';
import type { FileMetadata } from './FileMetadata';

interface ComparisonNodeBase {
  readonly relativePath: string;
  readonly name: string;
  readonly status: ComparisonStatus;
}

/**
 * How many lines an edit from left to right adds and removes, counted the way `git diff --numstat`
 * counts: a rewritten line is one removal and one addition.
 */
export interface LineChangeCount {
  readonly added: number;
  readonly removed: number;
}

export const NO_LINE_CHANGES: LineChangeCount = { added: 0, removed: 0 };

export interface FileComparisonNode extends ComparisonNodeBase {
  readonly kind: 'file';
  readonly left: FileMetadata | null;
  readonly right: FileMetadata | null;
  /** Null when the count is not meaningful: binary content, past the size ceiling, or unreadable. */
  readonly lineChanges: LineChangeCount | null;
}

export interface DirectoryComparisonNode extends ComparisonNodeBase {
  readonly kind: 'directory';
  readonly existsLeft: boolean;
  readonly existsRight: boolean;
  readonly children: readonly ComparisonNode[];
}

export type ComparisonNode = FileComparisonNode | DirectoryComparisonNode;

export interface ComparisonSummary {
  readonly identical: number;
  readonly different: number;
  readonly leftOnly: number;
  readonly rightOnly: number;
  readonly directories: number;
}

export const EMPTY_SUMMARY: ComparisonSummary = {
  identical: 0,
  different: 0,
  leftOnly: 0,
  rightOnly: 0,
  directories: 0,
};

export function countComparedFiles(summary: ComparisonSummary): number {
  return summary.identical + summary.different + summary.leftOnly + summary.rightOnly;
}
