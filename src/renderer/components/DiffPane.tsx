import type { DiffRow } from '@core/models/FileDiffResult';
import type { VirtualWindow } from '../model/VirtualWindowCalculator';
import { DiffLine } from './DiffLine';

interface DiffPaneProps {
  readonly side: 'left' | 'right';
  readonly rows: readonly DiffRow[];
  readonly virtualWindow: VirtualWindow;
  readonly tabWidth: number;
  readonly activeBlockRange: { first: number; last: number } | null;
  readonly containerRef: React.RefCallback<HTMLDivElement>;
  readonly onScroll: () => void;
}

export function DiffPane({
  side,
  rows,
  virtualWindow,
  tabWidth,
  activeBlockRange,
  containerRef,
  onScroll,
}: DiffPaneProps): React.JSX.Element {
  return (
    <div className={`diff-pane diff-pane--${side}`} ref={containerRef} onScroll={onScroll}>
      <div className="diff-pane__spacer" style={{ height: virtualWindow.totalHeight }}>
        <div style={{ transform: `translateY(${virtualWindow.offsetTop}px)` }}>
          {rows.slice(virtualWindow.firstIndex, virtualWindow.lastIndex).map((row, offset) => {
            const rowIndex = virtualWindow.firstIndex + offset;
            return (
              <DiffLine
                key={rowIndex}
                row={row}
                side={side}
                tabWidth={tabWidth}
                isActiveBlock={isWithin(activeBlockRange, rowIndex)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function isWithin(range: { first: number; last: number } | null, rowIndex: number): boolean {
  return range !== null && rowIndex >= range.first && rowIndex <= range.last;
}
