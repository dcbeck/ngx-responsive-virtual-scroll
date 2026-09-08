export type StateKey =
  | 'selectedIndex'
  | 'numberOfItems'
  | 'itemWidth'
  | 'rowHeight'
  | 'itemPadding'
  | 'scrollViewPadding'
  | 'stretchItems'
  | 'isGrid'
  | 'bufferLength'
  | 'viewCache'
  | 'scrollDebounceMs'
  | 'asyncRendering'
  | 'customPlaceholder'
  | 'autoSize';

export type StateParams = {
  selectedIndex?: number;
  numberOfItems?: number;
  itemWidth?: number;
  rowHeight?: number;
  itemPadding?: number;
  scrollViewPadding?: number;
  stretchItems?: boolean;
  isGrid?: boolean;
  bufferLength?: number;
  viewCache?: number | boolean;
  scrollDebounceMs?: number;
  asyncRendering?: boolean;
  customPlaceholder?: boolean;
  autoSize?: boolean;
};
