import { useCallback } from 'react';
import { abbreviatePath } from '../model/abbreviatePath';

interface FolderPickerProps {
  readonly label: string;
  readonly path: string;
  readonly onPathChange: (path: string) => void;
}

export function FolderPicker({ label, path, onPathChange }: FolderPickerProps): React.JSX.Element {
  const browse = useCallback(async () => {
    const selected = await window.openCompare.selectFolder(`Select the ${label.toLowerCase()} folder`);
    if (selected) {
      onPathChange(selected);
    }
  }, [label, onPathChange]);

  return (
    <div className="folder-picker">
      <span className="folder-picker__label">{label}</span>
      <span
        className={path ? 'folder-picker__path' : 'folder-picker__path folder-picker__path--empty'}
        title={path || undefined}
      >
        {path ? abbreviatePath(path) : 'No folder selected'}
      </span>
      <button type="button" className="folder-picker__browse" onClick={() => void browse()}>
        Browse
      </button>
    </div>
  );
}
