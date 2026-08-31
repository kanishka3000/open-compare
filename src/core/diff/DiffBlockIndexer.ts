import type { DiffBlock, DiffRow } from '../models/FileDiffResult';

/**
 * Groups runs of adjacent difference rows so the viewer can jump between changes rather than lines.
 */
export class DiffBlockIndexer {
  index(rows: readonly DiffRow[]): DiffBlock[] {
    const blocks: DiffBlock[] = [];
    let blockStart: number | null = null;

    rows.forEach((row, rowIndex) => {
      if (row.kind === 'equal') {
        if (blockStart !== null) {
          blocks.push({ firstRowIndex: blockStart, lastRowIndex: rowIndex - 1 });
          blockStart = null;
        }
        return;
      }
      if (blockStart === null) {
        blockStart = rowIndex;
      }
    });

    if (blockStart !== null) {
      blocks.push({ firstRowIndex: blockStart, lastRowIndex: rows.length - 1 });
    }
    return blocks;
  }
}
