export type DiffRowKind = 'equal' | 'changed' | 'added' | 'removed';

export type LineEndingStyle = 'lf' | 'crlf' | 'cr' | 'mixed' | 'none';

export interface InlineSegment {
  readonly text: string;
  readonly changed: boolean;
}

export interface DiffCell {
  readonly lineNumber: number;
  readonly text: string;
  readonly segments: readonly InlineSegment[];
}

export interface DiffRow {
  readonly kind: DiffRowKind;
  readonly left: DiffCell | null;
  readonly right: DiffCell | null;
}

export interface DiffBlock {
  readonly firstRowIndex: number;
  readonly lastRowIndex: number;
}

export interface DiffStatistics {
  readonly equalLines: number;
  readonly changedLines: number;
  readonly addedLines: number;
  readonly removedLines: number;
}

export interface FileSideSummary {
  readonly path: string;
  readonly exists: boolean;
  readonly sizeBytes: number;
  readonly lineCount: number;
  readonly lineEnding: LineEndingStyle;
}

export type FileDiffKind = 'text' | 'binary' | 'unreadable';

export interface FileDiffResult {
  readonly kind: FileDiffKind;
  readonly left: FileSideSummary;
  readonly right: FileSideSummary;
  readonly rows: readonly DiffRow[];
  readonly blocks: readonly DiffBlock[];
  readonly statistics: DiffStatistics;
  readonly truncated: boolean;
  readonly message: string | null;
}

export const EMPTY_DIFF_STATISTICS: DiffStatistics = {
  equalLines: 0,
  changedLines: 0,
  addedLines: 0,
  removedLines: 0,
};
