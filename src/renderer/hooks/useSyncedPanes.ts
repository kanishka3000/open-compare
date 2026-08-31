import { useCallback, useRef, useState } from 'react';

export interface SyncedPanes {
  readonly leftRef: React.RefCallback<HTMLDivElement>;
  readonly rightRef: React.RefCallback<HTMLDivElement>;
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly onLeftScroll: () => void;
  readonly onRightScroll: () => void;
  scrollToOffset(offsetTop: number): void;
}

/**
 * Keeps the two diff panes on the same line. Vertical position is mirrored between them while
 * horizontal scrolling stays independent, which is how side-by-side merge tools behave.
 */
export function useSyncedPanes(): SyncedPanes {
  const leftElement = useRef<HTMLDivElement | null>(null);
  const rightElement = useRef<HTMLDivElement | null>(null);
  const suppressNextSyncEvent = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // The panes only exist once a file is selected, so the height has to be measured when the element
  // arrives. Measuring on mount instead would run while the placeholder is showing and read nothing.
  const leftRef = useCallback((element: HTMLDivElement | null) => {
    leftElement.current = element;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => setViewportHeight(element.clientHeight));
    observer.observe(element);
    setViewportHeight(element.clientHeight);
    return () => {
      observer.disconnect();
      leftElement.current = null;
    };
  }, []);

  const rightRef = useCallback((element: HTMLDivElement | null) => {
    rightElement.current = element;
  }, []);

  const mirror = useCallback((source: HTMLDivElement | null, target: HTMLDivElement | null) => {
    if (!source) {
      return;
    }
    if (suppressNextSyncEvent.current) {
      suppressNextSyncEvent.current = false;
      return;
    }
    if (target && target.scrollTop !== source.scrollTop) {
      suppressNextSyncEvent.current = true;
      target.scrollTop = source.scrollTop;
    }
    setScrollTop(source.scrollTop);
  }, []);

  const onLeftScroll = useCallback(() => mirror(leftElement.current, rightElement.current), [mirror]);
  const onRightScroll = useCallback(() => mirror(rightElement.current, leftElement.current), [mirror]);

  const scrollToOffset = useCallback((offsetTop: number) => {
    for (const element of [leftElement.current, rightElement.current]) {
      if (element) {
        element.scrollTop = offsetTop;
      }
    }
    setScrollTop(offsetTop);
  }, []);

  return { leftRef, rightRef, scrollTop, viewportHeight, onLeftScroll, onRightScroll, scrollToOffset };
}
