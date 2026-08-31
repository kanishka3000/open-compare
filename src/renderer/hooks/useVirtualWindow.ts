import { useCallback, useRef, useState } from 'react';
import { computeVirtualWindow, type VirtualWindow } from '../model/VirtualWindowCalculator';

export interface VirtualScroller<TElement extends HTMLElement> {
  readonly containerRef: React.RefCallback<TElement>;
  readonly window: VirtualWindow;
  readonly onScroll: () => void;
  scrollToRow(rowIndex: number): void;
}

/**
 * Renders only the rows near the viewport so directory trees with tens of thousands of entries
 * stay responsive.
 */
export function useVirtualWindow<TElement extends HTMLElement>(
  rowCount: number,
  rowHeight: number,
): VirtualScroller<TElement> {
  const element = useRef<TElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Measured through a ref callback rather than an effect so the height is still picked up when the
  // scroller mounts later than the component that owns it.
  const containerRef = useCallback((node: TElement | null) => {
    element.current = node;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(() => setViewportHeight(node.clientHeight));
    observer.observe(node);
    setViewportHeight(node.clientHeight);
    return () => {
      observer.disconnect();
      element.current = null;
    };
  }, []);

  const onScroll = useCallback(() => {
    setScrollTop(element.current?.scrollTop ?? 0);
  }, []);

  const scrollToRow = useCallback(
    (rowIndex: number) => {
      const node = element.current;
      if (!node) {
        return;
      }
      const rowTop = rowIndex * rowHeight;
      const rowBottom = rowTop + rowHeight;
      if (rowTop < node.scrollTop) {
        node.scrollTop = rowTop;
      } else if (rowBottom > node.scrollTop + node.clientHeight) {
        node.scrollTop = rowBottom - node.clientHeight;
      }
    },
    [rowHeight],
  );

  return {
    containerRef,
    window: computeVirtualWindow(rowCount, rowHeight, scrollTop, viewportHeight),
    onScroll,
    scrollToRow,
  };
}
