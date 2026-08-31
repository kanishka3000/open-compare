import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ComparisonProgress,
  DirectoryComparisonResult,
} from '@core/models/DirectoryComparisonResult';
import type { CompareDirectoriesRequest } from '@shared/ipc';

export interface ComparisonState {
  readonly result: DirectoryComparisonResult | null;
  readonly isComparing: boolean;
  readonly progress: ComparisonProgress | null;
  readonly errorMessage: string | null;
}

const INITIAL_STATE: ComparisonState = {
  result: null,
  isComparing: false,
  progress: null,
  errorMessage: null,
};

export function useComparison(): ComparisonState & {
  run: (request: CompareDirectoriesRequest) => Promise<void>;
  cancel: () => void;
} {
  const [state, setState] = useState<ComparisonState>(INITIAL_STATE);
  const latestRequestId = useRef(0);

  useEffect(
    () =>
      window.macCompare.onComparisonProgress((progress) => {
        setState((previous) => (previous.isComparing ? { ...previous, progress } : previous));
      }),
    [],
  );

  const run = useCallback(async (request: CompareDirectoriesRequest): Promise<void> => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setState((previous) => ({ ...previous, isComparing: true, progress: null, errorMessage: null }));

    const outcome = await window.macCompare.compareDirectories(request);
    if (latestRequestId.current !== requestId) {
      return;
    }
    if (outcome.ok) {
      setState({ result: outcome.value, isComparing: false, progress: null, errorMessage: null });
      return;
    }
    setState((previous) => ({
      result: outcome.reason === 'cancelled' ? previous.result : null,
      isComparing: false,
      progress: null,
      errorMessage: outcome.reason === 'cancelled' ? null : outcome.message,
    }));
  }, []);

  const cancel = useCallback(() => {
    void window.macCompare.cancelComparison();
  }, []);

  return { ...state, run, cancel };
}
