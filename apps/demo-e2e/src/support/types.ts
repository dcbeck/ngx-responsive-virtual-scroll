export type StateKey =
  | 'selectedIndex'
  | 'numberOfItems'
  | 'itemWidth'
  | 'rowHeight'
  | 'itemPadding'
  | 'scrollViewPadding'
  | 'stretchItems'
  | 'isGrid';

export type StateParams = {
  [K in StateKey]: string | number | boolean | undefined;
};
