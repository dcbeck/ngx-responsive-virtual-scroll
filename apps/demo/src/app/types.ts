export type StateKey =
  | 'selectedIndex'
  | 'numberOfItems'
  | 'maxItemsPerRow'
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

export type ScrollGridItem = {
  id: string;
  index: number;
  isFavored: boolean;
};
