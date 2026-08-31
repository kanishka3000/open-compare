import type { FileDiffBuilder } from '../core/FileDiffBuilder';
import type { FileDiffResult } from '../core/models/FileDiffResult';
import type { DiffFileRequest, OperationResult } from '../shared/ipc';
import type { FailureTranslator } from './FailureTranslator';

export class FileDiffService {
  constructor(
    private readonly diffBuilder: FileDiffBuilder,
    private readonly failureTranslator: FailureTranslator,
  ) {}

  async diff(request: DiffFileRequest): Promise<OperationResult<FileDiffResult>> {
    try {
      return { ok: true, value: await this.diffBuilder.build(request) };
    } catch (error) {
      return this.failureTranslator.translate(error);
    }
  }
}
