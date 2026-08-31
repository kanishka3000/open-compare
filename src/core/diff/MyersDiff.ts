import { DiffOperationList, type DiffOperation } from './DiffOperation';

const MAX_EDIT_DISTANCE = 2000;

export interface DiffComputation {
  readonly operations: readonly DiffOperation[];
  readonly approximate: boolean;
}

interface EditMove {
  readonly type: 'equal' | 'delete' | 'insert';
}

/**
 * Myers O(ND) difference algorithm. Common prefixes and suffixes are trimmed before the
 * search so that typical edits stay far below the edit-distance ceiling.
 */
export class MyersDiff {
  compute(left: readonly string[], right: readonly string[]): DiffComputation {
    const prefixLength = this.commonPrefixLength(left, right);
    const suffixLength = this.commonSuffixLength(left, right, prefixLength);
    const leftMiddle = left.slice(prefixLength, left.length - suffixLength);
    const rightMiddle = right.slice(prefixLength, right.length - suffixLength);

    const operations = new DiffOperationList();
    operations.append('equal', 0, prefixLength, 0, prefixLength);

    const middle = this.diffMiddle(leftMiddle, rightMiddle);
    this.appendMoves(operations, middle.moves, prefixLength);

    operations.append(
      'equal',
      left.length - suffixLength,
      suffixLength,
      right.length - suffixLength,
      suffixLength,
    );

    return { operations: operations.toArray(), approximate: middle.approximate };
  }

  private diffMiddle(
    left: readonly string[],
    right: readonly string[],
  ): { moves: EditMove[]; approximate: boolean } {
    if (left.length === 0 || right.length === 0) {
      return { moves: this.replaceAllMoves(left.length, right.length), approximate: false };
    }
    const trace = this.traceShortestEdit(left, right);
    if (trace === null) {
      return { moves: this.replaceAllMoves(left.length, right.length), approximate: true };
    }
    return { moves: this.backtrack(trace, left.length, right.length), approximate: false };
  }

  private replaceAllMoves(leftCount: number, rightCount: number): EditMove[] {
    const moves: EditMove[] = [];
    for (let index = 0; index < leftCount; index += 1) {
      moves.push({ type: 'delete' });
    }
    for (let index = 0; index < rightCount; index += 1) {
      moves.push({ type: 'insert' });
    }
    return moves;
  }

  private traceShortestEdit(left: readonly string[], right: readonly string[]): Int32Array[] | null {
    const leftLength = left.length;
    const rightLength = right.length;
    const maxDistance = Math.min(leftLength + rightLength, MAX_EDIT_DISTANCE);
    const offset = leftLength + rightLength;
    const furthestX = new Int32Array(2 * offset + 1);
    const trace: Int32Array[] = [];

    for (let distance = 0; distance <= maxDistance; distance += 1) {
      trace.push(furthestX.slice(offset - distance, offset + distance + 1));

      for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
        let x = this.stepFrom(furthestX, offset, diagonal, distance);
        let y = x - diagonal;
        while (x < leftLength && y < rightLength && left[x] === right[y]) {
          x += 1;
          y += 1;
        }
        furthestX[offset + diagonal] = x;
        if (x >= leftLength && y >= rightLength) {
          return trace;
        }
      }
    }
    return null;
  }

  private stepFrom(furthestX: Int32Array, offset: number, diagonal: number, distance: number): number {
    const movedDown =
      diagonal === -distance ||
      (diagonal !== distance && furthestX[offset + diagonal - 1]! < furthestX[offset + diagonal + 1]!);
    return movedDown ? furthestX[offset + diagonal + 1]! : furthestX[offset + diagonal - 1]! + 1;
  }

  private backtrack(trace: Int32Array[], leftLength: number, rightLength: number): EditMove[] {
    const reversedMoves: EditMove[] = [];
    let x = leftLength;
    let y = rightLength;

    for (let distance = trace.length - 1; distance >= 0; distance -= 1) {
      const { previousX, previousY } = this.previousPoint(trace[distance]!, x - y, distance);

      while (x > previousX && y > previousY) {
        reversedMoves.push({ type: 'equal' });
        x -= 1;
        y -= 1;
      }
      if (distance === 0) {
        break;
      }
      if (x === previousX) {
        reversedMoves.push({ type: 'insert' });
        y -= 1;
      } else {
        reversedMoves.push({ type: 'delete' });
        x -= 1;
      }
    }

    return reversedMoves.reverse();
  }

  private previousPoint(
    furthestX: Int32Array,
    diagonal: number,
    distance: number,
  ): { previousX: number; previousY: number } {
    if (distance === 0) {
      return { previousX: 0, previousY: 0 };
    }
    const previousDiagonal = this.previousDiagonal(furthestX, diagonal, distance);
    const previousX = furthestX[previousDiagonal + distance]!;
    return { previousX, previousY: previousX - previousDiagonal };
  }

  private previousDiagonal(furthestX: Int32Array, diagonal: number, distance: number): number {
    if (diagonal === -distance) {
      return diagonal + 1;
    }
    if (diagonal === distance) {
      return diagonal - 1;
    }
    const below = furthestX[diagonal - 1 + distance]!;
    const above = furthestX[diagonal + 1 + distance]!;
    return below < above ? diagonal + 1 : diagonal - 1;
  }

  private appendMoves(operations: DiffOperationList, moves: readonly EditMove[], startOffset: number): void {
    let leftIndex = startOffset;
    let rightIndex = startOffset;
    for (const move of moves) {
      if (move.type === 'equal') {
        operations.append('equal', leftIndex, 1, rightIndex, 1);
        leftIndex += 1;
        rightIndex += 1;
      } else if (move.type === 'delete') {
        operations.append('delete', leftIndex, 1, rightIndex, 0);
        leftIndex += 1;
      } else {
        operations.append('insert', leftIndex, 0, rightIndex, 1);
        rightIndex += 1;
      }
    }
  }

  private commonPrefixLength(left: readonly string[], right: readonly string[]): number {
    const limit = Math.min(left.length, right.length);
    let length = 0;
    while (length < limit && left[length] === right[length]) {
      length += 1;
    }
    return length;
  }

  private commonSuffixLength(left: readonly string[], right: readonly string[], prefixLength: number): number {
    const limit = Math.min(left.length, right.length) - prefixLength;
    let length = 0;
    while (length < limit && left[left.length - 1 - length] === right[right.length - 1 - length]) {
      length += 1;
    }
    return length;
  }
}
