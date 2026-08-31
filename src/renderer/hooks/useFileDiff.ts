import { useEffect, useRef, useState } from 'react';
import type { DiffOptions } from '@core/models/DiffOptions';
import type { FileDiffResult } from '@core/models/FileDiffResult';

export interface FileDiffSelection {
  readonly key: string;
  readonly leftPath: string | null;
  readonly rightPath: string | null;
}

export interface FileDiffState {
  readonly diff: FileDiffResult | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

const IDLE_STATE: FileDiffState = { diff: null, isLoading: false, errorMessage: null };

export function useFileDiff(
  selection: FileDiffSelection | null,
  options: DiffOptions,
): FileDiffState {
  const [state, setState] = useState<FileDiffState>(IDLE_STATE);
  const latestRequestId = useRef(0);

  useEffect(() => {
    if (!selection) {
      setState(IDLE_STATE);
      return;
    }

    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setState({ diff: null, isLoading: true, errorMessage: null });

    void window.openCompare
      .diffFile({ leftPath: selection.leftPath, rightPath: selection.rightPath, options })
      .then((outcome) => {
        if (latestRequestId.current !== requestId) {
          return;
        }
        setState(
          outcome.ok
            ? { diff: outcome.value, isLoading: false, errorMessage: null }
            : { diff: null, isLoading: false, errorMessage: outcome.message },
        );
      });
  }, [selection, options]);

  return state;
}
