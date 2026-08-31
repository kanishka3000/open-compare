import type { DiffCell, DiffRow } from '../models/FileDiffResult';

/**
 * Lines excluded from the diff (blank lines under "ignore blank lines") still need to appear in the
 * viewer so line numbers line up with the file on disk. They are re-inserted as non-difference rows.
 */
export class IgnoredLineReinserter {
  reinsert(rows: readonly DiffRow[], leftLines: readonly string[], rightLines: readonly string[]): DiffRow[] {
    const result: DiffRow[] = [];
    let nextLeftIndex = 0;
    let nextRightIndex = 0;

    for (const row of rows) {
      const leftTarget = row.left ? row.left.lineNumber - 1 : nextLeftIndex;
      const rightTarget = row.right ? row.right.lineNumber - 1 : nextRightIndex;
      result.push(
        ...this.fillerRows(leftLines, nextLeftIndex, leftTarget, rightLines, nextRightIndex, rightTarget),
      );
      nextLeftIndex = row.left ? leftTarget + 1 : nextLeftIndex;
      nextRightIndex = row.right ? rightTarget + 1 : nextRightIndex;
      result.push(row);
    }

    result.push(
      ...this.fillerRows(
        leftLines,
        nextLeftIndex,
        leftLines.length,
        rightLines,
        nextRightIndex,
        rightLines.length,
      ),
    );
    return result;
  }

  private fillerRows(
    leftLines: readonly string[],
    leftFrom: number,
    leftTo: number,
    rightLines: readonly string[],
    rightFrom: number,
    rightTo: number,
  ): DiffRow[] {
    const leftCount = Math.max(0, leftTo - leftFrom);
    const rightCount = Math.max(0, rightTo - rightFrom);
    const rows: DiffRow[] = [];

    for (let offset = 0; offset < Math.max(leftCount, rightCount); offset += 1) {
      rows.push({
        kind: 'equal',
        left: offset < leftCount ? this.plainCell(leftLines, leftFrom + offset) : null,
        right: offset < rightCount ? this.plainCell(rightLines, rightFrom + offset) : null,
      });
    }
    return rows;
  }

  private plainCell(lines: readonly string[], index: number): DiffCell {
    const text = lines[index]!;
    return { lineNumber: index + 1, text, segments: text.length === 0 ? [] : [{ text, changed: false }] };
  }
}
