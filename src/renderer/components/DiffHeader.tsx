import type { DiffOptions } from '@core/models/DiffOptions';
import type { FileDiffResult } from '@core/models/FileDiffResult';
import { DiffOptionsControls } from './DiffOptionsControls';

interface DiffHeaderProps {
  readonly title: string;
  readonly diff: FileDiffResult | null;
  readonly blockCount: number;
  readonly activeBlockNumber: number;
  readonly options: DiffOptions;
  readonly onOptionsChange: (options: DiffOptions) => void;
  readonly onPreviousDifference: () => void;
  readonly onNextDifference: () => void;
  readonly onRevealInFinder: () => void;
}

export function DiffHeader({
  title,
  diff,
  blockCount,
  activeBlockNumber,
  options,
  onOptionsChange,
  onPreviousDifference,
  onNextDifference,
  onRevealInFinder,
}: DiffHeaderProps): React.JSX.Element {
  return (
    <div className="diff-header">
      <span className="diff-header__title" title={title}>
        {title}
      </span>
      {diff ? (
        <span className="diff-header__stats">
          <span>{diff.statistics.changedLines} changed</span>
          <span>{diff.statistics.addedLines} added</span>
          <span>{diff.statistics.removedLines} removed</span>
        </span>
      ) : null}
      <div className="diff-header__spacer" />
      <DiffOptionsControls options={options} onOptionsChange={onOptionsChange} />
      <button
        type="button"
        className="diff-header__button"
        onClick={onPreviousDifference}
        disabled={blockCount === 0}
        title="Previous difference (⇧F7)"
      >
        ↑
      </button>
      <span className="diff-header__stats">
        {blockCount === 0 ? '0' : `${activeBlockNumber} / ${blockCount}`}
      </span>
      <button
        type="button"
        className="diff-header__button"
        onClick={onNextDifference}
        disabled={blockCount === 0}
        title="Next difference (F7)"
      >
        ↓
      </button>
      <button type="button" className="diff-header__button" onClick={onRevealInFinder}>
        Reveal
      </button>
    </div>
  );
}
