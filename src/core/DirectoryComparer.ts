import { NEVER_CANCELLED, type CancellationToken } from './CancellationToken';
import { SILENT_PROGRESS_LISTENER, type ComparisonProgressListener } from './ComparisonProgressListener';
import { DirectoryComparisonRun, type DirectoryComparisonRequest } from './DirectoryComparisonRun';
import type { FileSystemReader } from './FileSystemReader';
import type { DirectoryComparisonResult } from './models/DirectoryComparisonResult';

export class MissingDirectoryError extends Error {
  constructor(readonly directoryPath: string) {
    super(`Folder not found: ${directoryPath}`);
    this.name = 'MissingDirectoryError';
  }
}

export class DirectoryComparer {
  constructor(private readonly fileSystem: FileSystemReader) {}

  async compare(
    request: DirectoryComparisonRequest,
    progressListener: ComparisonProgressListener = SILENT_PROGRESS_LISTENER,
    cancellation: CancellationToken = NEVER_CANCELLED,
  ): Promise<DirectoryComparisonResult> {
    await this.assertDirectoryExists(request.leftRoot);
    await this.assertDirectoryExists(request.rightRoot);
    return new DirectoryComparisonRun(this.fileSystem, request, progressListener, cancellation).execute();
  }

  private async assertDirectoryExists(directoryPath: string): Promise<void> {
    if (!(await this.fileSystem.directoryExists(directoryPath))) {
      throw new MissingDirectoryError(directoryPath);
    }
  }
}
