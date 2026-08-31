import { CancellationSource } from '../core/CancellationToken';
import type { ComparisonProgressListener } from '../core/ComparisonProgressListener';
import type { DirectoryComparer } from '../core/DirectoryComparer';
import type { DirectoryComparisonResult } from '../core/models/DirectoryComparisonResult';
import type { CompareDirectoriesRequest, OperationResult } from '../shared/ipc';
import type { FailureTranslator } from './FailureTranslator';

/**
 * Runs one directory comparison at a time. Starting a new comparison cancels the one in flight so a
 * long scan can never block the next request from the window.
 */
export class ComparisonService {
  private activeCancellation: CancellationSource | null = null;

  constructor(
    private readonly comparer: DirectoryComparer,
    private readonly failureTranslator: FailureTranslator,
  ) {}

  async compare(
    request: CompareDirectoriesRequest,
    progressListener: ComparisonProgressListener,
  ): Promise<OperationResult<DirectoryComparisonResult>> {
    const cancellation = this.beginRun();
    try {
      const value = await this.comparer.compare(request, progressListener, cancellation);
      return { ok: true, value };
    } catch (error) {
      return this.failureTranslator.translate(error);
    } finally {
      this.endRun(cancellation);
    }
  }

  cancel(): void {
    this.activeCancellation?.cancel();
  }

  private beginRun(): CancellationSource {
    this.cancel();
    const cancellation = new CancellationSource();
    this.activeCancellation = cancellation;
    return cancellation;
  }

  private endRun(cancellation: CancellationSource): void {
    if (this.activeCancellation === cancellation) {
      this.activeCancellation = null;
    }
  }
}
