import type { DiffOptions, WhitespaceSensitivity } from '@core/models/DiffOptions';

const WHITESPACE_CHOICES: ReadonlyArray<{ value: WhitespaceSensitivity; label: string }> = [
  { value: 'exact', label: 'Whitespace: exact' },
  { value: 'ignore-trailing', label: 'Whitespace: ignore trailing' },
  { value: 'ignore-all', label: 'Whitespace: ignore all' },
];

interface DiffOptionsControlsProps {
  readonly options: DiffOptions;
  readonly onOptionsChange: (options: DiffOptions) => void;
}

export function DiffOptionsControls({
  options,
  onOptionsChange,
}: DiffOptionsControlsProps): React.JSX.Element {
  const update = (changes: Partial<DiffOptions>): void => onOptionsChange({ ...options, ...changes });

  return (
    <>
      <select
        className="control"
        value={options.whitespaceSensitivity}
        onChange={(event) =>
          update({ whitespaceSensitivity: event.target.value as WhitespaceSensitivity })
        }
      >
        {WHITESPACE_CHOICES.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
      <label className="toggle">
        <input
          type="checkbox"
          checked={options.ignoreCase}
          onChange={(event) => update({ ignoreCase: event.target.checked })}
        />
        Ignore case
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={options.ignoreBlankLines}
          onChange={(event) => update({ ignoreBlankLines: event.target.checked })}
        />
        Ignore blank lines
      </label>
    </>
  );
}
