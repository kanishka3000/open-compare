import { useEffect } from 'react';
import type { ComparisonNode } from '@core/models/ComparisonNode';
import type { ComparisonProgress } from '@core/models/DirectoryComparisonResult';
import { useVirtualWindow } from '../hooks/useVirtualWindow';
import type { FlatTreeRow } from '../model/FlatTreeBuilder';
import { formatCount } from '../model/formatters';
import { ProgressOverlay } from './ProgressOverlay';
import { TreeRow } from './TreeRow';

const TREE_ROW_HEIGHT_PX = 24;

interface DirectoryTreePanelProps {
  readonly rows: readonly FlatTreeRow[];
  readonly selectedPath: string | null;
  readonly isComparing: boolean;
  readonly progress: ComparisonProgress | null;
  readonly width: number;
  readonly onSelect: (node: ComparisonNode) => void;
  readonly onToggleExpanded: (relativePath: string) => void;
  readonly onSetExpanded: (relativePath: string, expanded: boolean) => void;
}

export function DirectoryTreePanel({
  rows,
  selectedPath,
  isComparing,
  progress,
  width,
  onSelect,
  onToggleExpanded,
  onSetExpanded,
}: DirectoryTreePanelProps): React.JSX.Element {
  const scroller = useVirtualWindow<HTMLDivElement>(rows.length, TREE_ROW_HEIGHT_PX);
  const selectedIndex = rows.findIndex((row) => row.node.relativePath === selectedPath);
  const { scrollToRow } = scroller;

  useEffect(() => {
    if (selectedIndex >= 0) {
      scrollToRow(selectedIndex);
    }
  }, [selectedIndex, scrollToRow]);

  const moveSelection = (delta: number): void => {
    const nextIndex = Math.min(rows.length - 1, Math.max(0, selectedIndex + delta));
    const nextRow = rows[nextIndex];
    if (nextRow) {
      onSelect(nextRow.node);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const current = selectedIndex >= 0 ? rows[selectedIndex] : undefined;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveSelection(selectedIndex < 0 ? 0 : 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveSelection(-1);
        break;
      case 'ArrowRight':
        if (current?.isExpandable && !current.isExpanded) {
          event.preventDefault();
          onSetExpanded(current.node.relativePath, true);
        }
        break;
      case 'ArrowLeft':
        if (current?.isExpandable && current.isExpanded) {
          event.preventDefault();
          onSetExpanded(current.node.relativePath, false);
        }
        break;
      default:
        break;
    }
  };

  const visibleRows = rows.slice(scroller.window.firstIndex, scroller.window.lastIndex);

  return (
    <aside className="tree-panel" style={{ flex: `0 0 ${width}px`, width }}>
      <div className="tree-panel__header">
        <span>Comparison</span>
        <span>{formatCount(rows.length, 'row', 'rows')}</span>
      </div>
      {isComparing ? <ProgressOverlay progress={progress} /> : null}
      <div
        className="tree-panel__scroll"
        ref={scroller.containerRef}
        onScroll={scroller.onScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="tree-panel__spacer" style={{ height: scroller.window.totalHeight }}>
          <div style={{ transform: `translateY(${scroller.window.offsetTop}px)` }}>
            {visibleRows.map((row) => (
              <TreeRow
                key={row.node.relativePath}
                row={row}
                isSelected={row.node.relativePath === selectedPath}
                onSelect={onSelect}
                onToggleExpanded={onToggleExpanded}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
