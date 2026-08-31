interface PlaceholderProps {
  readonly title: string;
  readonly hint?: string;
}

export function Placeholder({ title, hint }: PlaceholderProps): React.JSX.Element {
  return (
    <div className="placeholder">
      <div className="placeholder__title">{title}</div>
      {hint ? <div className="placeholder__hint">{hint}</div> : null}
    </div>
  );
}
