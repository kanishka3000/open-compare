import { useRef } from 'react';
import type { DiffBlock, DiffRow } from '@core/models/FileDiffResult';

interface DiffMinimapProps {
  readonly rows: readonly DiffRow[];
  readonly blocks: readonly DiffBlock[];
  readonly rowHeight: number;
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly onSeekToRow: (rowIndex: number) => void;
}

export function DiffMinimap({
  rows,
  blocks,
  rowHeight,
  scrollTop,
  viewportHeight,
  onSeekToRow,
}: DiffMinimapProps): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const totalRows = Math.max(rows.length, 1);
  const contentHeight = rows.length * rowHeight;

  const seekFromPointer = (event: React.MouseEvent<HTMLDivElement>): void => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const relativeY = event.clientY - track.getBoundingClientRect().top;
    const fraction = Math.min(1, Math.max(0, relativeY / track.clientHeight));
    onSeekToRow(Math.floor(fraction * totalRows));
  };

  return (
    <div className="diff-minimap" ref={trackRef} onMouseDown={seekFromPointer}>
      {blocks.map((block) => (
        <div
          key={block.firstRowIndex}
          className={`diff-minimap__block diff-minimap__block--${blockModifier(rows, block)}`}
          style={{
            top: `${(block.firstRowIndex / totalRows) * 100}%`,
            height: `${Math.max(0.4, ((block.lastRowIndex - block.firstRowIndex + 1) / totalRows) * 100)}%`,
          }}
        />
      ))}
      {contentHeight > 0 ? (
        <div
          className="diff-minimap__viewport"
          style={{
            top: `${(scrollTop / contentHeight) * 100}%`,
            height: `${Math.min(100, (viewportHeight / contentHeight) * 100)}%`,
          }}
        />
      ) : null}
    </div>
  );
}

function blockModifier(rows: readonly DiffRow[], block: DiffBlock): string {
  const kind = rows[block.firstRowIndex]?.kind ?? 'changed';
  return kind === 'equal' ? 'changed' : kind;
}
