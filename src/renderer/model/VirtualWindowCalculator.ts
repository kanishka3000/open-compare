const OVERSCAN_ROWS = 12;

export interface VirtualWindow {
  readonly firstIndex: number;
  readonly lastIndex: number;
  readonly totalHeight: number;
  readonly offsetTop: number;
}

export function computeVirtualWindow(
  rowCount: number,
  rowHeight: number,
  scrollTop: number,
  viewportHeight: number,
): VirtualWindow {
  const firstVisibleRow = Math.floor(scrollTop / rowHeight);
  const visibleRowCount = Math.ceil((viewportHeight || rowHeight) / rowHeight);
  const firstIndex = Math.max(0, firstVisibleRow - OVERSCAN_ROWS);
  const lastIndex = Math.min(rowCount, firstVisibleRow + visibleRowCount + OVERSCAN_ROWS);

  return {
    firstIndex,
    lastIndex,
    totalHeight: rowCount * rowHeight,
    offsetTop: firstIndex * rowHeight,
  };
}
