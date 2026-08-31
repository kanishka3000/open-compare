import { MyersDiff } from './diff/MyersDiff';
import { TextDocumentParser } from './diff/TextDocumentParser';
import type { FileSystemReader } from './FileSystemReader';
import type { LineChangeCount } from './models/ComparisonNode';
import type { TextFileProbe } from './TextFileProbe';

export interface TextFileLocation {
  readonly path: string;
  readonly sizeBytes: number;
}

/**
 * Counts the lines an edit from left to right adds and removes. Lines are compared exactly — the
 * ignore-whitespace and ignore-case options belong to the file the user is looking at, not to a
 * folder-wide scan, so the tree always reports the raw change.
 */
export class LineChangeCounter {
  private readonly documentParser = new TextDocumentParser();
  private readonly myersDiff = new MyersDiff();

  constructor(
    private readonly fileSystem: FileSystemReader,
    private readonly textProbe: TextFileProbe,
  ) {}

  async count(
    left: TextFileLocation | null,
    right: TextFileLocation | null,
  ): Promise<LineChangeCount | null> {
    if (!this.isWithinSizeLimit(left) || !this.isWithinSizeLimit(right)) {
      return null;
    }
    try {
      if ((await this.isBinary(left)) || (await this.isBinary(right))) {
        return null;
      }
      return this.compareLines(await this.readLines(left), await this.readLines(right));
    } catch {
      return null;
    }
  }

  private compareLines(
    leftLines: readonly string[],
    rightLines: readonly string[],
  ): LineChangeCount {
    if (leftLines.length === 0 || rightLines.length === 0) {
      return { added: rightLines.length, removed: leftLines.length };
    }

    let added = 0;
    let removed = 0;
    for (const operation of this.myersDiff.compute(leftLines, rightLines).operations) {
      if (operation.type === 'insert') {
        added += operation.rightCount;
      } else if (operation.type === 'delete') {
        removed += operation.leftCount;
      }
    }
    return { added, removed };
  }

  private isWithinSizeLimit(location: TextFileLocation | null): boolean {
    return location === null || this.textProbe.isWithinSizeLimit(location.sizeBytes);
  }

  private async isBinary(location: TextFileLocation | null): Promise<boolean> {
    return location !== null && (await this.textProbe.isBinary(location.path));
  }

  private async readLines(location: TextFileLocation | null): Promise<readonly string[]> {
    if (location === null) {
      return [];
    }
    return this.documentParser.parse(await this.fileSystem.readFileText(location.path)).lines;
  }
}
