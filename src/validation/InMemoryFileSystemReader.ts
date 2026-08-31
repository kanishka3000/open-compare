import type { FileSystemReader } from '../core/FileSystemReader';
import type { DirectoryListing, FileMetadata } from '../core/models/FileMetadata';

export interface InMemoryFile {
  readonly content: string;
  readonly modifiedAtMs: number;
}

/**
 * A filesystem held entirely in memory, keyed by absolute path. It lets the comparison engine be
 * exercised end to end without touching the disk or the Electron runtime.
 */
export class InMemoryFileSystemReader implements FileSystemReader {
  private readonly encoder = new TextEncoder();

  constructor(private readonly files: ReadonlyMap<string, InMemoryFile>) {}

  async directoryExists(directoryPath: string): Promise<boolean> {
    const prefix = this.asPrefix(directoryPath);
    for (const path of this.files.keys()) {
      if (path.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  async listDirectory(directoryPath: string): Promise<DirectoryListing> {
    const prefix = this.asPrefix(directoryPath);
    const directoryNames = new Set<string>();
    const files: FileMetadata[] = [];

    for (const [path, file] of this.files) {
      if (!path.startsWith(prefix)) {
        continue;
      }
      const remainder = path.slice(prefix.length);
      const separatorIndex = remainder.indexOf('/');
      if (separatorIndex === -1) {
        files.push({ name: remainder, sizeBytes: this.sizeOf(file), modifiedAtMs: file.modifiedAtMs });
      } else {
        directoryNames.add(remainder.slice(0, separatorIndex));
      }
    }

    return { directories: [...directoryNames].map((name) => ({ name })), files };
  }

  async statFile(filePath: string): Promise<FileMetadata | null> {
    const file = this.files.get(filePath);
    if (!file) {
      return null;
    }
    return {
      name: filePath.split('/').pop() ?? filePath,
      sizeBytes: this.sizeOf(file),
      modifiedAtMs: file.modifiedAtMs,
    };
  }

  async readFileText(filePath: string): Promise<string> {
    const file = this.files.get(filePath);
    if (!file) {
      throw new Error(`No such file: ${filePath}`);
    }
    return file.content;
  }

  async readFileHead(filePath: string, byteCount: number): Promise<Uint8Array> {
    return this.encoder.encode(await this.readFileText(filePath)).subarray(0, byteCount);
  }

  async hashFile(filePath: string): Promise<string> {
    return `content:${await this.readFileText(filePath)}`;
  }

  joinPath(...segments: string[]): string {
    return segments.join('/').replace(/\/{2,}/gu, '/');
  }

  private sizeOf(file: InMemoryFile): number {
    return this.encoder.encode(file.content).length;
  }

  private asPrefix(directoryPath: string): string {
    return directoryPath.endsWith('/') ? directoryPath : `${directoryPath}/`;
  }
}
