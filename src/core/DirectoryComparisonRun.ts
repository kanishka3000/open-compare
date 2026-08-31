import type { CancellationToken } from './CancellationToken';
import { ComparisonCancelledError } from './CancellationToken';
import type { ComparisonProgressListener } from './ComparisonProgressListener';
import { ComparisonSummaryAccumulator } from './ComparisonSummaryAccumulator';
import { FileContentComparer } from './FileContentComparer';
import type { FileSystemReader } from './FileSystemReader';
import { LineChangeCounter, type TextFileLocation } from './LineChangeCounter';
import { PathFilter } from './PathFilter';
import { TextFileProbe } from './TextFileProbe';
import {
  NO_LINE_CHANGES,
  type ComparisonNode,
  type DirectoryComparisonNode,
  type FileComparisonNode,
  type LineChangeCount,
} from './models/ComparisonNode';
import type { ComparisonOptions } from './models/ComparisonOptions';
import type { ComparisonStatus } from './models/ComparisonStatus';
import type { DirectoryComparisonResult } from './models/DirectoryComparisonResult';
import { EMPTY_DIRECTORY_LISTING, type DirectoryListing, type FileMetadata } from './models/FileMetadata';

const FILE_COMPARISON_CONCURRENCY = 8;
const PROGRESS_REPORT_INTERVAL = 150;

export interface DirectoryComparisonRequest {
  readonly leftRoot: string;
  readonly rightRoot: string;
  readonly options: ComparisonOptions;
}

interface DirectorySides {
  readonly existsLeft: boolean;
  readonly existsRight: boolean;
}

/**
 * A single traversal of both directory trees. State that only makes sense for one run — the filter,
 * running totals and unreadable paths — lives here rather than on the reusable comparer.
 */
export class DirectoryComparisonRun {
  private readonly filter: PathFilter;
  private readonly contentComparer: FileContentComparer;
  private readonly lineChangeCounter: LineChangeCounter;
  private readonly summary = new ComparisonSummaryAccumulator();
  private readonly unreadablePaths: string[] = [];
  private scannedEntries = 0;
  private entriesSinceLastReport = 0;

  constructor(
    private readonly fileSystem: FileSystemReader,
    private readonly request: DirectoryComparisonRequest,
    private readonly progressListener: ComparisonProgressListener,
    private readonly cancellation: CancellationToken,
  ) {
    this.filter = new PathFilter(request.options);
    this.contentComparer = new FileContentComparer(fileSystem, request.options.contentComparisonMode);
    this.lineChangeCounter = new LineChangeCounter(fileSystem, new TextFileProbe(fileSystem));
  }

  async execute(): Promise<DirectoryComparisonResult> {
    const children = await this.compareDirectoryContents('', { existsLeft: true, existsRight: true });
    return {
      leftRoot: this.request.leftRoot,
      rightRoot: this.request.rightRoot,
      options: this.request.options,
      children,
      summary: this.summary.toSummary(),
      unreadablePaths: this.unreadablePaths,
    };
  }

  private async compareDirectoryContents(
    relativePath: string,
    sides: DirectorySides,
  ): Promise<ComparisonNode[]> {
    this.throwIfCancelled();
    const [leftListing, rightListing] = await Promise.all([
      this.listSide(this.request.leftRoot, relativePath, sides.existsLeft),
      this.listSide(this.request.rightRoot, relativePath, sides.existsRight),
    ]);

    const directories = await this.compareSubdirectories(relativePath, leftListing, rightListing);
    const files = await this.compareFiles(relativePath, leftListing, rightListing);
    return [...directories, ...files];
  }

  private async compareSubdirectories(
    relativePath: string,
    leftListing: DirectoryListing,
    rightListing: DirectoryListing,
  ): Promise<DirectoryComparisonNode[]> {
    const names = this.mergeNames(
      leftListing.directories.map((entry) => entry.name),
      rightListing.directories.map((entry) => entry.name),
      (name) => this.filter.allowsDirectory(name),
    );

    const nodes: DirectoryComparisonNode[] = [];
    for (const name of names) {
      nodes.push(await this.compareSubdirectory(relativePath, name, leftListing, rightListing));
    }
    return nodes;
  }

  private async compareSubdirectory(
    relativePath: string,
    name: string,
    leftListing: DirectoryListing,
    rightListing: DirectoryListing,
  ): Promise<DirectoryComparisonNode> {
    const sides: DirectorySides = {
      existsLeft: leftListing.directories.some((entry) => entry.name === name),
      existsRight: rightListing.directories.some((entry) => entry.name === name),
    };
    const childRelativePath = this.appendSegment(relativePath, name);
    this.summary.countDirectory();

    const children = this.request.options.recursive
      ? await this.compareDirectoryContents(childRelativePath, sides)
      : [];

    return {
      kind: 'directory',
      relativePath: childRelativePath,
      name,
      status: this.resolveDirectoryStatus(sides, children),
      existsLeft: sides.existsLeft,
      existsRight: sides.existsRight,
      children,
    };
  }

  private resolveDirectoryStatus(sides: DirectorySides, children: readonly ComparisonNode[]): ComparisonStatus {
    if (!sides.existsRight) {
      return 'left-only';
    }
    if (!sides.existsLeft) {
      return 'right-only';
    }
    return children.every((child) => child.status === 'identical') ? 'identical' : 'different';
  }

  private async compareFiles(
    relativePath: string,
    leftListing: DirectoryListing,
    rightListing: DirectoryListing,
  ): Promise<FileComparisonNode[]> {
    const leftByName = this.indexByName(leftListing.files);
    const rightByName = this.indexByName(rightListing.files);
    const names = this.mergeNames([...leftByName.keys()], [...rightByName.keys()], (name) =>
      this.filter.allowsFile(name),
    );

    const nodes: FileComparisonNode[] = [];
    for (let start = 0; start < names.length; start += FILE_COMPARISON_CONCURRENCY) {
      this.throwIfCancelled();
      const batch = names.slice(start, start + FILE_COMPARISON_CONCURRENCY);
      const compared = await Promise.all(
        batch.map((name) =>
          this.compareFile(relativePath, name, leftByName.get(name) ?? null, rightByName.get(name) ?? null),
        ),
      );
      nodes.push(...compared);
    }
    return nodes;
  }

  private async compareFile(
    relativePath: string,
    name: string,
    left: FileMetadata | null,
    right: FileMetadata | null,
  ): Promise<FileComparisonNode> {
    const childRelativePath = this.appendSegment(relativePath, name);
    const status = await this.resolveFileStatus(childRelativePath, left, right);
    const lineChanges = await this.resolveLineChanges(status, childRelativePath, left, right);

    this.summary.countFile(status);
    this.reportProgress(childRelativePath);

    return { kind: 'file', relativePath: childRelativePath, name, status, left, right, lineChanges };
  }

  private async resolveLineChanges(
    status: ComparisonStatus,
    relativePath: string,
    left: FileMetadata | null,
    right: FileMetadata | null,
  ): Promise<LineChangeCount | null> {
    if (status === 'identical') {
      return NO_LINE_CHANGES;
    }
    return this.lineChangeCounter.count(
      this.toTextFileLocation(this.request.leftRoot, relativePath, left),
      this.toTextFileLocation(this.request.rightRoot, relativePath, right),
    );
  }

  private toTextFileLocation(
    root: string,
    relativePath: string,
    metadata: FileMetadata | null,
  ): TextFileLocation | null {
    if (metadata === null) {
      return null;
    }
    return { path: this.fileSystem.joinPath(root, relativePath), sizeBytes: metadata.sizeBytes };
  }

  private async resolveFileStatus(
    relativePath: string,
    left: FileMetadata | null,
    right: FileMetadata | null,
  ): Promise<ComparisonStatus> {
    if (!right) {
      return 'left-only';
    }
    if (!left) {
      return 'right-only';
    }
    const leftPath = this.fileSystem.joinPath(this.request.leftRoot, relativePath);
    const rightPath = this.fileSystem.joinPath(this.request.rightRoot, relativePath);
    try {
      const identical = await this.contentComparer.areIdentical(leftPath, left, rightPath, right);
      return identical ? 'identical' : 'different';
    } catch {
      this.unreadablePaths.push(leftPath);
      return 'different';
    }
  }

  private async listSide(root: string, relativePath: string, exists: boolean): Promise<DirectoryListing> {
    if (!exists) {
      return EMPTY_DIRECTORY_LISTING;
    }
    const absolutePath = relativePath === '' ? root : this.fileSystem.joinPath(root, relativePath);
    try {
      return await this.fileSystem.listDirectory(absolutePath);
    } catch {
      this.unreadablePaths.push(absolutePath);
      return EMPTY_DIRECTORY_LISTING;
    }
  }

  private indexByName(files: readonly FileMetadata[]): Map<string, FileMetadata> {
    return new Map(files.map((file) => [file.name, file]));
  }

  private mergeNames(
    leftNames: readonly string[],
    rightNames: readonly string[],
    isAllowed: (name: string) => boolean,
  ): string[] {
    const unique = new Set([...leftNames, ...rightNames].filter(isAllowed));
    return [...unique].sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' }));
  }

  private appendSegment(relativePath: string, name: string): string {
    return relativePath === '' ? name : `${relativePath}/${name}`;
  }

  private reportProgress(currentRelativePath: string): void {
    this.scannedEntries += 1;
    this.entriesSinceLastReport += 1;
    if (this.entriesSinceLastReport < PROGRESS_REPORT_INTERVAL) {
      return;
    }
    this.entriesSinceLastReport = 0;
    this.progressListener.onProgress({ scannedEntries: this.scannedEntries, currentRelativePath });
  }

  private throwIfCancelled(): void {
    if (this.cancellation.isCancellationRequested) {
      throw new ComparisonCancelledError();
    }
  }
}
