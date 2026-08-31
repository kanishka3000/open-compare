import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiffOptions } from '@core/models/DiffOptions';
import { useSyncedPanes } from '../hooks/useSyncedPanes';
import type { FileDiffState } from '../hooks/useFileDiff';
import { abbreviatePath } from '../model/abbreviatePath';
import { computeVirtualWindow } from '../model/VirtualWindowCalculator';
import { DiffHeader } from './DiffHeader';
import { DiffMinimap } from './DiffMinimap';
import { DiffPane } from './DiffPane';
import { Placeholder } from './Placeholder';

const DIFF_ROW_HEIGHT_PX = 20;
const LEADING_CONTEXT_FRACTION = 3;

export interface DiffNavigationRequest {
  readonly direction: 'next' | 'previous';
  readonly token: number;
}

export interface DiffSelection {
  readonly relativePath: string;
  readonly leftPath: string | null;
  readonly rightPath: string | null;
}

interface DiffPanelProps {
  readonly selection: DiffSelection | null;
  readonly diffState: FileDiffState;
  readonly options: DiffOptions;
  readonly navigationRequest: DiffNavigationRequest | null;
  readonly onOptionsChange: (options: DiffOptions) => void;
}

export function DiffPanel({
  selection,
  diffState,
  options,
  navigationRequest,
  onOptionsChange,
}: DiffPanelProps): React.JSX.Element {
  const panes = useSyncedPanes();
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const activeBlockIndexRef = useRef(0);

  const diff = diffState.diff;
  const rows = diff?.rows ?? [];
  const blocks = diff?.blocks ?? [];
  const { scrollToOffset, viewportHeight } = panes;

  const goToBlock = useCallback(
    (index: number) => {
      if (blocks.length === 0) {
        return;
      }
      const clamped = Math.min(blocks.length - 1, Math.max(0, index));
      activeBlockIndexRef.current = clamped;
      setActiveBlockIndex(clamped);
      const targetRow = blocks[clamped]!.firstRowIndex;
      scrollToOffset(
        Math.max(0, targetRow * DIFF_ROW_HEIGHT_PX - viewportHeight / LEADING_CONTEXT_FRACTION),
      );
    },
    [blocks, scrollToOffset, viewportHeight],
  );

  useEffect(() => {
    activeBlockIndexRef.current = 0;
    setActiveBlockIndex(0);
    if (diff && diff.blocks.length > 0) {
      goToBlock(0);
    } else {
      scrollToOffset(0);
    }
    // Re-anchoring only makes sense when a different diff arrives, not on every scroll.
  }, [diff]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!navigationRequest) {
      return;
    }
    goToBlock(activeBlockIndexRef.current + (navigationRequest.direction === 'next' ? 1 : -1));
  }, [navigationRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  const revealInFinder = useCallback(() => {
    const target = selection?.leftPath ?? selection?.rightPath;
    if (target) {
      void window.openCompare.revealInFinder(target);
    }
  }, [selection]);

  const virtualWindow = computeVirtualWindow(
    rows.length,
    DIFF_ROW_HEIGHT_PX,
    panes.scrollTop,
    panes.viewportHeight,
  );
  const activeBlock = blocks[activeBlockIndex];

  return (
    <section className="diff-panel">
      <DiffHeader
        title={selection?.relativePath ?? 'No file selected'}
        diff={diff}
        blockCount={blocks.length}
        activeBlockNumber={activeBlockIndex + 1}
        options={options}
        onOptionsChange={onOptionsChange}
        onPreviousDifference={() => goToBlock(activeBlockIndexRef.current - 1)}
        onNextDifference={() => goToBlock(activeBlockIndexRef.current + 1)}
        onRevealInFinder={revealInFinder}
      />
      <div className="diff-captions">
        <span className="diff-captions__side" title={diff?.left.path}>
          {describeSide(diff?.left.path, diff?.left.exists)}
        </span>
        <span className="diff-captions__side" title={diff?.right.path}>
          {describeSide(diff?.right.path, diff?.right.exists)}
        </span>
      </div>
      {renderBody()}
    </section>
  );

  function renderBody(): React.JSX.Element {
    if (!selection) {
      return (
        <Placeholder
          title="Select a file to see its differences"
          hint="Pick a left and right folder, run a comparison, then choose any file in the list."
        />
      );
    }
    if (diffState.isLoading) {
      return <Placeholder title="Loading…" />;
    }
    if (diffState.errorMessage) {
      return <Placeholder title="Could not open this file" hint={diffState.errorMessage} />;
    }
    if (diff && diff.kind !== 'text') {
      return <Placeholder title="No text comparison available" hint={diff.message ?? undefined} />;
    }
    return (
      <div className="diff-body">
        <DiffPane
          side="left"
          rows={rows}
          virtualWindow={virtualWindow}
          tabWidth={options.tabWidth}
          activeBlockRange={toRange(activeBlock)}
          containerRef={panes.leftRef}
          onScroll={panes.onLeftScroll}
        />
        <DiffPane
          side="right"
          rows={rows}
          virtualWindow={virtualWindow}
          tabWidth={options.tabWidth}
          activeBlockRange={toRange(activeBlock)}
          containerRef={panes.rightRef}
          onScroll={panes.onRightScroll}
        />
        <DiffMinimap
          rows={rows}
          blocks={blocks}
          rowHeight={DIFF_ROW_HEIGHT_PX}
          scrollTop={panes.scrollTop}
          viewportHeight={panes.viewportHeight}
          onSeekToRow={(rowIndex) => scrollToOffset(rowIndex * DIFF_ROW_HEIGHT_PX)}
        />
      </div>
    );
  }
}

function toRange(block: { firstRowIndex: number; lastRowIndex: number } | undefined) {
  return block ? { first: block.firstRowIndex, last: block.lastRowIndex } : null;
}

function describeSide(path: string | undefined, exists: boolean | undefined): string {
  if (!path) {
    return '';
  }
  return exists ? abbreviatePath(path) : `${abbreviatePath(path)} (missing)`;
}
