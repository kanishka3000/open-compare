import { BinaryDetector } from './diff/BinaryDetector';
import type { FileSystemReader } from './FileSystemReader';

const BINARY_SAMPLE_BYTES = 8192;
const MAX_TEXT_BYTES = 12 * 1024 * 1024;

/**
 * Answers the two questions every text feature has to ask before reading a file: is it small enough
 * to hold in memory, and is it actually text. Shared so the diff viewer and the folder scan apply
 * exactly the same ceiling and the same binary test.
 */
export class TextFileProbe {
  private readonly binaryDetector = new BinaryDetector();

  constructor(private readonly fileSystem: FileSystemReader) {}

  get maxTextBytes(): number {
    return MAX_TEXT_BYTES;
  }

  isWithinSizeLimit(sizeBytes: number): boolean {
    return sizeBytes <= MAX_TEXT_BYTES;
  }

  async isBinary(filePath: string): Promise<boolean> {
    return this.binaryDetector.isBinary(await this.fileSystem.readFileHead(filePath, BINARY_SAMPLE_BYTES));
  }
}
