import { ALL_COMPARISON_STATUSES, describeStatus, type ComparisonStatus } from '@core/models/ComparisonStatus';
import type { ComparisonSummary } from '@core/models/ComparisonNode';

interface StatusFilterChipsProps {
  readonly visibleStatuses: readonly ComparisonStatus[];
  readonly summary: ComparisonSummary | null;
  readonly onToggle: (status: ComparisonStatus) => void;
}

export function StatusFilterChips({
  visibleStatuses,
  summary,
  onToggle,
}: StatusFilterChipsProps): React.JSX.Element {
  return (
    <div className="options-bar__group">
      {ALL_COMPARISON_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          className={visibleStatuses.includes(status) ? 'status-chip status-chip--on' : 'status-chip'}
          onClick={() => onToggle(status)}
        >
          <span className={`status-chip__dot status-chip__dot--${status}`} />
          {describeStatus(status)}
          {summary ? ` ${countFor(summary, status)}` : ''}
        </button>
      ))}
    </div>
  );
}

function countFor(summary: ComparisonSummary, status: ComparisonStatus): number {
  switch (status) {
    case 'identical':
      return summary.identical;
    case 'different':
      return summary.different;
    case 'left-only':
      return summary.leftOnly;
    case 'right-only':
      return summary.rightOnly;
  }
}
