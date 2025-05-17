export type StateKey =
  | 'selectedIndex'
  | 'numberOfItems'
  | 'maxItemsPerRow'
  | 'itemWidth'
  | 'rowHeight'
  | 'itemGap'
  | 'scrollViewPadding'
  | 'stretchItems'
  | 'isGrid';

export type ScrollGridItem = {
  id: string;
  index: number;
  isFavored: boolean;
};
