import { FolderPicker } from './FolderPicker';

interface TitleBarProps {
  readonly leftRoot: string;
  readonly rightRoot: string;
  readonly isComparing: boolean;
  readonly onLeftRootChange: (path: string) => void;
  readonly onRightRootChange: (path: string) => void;
  readonly onSwapRoots: () => void;
  readonly onCompare: () => void;
  readonly onCancel: () => void;
}

export function TitleBar({
  leftRoot,
  rightRoot,
  isComparing,
  onLeftRootChange,
  onRightRootChange,
  onSwapRoots,
  onCompare,
  onCancel,
}: TitleBarProps): React.JSX.Element {
  const canCompare = leftRoot !== '' && rightRoot !== '';

  return (
    <header className="titlebar">
      <FolderPicker label="Left" path={leftRoot} onPathChange={onLeftRootChange} />
      <button
        type="button"
        className="titlebar__swap"
        title="Swap left and right folders"
        onClick={onSwapRoots}
        disabled={!canCompare}
      >
        ⇄
      </button>
      <FolderPicker label="Right" path={rightRoot} onPathChange={onRightRootChange} />
      {isComparing ? (
        <button type="button" className="titlebar__action" onClick={onCancel}>
          Stop
        </button>
      ) : (
        <button
          type="button"
          className="titlebar__action titlebar__action--primary"
          onClick={onCompare}
          disabled={!canCompare}
          title="Compare folders (⌘↩)"
        >
          Compare
        </button>
      )}
    </header>
  );
}
