import type { ComparisonProgress } from './models/DirectoryComparisonResult';

export interface ComparisonProgressListener {
  onProgress(progress: ComparisonProgress): void;
}

export const SILENT_PROGRESS_LISTENER: ComparisonProgressListener = {
  onProgress(): void {},
};
