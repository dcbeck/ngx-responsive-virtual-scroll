import { ScrollViewType } from './types';

export interface ScrollViewPadding {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface IVirtualScrollOptions {
  itemWidth?: number;
  itemHeight: number;
  numAdditionalRows?: number;
  numLimitColumns?: number;
  itemGap: number | undefined,
  padding: ScrollViewPadding;
  type: ScrollViewType;
}

export interface IVirtualScrollContainer {
  width: number;
  height: number;
}

export interface IVirtualScrollMeasurement {
  containerWidth: number;
  containerHeight: number;
  itemWidth?: number;
  itemHeight: number;
  numPossibleRows: number;
  numPossibleColumns: number;
  numPossibleItems: number;
}

export interface IVirtualScrollWindow {
  dataTimestamp: number;
  containerWidth: number;
  containerHeight: number;
  itemWidth?: number;
  itemHeight: number;
  numVirtualItems: number;
  numVirtualRows: number;
  virtualHeight: number;
  numAdditionalRows: number;
  scrollTop: number;
  scrollPercentage: number;
  numActualRows: number;
  numActualColumns: number;
  actualHeight: number;
  numActualItems: number;
  visibleStartRow: number;
  visibleEndRow: number;
}

export interface IVirtualScrollState {
  measurement: IVirtualScrollMeasurement | null;
  scrollWindow: IVirtualScrollWindow | null;
  rows: any;
  needsCheck: boolean;
}
