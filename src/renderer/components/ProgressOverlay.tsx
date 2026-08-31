import type { ComparisonProgress } from '@core/models/DirectoryComparisonResult';
import { formatCount } from '../model/formatters';

interface ProgressOverlayProps {
  readonly progress: ComparisonProgress | null;
}

export function ProgressOverlay({ progress }: ProgressOverlayProps): React.JSX.Element {
  return (
    <div className="progress-overlay">
      <div>Comparing folders…</div>
      <div>{formatCount(progress?.scannedEntries ?? 0, 'file compared', 'files compared')}</div>
      <div className="progress-overlay__path">{progress?.currentRelativePath ?? ''}</div>
    </div>
  );
}
