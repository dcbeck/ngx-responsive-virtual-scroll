export type StateKey =
  | 'selectedIndex'
  | 'numberOfItems'
  | 'maxItemsPerRow'
  | 'itemWidth'
  | 'rowHeight'
  | 'itemPadding'
  | 'scrollViewPadding'
  | 'stretchItems'
  | 'isGrid';

export type ScrollGridItem = {
  id: string;
  index: number;
  isFavored: boolean;
};
