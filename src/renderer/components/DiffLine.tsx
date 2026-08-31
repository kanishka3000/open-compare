import type { DiffCell, DiffRow } from '@core/models/FileDiffResult';
import { expandTabs } from '../model/expandTabs';

type DiffSide = 'left' | 'right';

interface DiffLineProps {
  readonly row: DiffRow;
  readonly side: DiffSide;
  readonly tabWidth: number;
  readonly isActiveBlock: boolean;
}

export function DiffLine({ row, side, tabWidth, isActiveBlock }: DiffLineProps): React.JSX.Element {
  const cell = side === 'left' ? row.left : row.right;

  return (
    <div className={buildClassName(row, cell, isActiveBlock)}>
      <span className="diff-line__number">{cell ? cell.lineNumber : ''}</span>
      <span className="diff-line__text">
        {cell?.segments.map((segment, index) => (
          <span
            key={index}
            className={segment.changed ? 'diff-segment diff-segment--changed' : 'diff-segment'}
          >
            {expandTabs(segment.text, tabWidth)}
          </span>
        ))}
      </span>
    </div>
  );
}

function buildClassName(row: DiffRow, cell: DiffCell | null, isActiveBlock: boolean): string {
  const classNames = ['diff-line', modifierFor(row, cell)];
  if (isActiveBlock) {
    classNames.push('diff-line--active');
  }
  return classNames.filter(Boolean).join(' ');
}

function modifierFor(row: DiffRow, cell: DiffCell | null): string {
  if (!cell) {
    return 'diff-line--absent';
  }
  switch (row.kind) {
    case 'equal':
      return '';
    case 'changed':
      return 'diff-line--changed';
    case 'added':
      return 'diff-line--added';
    case 'removed':
      return 'diff-line--removed';
  }
}
