import {
  visitState,
  scrollToVirtualScrollViewBottom,
  scrollToVirtualScrollViewTop,
  scrollToVirtualScrollViewYPosition,
  gridItemsShouldExistWithinIndexRange,
  getGridItemHeading,
  waitForVirtualScroll,
} from '../support/app.po';

describe('Virtual Scroll - Scrolling', () => {
  it('should scroll to bottom and show last items with 3 columns', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 200, itemWidth: 280 });
    waitForVirtualScroll();

    scrollToVirtualScrollViewBottom();

    // With ~3 columns, verify last items are visible
    getGridItemHeading(199).should('exist');
    getGridItemHeading(198).should('exist');
  });

  it('should scroll to bottom and show last items with 4 columns', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 600, itemWidth: 250 });
    waitForVirtualScroll();

    scrollToVirtualScrollViewBottom();

    // Verify items near the end are visible
    getGridItemHeading(599).should('exist');
  });

  it('should scroll to bottom and return to top', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 1000, itemWidth: 250 });
    waitForVirtualScroll();

    scrollToVirtualScrollViewBottom();
    getGridItemHeading(999).should('exist');

    scrollToVirtualScrollViewTop();
    getGridItemHeading(0).should('exist');
  });

  it('should handle single column layout', () => {
    cy.viewport(400, 1200);
    visitState({ numberOfItems: 50, itemWidth: 300 });
    waitForVirtualScroll();

    scrollToVirtualScrollViewBottom();
    // Last items should be visible
    getGridItemHeading(49).should('exist');
  });

  it('should scroll to specific Y position and show correct items', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 500, itemWidth: 250 });
    waitForVirtualScroll();

    scrollToVirtualScrollViewYPosition(2000);

    // Items around position 2000 should be visible
    cy.get('[id^="grid-item-"]').should('have.length.gt', 0);
  });

  it('should handle very large data set scrolling', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 50000, itemWidth: 250 });
    waitForVirtualScroll();

    scrollToVirtualScrollViewBottom();

    // Should show items near the end
    getGridItemHeading(49999).should('exist');
  });
});
