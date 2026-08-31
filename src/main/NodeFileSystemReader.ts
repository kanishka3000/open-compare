import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, open, readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { FileSystemReader } from '../core/FileSystemReader';
import type {
  DirectoryListing,
  DirectoryMetadata,
  FileMetadata,
} from '../core/models/FileMetadata';

const BYTE_ORDER_MARK = '﻿';
const HASH_ALGORITHM = 'sha1';

export class NodeFileSystemReader implements FileSystemReader {
  async directoryExists(directoryPath: string): Promise<boolean> {
    try {
      return (await stat(directoryPath)).isDirectory();
    } catch {
      return false;
    }
  }

  async listDirectory(directoryPath: string): Promise<DirectoryListing> {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const directories: DirectoryMetadata[] = [];
    const filePromises: Promise<FileMetadata | null>[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        directories.push({ name: entry.name });
        continue;
      }
      if (entry.isFile() || entry.isSymbolicLink()) {
        filePromises.push(this.readFileMetadata(join(directoryPath, entry.name), entry.name));
      }
    }

    const files = (await Promise.all(filePromises)).filter(
      (metadata): metadata is FileMetadata => metadata !== null,
    );
    return { directories, files };
  }

  async statFile(filePath: string): Promise<FileMetadata | null> {
    return this.readFileMetadata(filePath, this.baseNameOf(filePath));
  }

  async readFileText(filePath: string): Promise<string> {
    const content = await readFile(filePath, 'utf8');
    return content.startsWith(BYTE_ORDER_MARK) ? content.slice(1) : content;
  }

  async readFileHead(filePath: string, byteCount: number): Promise<Uint8Array> {
    const handle = await open(filePath, 'r');
    try {
      const buffer = new Uint8Array(byteCount);
      const { bytesRead } = await handle.read(buffer, 0, byteCount, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash(HASH_ALGORITHM);
      const stream = createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  joinPath(...segments: string[]): string {
    return join(...segments);
  }

  private async readFileMetadata(filePath: string, name: string): Promise<FileMetadata | null> {
    try {
      const stats = await lstat(filePath);
      return { name, sizeBytes: stats.size, modifiedAtMs: stats.mtimeMs };
    } catch {
      return null;
    }
  }

  private baseNameOf(filePath: string): string {
    return filePath.split('/').pop() ?? filePath;
  }
}
