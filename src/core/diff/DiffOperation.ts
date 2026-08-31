export type DiffOperationType = 'equal' | 'delete' | 'insert';

export interface DiffOperation {
  readonly type: DiffOperationType;
  readonly leftStart: number;
  readonly leftCount: number;
  readonly rightStart: number;
  readonly rightCount: number;
}

export class DiffOperationList {
  private readonly operations: DiffOperation[] = [];

  append(type: DiffOperationType, leftStart: number, leftCount: number, rightStart: number, rightCount: number): void {
    if (leftCount === 0 && rightCount === 0) {
      return;
    }
    const previous = this.operations[this.operations.length - 1];
    if (previous && previous.type === type) {
      this.operations[this.operations.length - 1] = {
        type,
        leftStart: previous.leftStart,
        leftCount: previous.leftCount + leftCount,
        rightStart: previous.rightStart,
        rightCount: previous.rightCount + rightCount,
      };
      return;
    }
    this.operations.push({ type, leftStart, leftCount, rightStart, rightCount });
  }

  toArray(): DiffOperation[] {
    return this.operations;
  }
}
