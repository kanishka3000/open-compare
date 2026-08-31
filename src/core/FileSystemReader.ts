import type { DirectoryListing, FileMetadata } from './models/FileMetadata';

export interface FileSystemReader {
  directoryExists(directoryPath: string): Promise<boolean>;
  listDirectory(directoryPath: string): Promise<DirectoryListing>;
  statFile(filePath: string): Promise<FileMetadata | null>;
  readFileText(filePath: string): Promise<string>;
  readFileHead(filePath: string, byteCount: number): Promise<Uint8Array>;
  hashFile(filePath: string): Promise<string>;
  joinPath(...segments: string[]): string;
}
