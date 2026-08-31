import { ComparisonCancelledError } from '../core/CancellationToken';
import { MissingDirectoryError } from '../core/DirectoryComparer';
import type { OperationResult } from '../shared/ipc';

export class FailureTranslator {
  translate(error: unknown): Extract<OperationResult<never>, { ok: false }> {
    if (error instanceof ComparisonCancelledError) {
      return { ok: false, reason: 'cancelled', message: error.message };
    }
    if (error instanceof MissingDirectoryError) {
      return { ok: false, reason: 'missing-folder', message: error.message };
    }
    return { ok: false, reason: 'failed', message: this.describe(error) };
  }

  private describe(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
