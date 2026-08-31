import { countComparedFiles, type ComparisonSummary } from '@core/models/ComparisonNode';
import { formatCount } from '../model/formatters';

interface StatusBarProps {
  readonly summary: ComparisonSummary | null;
  readonly unreadablePathCount: number;
  readonly errorMessage: string | null;
  readonly isComparing: boolean;
}

export function StatusBar({
  summary,
  unreadablePathCount,
  errorMessage,
  isComparing,
}: StatusBarProps): React.JSX.Element {
  return (
    <footer className="status-bar">
      {summary ? (
        <>
          <span>{formatCount(countComparedFiles(summary), 'file', 'files')}</span>
          <span className="status-bar__count">
            <span className="status-chip__dot status-chip__dot--identical" />
            {summary.identical} identical
          </span>
          <span className="status-bar__count">
            <span className="status-chip__dot status-chip__dot--different" />
            {summary.different} different
          </span>
          <span className="status-bar__count">
            <span className="status-chip__dot status-chip__dot--left-only" />
            {summary.leftOnly} left only
          </span>
          <span className="status-bar__count">
            <span className="status-chip__dot status-chip__dot--right-only" />
            {summary.rightOnly} right only
          </span>
          <span>{formatCount(summary.directories, 'folder', 'folders')}</span>
        </>
      ) : (
        <span>{isComparing ? 'Comparing…' : 'No comparison yet'}</span>
      )}
      <div className="status-bar__spacer" />
      {unreadablePathCount > 0 ? (
        <span>{formatCount(unreadablePathCount, 'unreadable path', 'unreadable paths')}</span>
      ) : null}
      {errorMessage ? <span className="status-bar__message--error">{errorMessage}</span> : null}
    </footer>
  );
}
