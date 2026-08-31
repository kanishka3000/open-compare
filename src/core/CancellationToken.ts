export interface CancellationToken {
  readonly isCancellationRequested: boolean;
}

export class ComparisonCancelledError extends Error {
  constructor() {
    super('Comparison was cancelled.');
    this.name = 'ComparisonCancelledError';
  }
}

export class CancellationSource implements CancellationToken {
  private cancelled = false;

  get isCancellationRequested(): boolean {
    return this.cancelled;
  }

  cancel(): void {
    this.cancelled = true;
  }

  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new ComparisonCancelledError();
    }
  }
}

export const NEVER_CANCELLED: CancellationToken = { isCancellationRequested: false };
