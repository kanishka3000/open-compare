import type { ComparisonOptions } from '../core/models/ComparisonOptions';
import type { DiffOptions } from '../core/models/DiffOptions';
import type {
  ComparisonProgress,
  DirectoryComparisonResult,
} from '../core/models/DirectoryComparisonResult';
import type { FileDiffResult } from '../core/models/FileDiffResult';

export const IPC_CHANNEL = {
  selectFolder: 'mac-compare/select-folder',
  compareDirectories: 'mac-compare/compare-directories',
  cancelComparison: 'mac-compare/cancel-comparison',
  diffFile: 'mac-compare/diff-file',
  revealInFinder: 'mac-compare/reveal-in-finder',
  comparisonProgress: 'mac-compare/comparison-progress',
  menuCommand: 'mac-compare/menu-command',
} as const;

export type MenuCommand =
  | 'select-left-folder'
  | 'select-right-folder'
  | 'run-comparison'
  | 'next-difference'
  | 'previous-difference'
  | 'toggle-identical-files';

export interface CompareDirectoriesRequest {
  readonly leftRoot: string;
  readonly rightRoot: string;
  readonly options: ComparisonOptions;
}

export interface DiffFileRequest {
  readonly leftPath: string | null;
  readonly rightPath: string | null;
  readonly options: DiffOptions;
}

export type OperationResult<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly reason: OperationFailureReason; readonly message: string };

export type OperationFailureReason = 'cancelled' | 'missing-folder' | 'failed';

export interface MacCompareApi {
  selectFolder(dialogTitle: string): Promise<string | null>;
  compareDirectories(
    request: CompareDirectoriesRequest,
  ): Promise<OperationResult<DirectoryComparisonResult>>;
  cancelComparison(): Promise<void>;
  diffFile(request: DiffFileRequest): Promise<OperationResult<FileDiffResult>>;
  revealInFinder(absolutePath: string): Promise<void>;
  onComparisonProgress(listener: (progress: ComparisonProgress) => void): () => void;
  onMenuCommand(listener: (command: MenuCommand) => void): () => void;
}
