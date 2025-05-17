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

export type StateParams = {
  [K in StateKey]: string | number | boolean | undefined;
};
