import type { DiffCell, DiffRow } from '../models/FileDiffResult';
import type { DiffOperation } from './DiffOperation';
import type { InlineDiffer } from './InlineDiffer';
import type { LineSequence } from './LineSequence';

/**
 * Turns a linear edit script into the paired rows a side-by-side viewer renders. Deletions that sit
 * directly opposite insertions are paired into "changed" rows so both versions stay on one line.
 */
export class SideBySideAligner {
  constructor(private readonly inlineDiffer: InlineDiffer) {}

  align(
    operations: readonly DiffOperation[],
    left: LineSequence,
    right: LineSequence,
  ): DiffRow[] {
    const rows: DiffRow[] = [];
    const pendingRemovals: number[] = [];
    const pendingAdditions: number[] = [];

    for (const operation of operations) {
      if (operation.type === 'equal') {
        this.flushPendingChanges(rows, pendingRemovals, pendingAdditions, left, right);
        this.appendEqualRows(rows, operation, left, right);
        continue;
      }
      if (operation.type === 'delete') {
        this.collectIndices(pendingRemovals, operation.leftStart, operation.leftCount);
        continue;
      }
      this.collectIndices(pendingAdditions, operation.rightStart, operation.rightCount);
    }

    this.flushPendingChanges(rows, pendingRemovals, pendingAdditions, left, right);
    return rows;
  }

  private appendEqualRows(
    rows: DiffRow[],
    operation: DiffOperation,
    left: LineSequence,
    right: LineSequence,
  ): void {
    for (let offset = 0; offset < operation.leftCount; offset += 1) {
      rows.push({
        kind: 'equal',
        left: this.unchangedCell(left, operation.leftStart + offset),
        right: this.unchangedCell(right, operation.rightStart + offset),
      });
    }
  }

  private flushPendingChanges(
    rows: DiffRow[],
    pendingRemovals: number[],
    pendingAdditions: number[],
    left: LineSequence,
    right: LineSequence,
  ): void {
    const pairedCount = Math.min(pendingRemovals.length, pendingAdditions.length);

    for (let index = 0; index < pairedCount; index += 1) {
      rows.push(this.buildChangedRow(left, pendingRemovals[index]!, right, pendingAdditions[index]!));
    }
    for (let index = pairedCount; index < pendingRemovals.length; index += 1) {
      rows.push({ kind: 'removed', left: this.changedCell(left, pendingRemovals[index]!), right: null });
    }
    for (let index = pairedCount; index < pendingAdditions.length; index += 1) {
      rows.push({ kind: 'added', left: null, right: this.changedCell(right, pendingAdditions[index]!) });
    }

    pendingRemovals.length = 0;
    pendingAdditions.length = 0;
  }

  private buildChangedRow(
    left: LineSequence,
    leftIndex: number,
    right: LineSequence,
    rightIndex: number,
  ): DiffRow {
    const leftText = left.textAt(leftIndex);
    const rightText = right.textAt(rightIndex);
    const inline = this.inlineDiffer.compare(leftText, rightText);
    return {
      kind: 'changed',
      left: { lineNumber: left.sourceLineIndexAt(leftIndex) + 1, text: leftText, segments: inline.left },
      right: { lineNumber: right.sourceLineIndexAt(rightIndex) + 1, text: rightText, segments: inline.right },
    };
  }

  private unchangedCell(sequence: LineSequence, sequenceIndex: number): DiffCell {
    const text = sequence.textAt(sequenceIndex);
    return {
      lineNumber: sequence.sourceLineIndexAt(sequenceIndex) + 1,
      text,
      segments: this.inlineDiffer.unchangedSegments(text),
    };
  }

  private changedCell(sequence: LineSequence, sequenceIndex: number): DiffCell {
    const text = sequence.textAt(sequenceIndex);
    return {
      lineNumber: sequence.sourceLineIndexAt(sequenceIndex) + 1,
      text,
      segments: text.length === 0 ? [] : [{ text, changed: true }],
    };
  }

  private collectIndices(target: number[], start: number, count: number): void {
    for (let offset = 0; offset < count; offset += 1) {
      target.push(start + offset);
    }
  }
}
