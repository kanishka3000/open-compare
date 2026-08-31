import { useCallback, useEffect, useRef, useState } from 'react';

export interface SplitPosition {
  readonly width: number;
  readonly isDragging: boolean;
  beginDrag(event: React.MouseEvent): void;
}

export function useSplitPosition(initialWidth: number, minWidth: number, maxWidth: number): SplitPosition {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ pointerX: 0, width: initialWidth });

  const beginDrag = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      dragOrigin.current = { pointerX: event.clientX, width };
      setIsDragging(true);
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }
    const onMove = (event: MouseEvent): void => {
      const delta = event.clientX - dragOrigin.current.pointerX;
      setWidth(Math.min(maxWidth, Math.max(minWidth, dragOrigin.current.width + delta)));
    };
    const onRelease = (): void => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onRelease);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onRelease);
    };
  }, [isDragging, minWidth, maxWidth]);

  return { width, isDragging, beginDrag };
}
