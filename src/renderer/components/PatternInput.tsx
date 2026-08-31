import { useState } from 'react';

interface PatternInputProps {
  readonly label: string;
  readonly title: string;
  readonly placeholder: string;
  readonly patterns: readonly string[];
  readonly onPatternsChange: (patterns: string[]) => void;
}

export function PatternInput({
  label,
  title,
  placeholder,
  patterns,
  onPatternsChange,
}: PatternInputProps): React.JSX.Element {
  const [text, setText] = useState(() => patterns.join(', '));

  const commit = (nextText: string): void => {
    setText(nextText);
    onPatternsChange(nextText.split(',').map((pattern) => pattern.trim()).filter(Boolean));
  };

  return (
    <label className="options-bar__group" title={title}>
      <span className="options-bar__group-label">{label}</span>
      <input
        className="control control--patterns"
        type="text"
        value={text}
        placeholder={placeholder}
        onChange={(event) => commit(event.target.value)}
      />
    </label>
  );
}
