import type { ComparisonSummary } from '@core/models/ComparisonNode';
import type { ComparisonOptions, ContentComparisonMode } from '@core/models/ComparisonOptions';
import type { ComparisonStatus } from '@core/models/ComparisonStatus';
import { PatternInput } from './PatternInput';
import { StatusFilterChips } from './StatusFilterChips';

const COMPARISON_MODE_LABELS: ReadonlyArray<{ value: ContentComparisonMode; label: string }> = [
  { value: 'content', label: 'File contents' },
  { value: 'size-and-time', label: 'Size and date' },
  { value: 'size-only', label: 'Size only' },
];

interface OptionsBarProps {
  readonly options: ComparisonOptions;
  readonly summary: ComparisonSummary | null;
  readonly visibleStatuses: readonly ComparisonStatus[];
  readonly nameQuery: string;
  readonly onOptionsChange: (options: ComparisonOptions) => void;
  readonly onVisibleStatusToggle: (status: ComparisonStatus) => void;
  readonly onNameQueryChange: (query: string) => void;
}

export function OptionsBar({
  options,
  summary,
  visibleStatuses,
  nameQuery,
  onOptionsChange,
  onVisibleStatusToggle,
  onNameQueryChange,
}: OptionsBarProps): React.JSX.Element {
  const update = (changes: Partial<ComparisonOptions>): void => onOptionsChange({ ...options, ...changes });

  return (
    <div className="options-bar">
      <label className="options-bar__group" title="How files with equal names are judged equal">
        <span className="options-bar__group-label">Compare by</span>
        <select
          className="control"
          value={options.contentComparisonMode}
          onChange={(event) =>
            update({ contentComparisonMode: event.target.value as ContentComparisonMode })
          }
        >
          {COMPARISON_MODE_LABELS.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </label>

      <label className="toggle" title="Descend into subfolders">
        <input
          type="checkbox"
          checked={options.recursive}
          onChange={(event) => update({ recursive: event.target.checked })}
        />
        Subfolders
      </label>

      <label className="toggle" title="Include dot-files and dot-folders">
        <input
          type="checkbox"
          checked={options.includeHiddenEntries}
          onChange={(event) => update({ includeHiddenEntries: event.target.checked })}
        />
        Hidden
      </label>

      <PatternInput
        label="Exclude"
        title="Names to skip, comma separated. Supports * and ?"
        placeholder="node_modules, *.log"
        patterns={options.excludedNamePatterns}
        onPatternsChange={(patterns) => update({ excludedNamePatterns: patterns })}
      />

      <PatternInput
        label="Only"
        title="If set, only files matching these patterns are compared"
        placeholder="*.ts, *.json"
        patterns={options.includedNamePatterns}
        onPatternsChange={(patterns) => update({ includedNamePatterns: patterns })}
      />

      <div className="options-bar__spacer" />

      <StatusFilterChips
        visibleStatuses={visibleStatuses}
        summary={summary}
        onToggle={onVisibleStatusToggle}
      />

      <input
        className="control control--search"
        type="search"
        value={nameQuery}
        placeholder="Filter results by name"
        onChange={(event) => onNameQueryChange(event.target.value)}
      />
    </div>
  );
}
