import {
  getGridItemHeading,
  gridItemsShouldExistWithinIndexRange,
  scrollToVirtualScrollViewBottom,
  scrollToVirtualScrollViewTop,
  visitState,
} from '../support/app.po';

describe('Virtual Scroll - Scrolled to Bottom E2E Tests', () => {
  it('renders 200 items in a grid with 3 per row and displays the last cards when scrolled to the bottom', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 200, maxItemsPerRow: 3 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(189, 199);
  });

  it('renders 600 items in a grid with 4 per row and displays the last cards when scrolled to the bottom', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 600, maxItemsPerRow: 4 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(584, 599);
  });

  it('renders 70,252 items in a grid with 5 per row, displays the last cards when scrolled to the bottom, and verifies the first card after scrolling to the top', () => {
    cy.viewport(1400, 660);
    visitState({ numberOfItems: 70252, maxItemsPerRow: 5 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(70235, 70251);
    scrollToVirtualScrollViewTop();
    getGridItemHeading(0).should('exist');
  });

  it('renders 12 items in a grid with 2 per row and displays the last cards when scrolled to the bottom', () => {
    cy.viewport(800, 400);
    visitState({ numberOfItems: 12, maxItemsPerRow: 2 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(6, 11);
  });

  it('renders 5 items in a single row and displays all cards when scrolled to the bottom', () => {
    cy.viewport(1400, 300);
    visitState({ numberOfItems: 5, maxItemsPerRow: 5 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(0, 5);
  });

  it('renders 50 items in a grid with 1 per row and displays the last cards when scrolled to the bottom', () => {
    cy.viewport(400, 1200);
    visitState({ numberOfItems: 50, maxItemsPerRow: 1 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(43, 49);
  });

  it('renders 23 items in a grid with 4 per row and displays the last cards when scrolled to the bottom', () => {
    cy.viewport(1000, 500);
    visitState({ numberOfItems: 23, maxItemsPerRow: 4 });
    scrollToVirtualScrollViewBottom();
    gridItemsShouldExistWithinIndexRange(12, 22);
  });
});
