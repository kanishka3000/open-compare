import type { FileSystemReader } from './FileSystemReader';
import type { ContentComparisonMode } from './models/ComparisonOptions';
import type { FileMetadata } from './models/FileMetadata';

const MODIFICATION_TIME_TOLERANCE_MS = 2000;

export class FileContentComparer {
  constructor(
    private readonly fileSystem: FileSystemReader,
    private readonly mode: ContentComparisonMode,
  ) {}

  async areIdentical(
    leftPath: string,
    leftMetadata: FileMetadata,
    rightPath: string,
    rightMetadata: FileMetadata,
  ): Promise<boolean> {
    if (leftMetadata.sizeBytes !== rightMetadata.sizeBytes) {
      return false;
    }
    switch (this.mode) {
      case 'size-only':
        return true;
      case 'size-and-time':
        return this.haveMatchingTimestamps(leftMetadata, rightMetadata);
      case 'content':
        return this.haveMatchingContent(leftPath, rightPath);
    }
  }

  private haveMatchingTimestamps(left: FileMetadata, right: FileMetadata): boolean {
    return Math.abs(left.modifiedAtMs - right.modifiedAtMs) <= MODIFICATION_TIME_TOLERANCE_MS;
  }

  private async haveMatchingContent(leftPath: string, rightPath: string): Promise<boolean> {
    const [leftHash, rightHash] = await Promise.all([
      this.fileSystem.hashFile(leftPath),
      this.fileSystem.hashFile(rightPath),
    ]);
    return leftHash === rightHash;
  }
}
