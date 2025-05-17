import { getStateUrl } from './getStateUrl';

export const getGreeting = () => cy.get('h1');

export const visitState = (options?: {
  selectedIndex?: number;
  numberOfItems?: number;
  maxItemsPerRow?: number;
  itemWidth?: number;
  rowHeight?: number;
  itemGap?: number;
  scrollViewPadding?: number;
  stretchItems?: boolean;
  isGrid?: boolean;
}) => {
  const numItems = options?.numberOfItems || 500;
  cy.visit(
    getStateUrl({
      selectedIndex: options?.selectedIndex,
      numberOfItems: numItems,
      maxItemsPerRow: options?.maxItemsPerRow || 3,
      itemWidth: options?.itemWidth || 200,
      rowHeight: options?.rowHeight || 200,
      itemGap: options?.itemGap || 24,
      scrollViewPadding: options?.scrollViewPadding || 24,
      stretchItems:
        options?.stretchItems === undefined ? false : options.stretchItems,
      isGrid: options?.isGrid === undefined ? true : options.stretchItems,
    })
  );

  if (numItems > 0) {
    cy.get('#grid-item-learn-more-btn-0').contains('Learn More');
  }
  cy.get('#quantity').should('have.value', `${numItems}`);
};

export const scrollToVirtualScrollViewBottom = () =>
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo('bottom');

export const scrollToVirtualScrollViewTop = () =>
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo('top');

export const scrollToVirtualScrollViewYPosition = (yPosition: number) =>
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo(0, yPosition);

export const getGridItemHeading = (index: number) => {
  return cy.get('#grid-item-heading-' + index);
};

export const gridItemsShouldExistWithinIndexRange = (
  fromIndex: number,
  toIndex: number
) => {
  for (let index = fromIndex; index < toIndex; index++) {
    getGridItemHeading(index)
      .should('exist')
      .contains('Card ' + index);
  }
  for (let a = 20; a > 1; a--) {
    getGridItemHeading(toIndex + a).should('not.exist');
    getGridItemHeading(fromIndex - a).should('not.exist');
  }
};
