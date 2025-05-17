import {
  getGridItemHeading,
  gridItemsShouldExistWithinIndexRange,
  scrollToVirtualScrollViewBottom,
  scrollToVirtualScrollViewTop,
  visitState,
} from '../support/app.po';

describe('demo-e2e', () => {
  it('should render a grid of 200 items and display the last card when scrolled to the bottom', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 200, maxItemsPerRow: 3 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(189, 199);
    scrollToVirtualScrollViewTop();
    getGridItemHeading(0).should('exist');
  });

  it('should render a grid of 600 items and display the last card when scrolled to the bottom', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 600, maxItemsPerRow: 4 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(584, 599);
    scrollToVirtualScrollViewTop();
    getGridItemHeading(0).should('exist');
  });

  it('should render a grid of 70252 items and display the last card when scrolled to the bottom', () => {
    cy.viewport(1400, 660);
    visitState({ numberOfItems: 70252, maxItemsPerRow: 5 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(70235, 70251);
    scrollToVirtualScrollViewTop();
    getGridItemHeading(0).should('exist');
  });
});
