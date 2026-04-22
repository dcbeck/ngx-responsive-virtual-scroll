import { getStateUrl } from './getStateUrl';
import { StateParams } from './types';

/**
 * Visit the demo app with optional state parameters
 */
export const visitState = (options?: Partial<StateParams>) => {
  const numItems = (options?.numberOfItems as number) || 500;
  cy.visit(
    getStateUrl({
      selectedIndex: options?.selectedIndex,
      numberOfItems: numItems,
      itemWidth: options?.itemWidth ?? 300,
      rowHeight: options?.rowHeight ?? 280,
      itemPadding: options?.itemPadding ?? 24,
      scrollViewPadding: options?.scrollViewPadding ?? 24,
      stretchItems: options?.stretchItems ?? false,
      isGrid: options?.isGrid ?? true,
    })
  );

  // Wait for the virtual scroll component to be ready
  cy.get('ngx-responsive-virtual-scroll', { timeout: 10000 }).should('exist');

  // If we expect items, wait for them to render
  if (numItems > 0) {
    cy.get('[id^="grid-item-"]', { timeout: 10000 }).should('exist');
  }
};

/**
 * Scroll the virtual scroll view to the bottom
 */
export const scrollToVirtualScrollViewBottom = () => {
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo('bottom', {
    duration: 500,
    ensureScrollable: false,
  });
  cy.wait(200);
};

/**
 * Scroll the virtual scroll view to the top
 */
export const scrollToVirtualScrollViewTop = () => {
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo('top', {
    duration: 500,
    ensureScrollable: false,
  });
  cy.wait(200);
};

/**
 * Scroll the virtual scroll view to a specific Y position
 */
export const scrollToVirtualScrollViewYPosition = (yPosition: number) => {
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo(0, yPosition, {
    duration: 500,
    ensureScrollable: false,
  });
  cy.wait(200);
};

/**
 * Get a grid item by its index
 */
export const getGridItem = (index: number) => {
  return cy.get(`#grid-item-${index}`);
};

/**
 * Get the heading of a grid item by its index
 */
export const getGridItemHeading = (index: number) => {
  return cy.get(`#grid-item-heading-${index}`);
};

/**
 * Get the learn more button of a grid item by its index
 */
export const getGridItemButton = (index: number) => {
  return cy.get(`#grid-item-learn-more-btn-${index}`);
};

/**
 * Select a grid item by clicking its learn more button
 */
export const selectGridItem = (index: number) => {
  getGridItemButton(index).click();
  cy.wait(100);
};

/**
 * Verify a grid item is selected
 */
export const gridItemWithIndexShouldBeSelected = (index: number) => {
  getGridItem(index).should('have.attr', 'data-selected', 'true');
};

/**
 * Verify a grid item is not selected
 */
export const gridItemWithIndexShouldNotBeSelected = (index: number) => {
  getGridItem(index).should('have.attr', 'data-selected', 'false');
};

/**
 * Toggle the star/favorite state of an item
 */
export const toggleStarWithIndex = (index: number) => {
  selectGridItem(index);
  gridItemWithIndexShouldBeSelected(index);
  cy.get('#inspector-star-button').click();
  cy.wait(100);
};

/**
 * Verify an item has an active star
 */
export const gridItemWithIndexShouldHaveActiveStar = (index: number) => {
  cy.get(`#grid-item-star-${index}`).should('have.attr', 'data-starred', 'true');
};

/**
 * Verify an item does not have an active star
 */
export const gridItemWithIndexShouldHaveNoStar = (index: number) => {
  cy.get(`#grid-item-star-${index}`).should('have.attr', 'data-starred', 'false');
};

/**
 * Close the inspector panel
 */
export const closeInspector = () => {
  cy.get('#inspector-close-button').click();
  cy.wait(100);
};

/**
 * Verify the inspector shows the correct item
 */
export const inspectorShouldBeOpenWithItemAtIndex = (index: number) => {
  cy.get('#inspector-heading').should('contain', `Item ${index}`);
};

/**
 * Verify grid items exist within an index range
 */
export const gridItemsShouldExistWithinIndexRange = (
  fromIndex: number,
  toIndex: number
) => {
  for (let index = fromIndex; index <= toIndex; index++) {
    getGridItemHeading(index).should('exist').and('contain', `Card ${index}`);
  }
};

/**
 * Verify the number of columns in the first row
 */
export const shouldHaveNumberOfColumns = (expectedCols: number) => {
  cy.getFirstRowItemCount().should('eq', expectedCols);
};

/**
 * Get the number of visible items
 */
export const getVisibleItemCount = () => {
  return cy.get('[id^="grid-item-"]').its('length');
};

/**
 * Wait for the virtual scroll to render and stabilize
 */
export const waitForVirtualScroll = () => {
  cy.get('ngx-responsive-virtual-scroll').should('exist');
  cy.get('[id^="grid-item-"]').should('have.length.gt', 0);
};
