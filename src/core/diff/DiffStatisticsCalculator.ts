import type { DiffRow, DiffStatistics } from '../models/FileDiffResult';

export class DiffStatisticsCalculator {
  calculate(rows: readonly DiffRow[]): DiffStatistics {
    let equalLines = 0;
    let changedLines = 0;
    let addedLines = 0;
    let removedLines = 0;

    for (const row of rows) {
      switch (row.kind) {
        case 'equal':
          equalLines += 1;
          break;
        case 'changed':
          changedLines += 1;
          break;
        case 'added':
          addedLines += 1;
          break;
        case 'removed':
          removedLines += 1;
          break;
      }
    }

    return { equalLines, changedLines, addedLines, removedLines };
  }
}
