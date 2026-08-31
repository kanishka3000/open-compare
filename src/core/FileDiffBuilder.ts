import type { FileSystemReader } from './FileSystemReader';
import { TextFileProbe } from './TextFileProbe';
import { DiffBlockIndexer } from './diff/DiffBlockIndexer';
import { DiffStatisticsCalculator } from './diff/DiffStatisticsCalculator';
import { IgnoredLineReinserter } from './diff/IgnoredLineReinserter';
import { InlineDiffer } from './diff/InlineDiffer';
import { LineNormalizer } from './diff/LineNormalizer';
import { LineSequence } from './diff/LineSequence';
import { MyersDiff } from './diff/MyersDiff';
import { SideBySideAligner } from './diff/SideBySideAligner';
import { TextDocumentParser, type TextDocument } from './diff/TextDocumentParser';
import type { DiffOptions } from './models/DiffOptions';
import type { FileMetadata } from './models/FileMetadata';
import {
  EMPTY_DIFF_STATISTICS,
  type FileDiffResult,
  type FileSideSummary,
  type DiffRow,
} from './models/FileDiffResult';

export interface FileDiffRequest {
  readonly leftPath: string | null;
  readonly rightPath: string | null;
  readonly options: DiffOptions;
}

interface FileSide {
  readonly path: string | null;
  readonly metadata: FileMetadata | null;
}

const EMPTY_DOCUMENT: TextDocument = { lines: [], lineEnding: 'none' };

export class FileDiffBuilder {
  private readonly documentParser = new TextDocumentParser();
  private readonly textProbe: TextFileProbe;
  private readonly myersDiff = new MyersDiff();
  private readonly aligner = new SideBySideAligner(new InlineDiffer());
  private readonly reinserter = new IgnoredLineReinserter();
  private readonly blockIndexer = new DiffBlockIndexer();
  private readonly statisticsCalculator = new DiffStatisticsCalculator();

  constructor(private readonly fileSystem: FileSystemReader) {
    this.textProbe = new TextFileProbe(fileSystem);
  }

  async build(request: FileDiffRequest): Promise<FileDiffResult> {
    const left = await this.resolveSide(request.leftPath);
    const right = await this.resolveSide(request.rightPath);

    if (!left.metadata && !right.metadata) {
      return this.nonTextResult('unreadable', left, right, 'Neither file could be read.');
    }

    const oversizedMessage = this.oversizedMessage(left, right);
    if (oversizedMessage) {
      return this.nonTextResult('unreadable', left, right, oversizedMessage);
    }

    if (await this.eitherSideIsBinary(left, right)) {
      return this.nonTextResult('binary', left, right, this.binaryMessage(left, right));
    }

    return this.buildTextResult(left, right, request.options);
  }

  private async buildTextResult(
    left: FileSide,
    right: FileSide,
    options: DiffOptions,
  ): Promise<FileDiffResult> {
    const leftDocument = await this.readDocument(left);
    const rightDocument = await this.readDocument(right);
    const rows = this.buildRows(leftDocument, rightDocument, options);

    return {
      kind: 'text',
      left: this.summarise(left, leftDocument),
      right: this.summarise(right, rightDocument),
      rows,
      blocks: this.blockIndexer.index(rows),
      statistics: this.statisticsCalculator.calculate(rows),
      truncated: false,
      message: null,
    };
  }

  private buildRows(
    leftDocument: TextDocument,
    rightDocument: TextDocument,
    options: DiffOptions,
  ): DiffRow[] {
    const normalizer = new LineNormalizer(options);
    const leftSequence = new LineSequence(leftDocument.lines, normalizer);
    const rightSequence = new LineSequence(rightDocument.lines, normalizer);

    const computation = this.myersDiff.compute(leftSequence.comparisonKeys, rightSequence.comparisonKeys);
    const rows = this.aligner.align(computation.operations, leftSequence, rightSequence);

    if (!this.hasIgnoredLines(leftSequence, leftDocument) && !this.hasIgnoredLines(rightSequence, rightDocument)) {
      return rows;
    }
    return this.reinserter.reinsert(rows, leftDocument.lines, rightDocument.lines);
  }

  private hasIgnoredLines(sequence: LineSequence, document: TextDocument): boolean {
    return sequence.length !== document.lines.length;
  }

  private async resolveSide(path: string | null): Promise<FileSide> {
    if (path === null) {
      return { path: null, metadata: null };
    }
    return { path, metadata: await this.fileSystem.statFile(path) };
  }

  private async readDocument(side: FileSide): Promise<TextDocument> {
    if (!side.path || !side.metadata) {
      return EMPTY_DOCUMENT;
    }
    return this.documentParser.parse(await this.fileSystem.readFileText(side.path));
  }

  private async eitherSideIsBinary(left: FileSide, right: FileSide): Promise<boolean> {
    return (await this.sideIsBinary(left)) || (await this.sideIsBinary(right));
  }

  private async sideIsBinary(side: FileSide): Promise<boolean> {
    if (!side.path || !side.metadata) {
      return false;
    }
    return this.textProbe.isBinary(side.path);
  }

  private oversizedMessage(left: FileSide, right: FileSide): string | null {
    const largest = Math.max(left.metadata?.sizeBytes ?? 0, right.metadata?.sizeBytes ?? 0);
    if (this.textProbe.isWithinSizeLimit(largest)) {
      return null;
    }
    const limitInMegabytes = Math.round(this.textProbe.maxTextBytes / (1024 * 1024));
    return `File is larger than the ${limitInMegabytes} MB text comparison limit.`;
  }

  private binaryMessage(left: FileSide, right: FileSide): string {
    if (!left.metadata || !right.metadata) {
      return 'Binary file — content is not shown.';
    }
    return left.metadata.sizeBytes === right.metadata.sizeBytes
      ? 'Binary files of equal size — compare by content to confirm they match.'
      : `Binary files differ in size (${left.metadata.sizeBytes} vs ${right.metadata.sizeBytes} bytes).`;
  }

  private nonTextResult(
    kind: 'binary' | 'unreadable',
    left: FileSide,
    right: FileSide,
    message: string,
  ): FileDiffResult {
    return {
      kind,
      left: this.summarise(left, EMPTY_DOCUMENT),
      right: this.summarise(right, EMPTY_DOCUMENT),
      rows: [],
      blocks: [],
      statistics: EMPTY_DIFF_STATISTICS,
      truncated: kind === 'unreadable',
      message,
    };
  }

  private summarise(side: FileSide, document: TextDocument): FileSideSummary {
    return {
      path: side.path ?? '',
      exists: side.metadata !== null,
      sizeBytes: side.metadata?.sizeBytes ?? 0,
      lineCount: document.lines.length,
      lineEnding: document.lineEnding,
    };
  }
}
