import { DEFAULT_COMPARISON_OPTIONS, type ComparisonOptions } from '@core/models/ComparisonOptions';
import { DEFAULT_DIFF_OPTIONS, type DiffOptions } from '@core/models/DiffOptions';
import { ALL_COMPARISON_STATUSES, type ComparisonStatus } from '@core/models/ComparisonStatus';

const STORAGE_KEY = 'mac-compare.workspace';

export interface WorkspaceSettings {
  readonly leftRoot: string;
  readonly rightRoot: string;
  readonly comparisonOptions: ComparisonOptions;
  readonly diffOptions: DiffOptions;
  readonly visibleStatuses: readonly ComparisonStatus[];
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  leftRoot: '',
  rightRoot: '',
  comparisonOptions: DEFAULT_COMPARISON_OPTIONS,
  diffOptions: DEFAULT_DIFF_OPTIONS,
  visibleStatuses: ALL_COMPARISON_STATUSES,
};

/**
 * Remembers the folders and options between launches so reopening the app resumes where the user
 * left off.
 */
export class WorkspaceSettingsStore {
  load(): WorkspaceSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? this.merge(JSON.parse(stored) as Partial<WorkspaceSettings>) : DEFAULT_WORKSPACE_SETTINGS;
    } catch {
      return DEFAULT_WORKSPACE_SETTINGS;
    }
  }

  save(settings: WorkspaceSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Persisting preferences is best effort; a full quota must not break the comparison.
    }
  }

  private merge(stored: Partial<WorkspaceSettings>): WorkspaceSettings {
    return {
      leftRoot: stored.leftRoot ?? DEFAULT_WORKSPACE_SETTINGS.leftRoot,
      rightRoot: stored.rightRoot ?? DEFAULT_WORKSPACE_SETTINGS.rightRoot,
      comparisonOptions: { ...DEFAULT_COMPARISON_OPTIONS, ...stored.comparisonOptions },
      diffOptions: { ...DEFAULT_DIFF_OPTIONS, ...stored.diffOptions },
      visibleStatuses: stored.visibleStatuses ?? DEFAULT_WORKSPACE_SETTINGS.visibleStatuses,
    };
  }
}
