import {
  visitState,
  shouldHaveNumberOfColumns,
  selectGridItem,
  getGridItem,
  getGridItemHeading,
  waitForVirtualScroll,
  scrollToVirtualScrollViewYPosition,
} from '../support/app.po';

describe('Virtual Scroll - Responsive Layout', () => {
  it('should render correct columns at different viewport widths', () => {
    visitState({ numberOfItems: 100, itemWidth: 200 });
    waitForVirtualScroll();

    // Test various viewport sizes with smaller item width
    cy.viewport(1600, 660);
    cy.waitForVirtualScrollStabilization();
    cy.getFirstRowItemCount().should('be.at.least', 4);

    cy.viewport(1200, 800);
    cy.waitForVirtualScrollStabilization();
    cy.getFirstRowItemCount().should('be.at.least', 3);

    cy.viewport(500, 900);
    cy.waitForVirtualScrollStabilization();
    cy.getFirstRowItemCount().should('be.at.least', 1);

    cy.viewport(250, 1000);
    cy.waitForVirtualScrollStabilization();
    cy.getFirstRowItemCount().should('eq', 1);
  });

  it('should keep selected item visible after viewport resize', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    // Select a visible item
    selectGridItem(2);
    getGridItem(2).should('exist');

    cy.viewport(800, 660);
    cy.wait(300);
    getGridItem(2).should('exist');

    cy.viewport(400, 660);
    cy.wait(300);
    getGridItem(2).should('exist');
  });

  it('should update columns when inspector opens (reducing available space)', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 100, itemWidth: 200 });
    waitForVirtualScroll();

    // Get initial column count
    cy.getFirstRowItemCount().as('initialColumns');

    // Select item to open inspector
    selectGridItem(3);
    cy.wait(300);

    // After inspector opens, should have fewer or equal columns
    cy.getFirstRowItemCount().should('be.at.most', 5);
  });

  it('should maintain at least 1 column at very small viewports', () => {
    cy.viewport(200, 400);
    visitState({ numberOfItems: 10, itemWidth: 150 });
    waitForVirtualScroll();

    shouldHaveNumberOfColumns(1);
  });

  it('should handle mobile viewport sizes', () => {
    cy.viewport(375, 667);
    visitState({ numberOfItems: 50, itemWidth: 300 });
    waitForVirtualScroll();

    // Mobile should show fewer columns (typically 1)
    cy.getFirstRowItemCount().should('be.at.most', 2);
  });

  it('should handle tablet viewport sizes', () => {
    cy.viewport(768, 1024);
    visitState({ numberOfItems: 50, itemWidth: 220 });
    waitForVirtualScroll();

    // Tablet should show at least 1 column (could be 1-2 depending on item width)
    cy.getFirstRowItemCount().should('be.at.least', 1);
  });

  it('should keep scrolled-to item visible after viewport resize', () => {
    cy.viewport(1200, 800);
    visitState({ numberOfItems: 500, itemWidth: 250, rowHeight: 280 });
    waitForVirtualScroll();

    // Scroll down to bring items into view
    scrollToVirtualScrollViewYPosition(3000);
    cy.wait(500);

    // Verify items are rendered after scrolling
    cy.get('[id^="grid-item-"]').should('have.length.gt', 0);

    // Get the first visible item button and extract its index
    cy.get('[id^="grid-item-learn-more-btn-"]').first().then(($btn) => {
      const id = $btn.attr('id');
      const index = parseInt(id?.replace('grid-item-learn-more-btn-', '') || '0');

      // Click to select the item
      cy.wrap($btn).click();
      cy.wait(100);

      // Verify the item is selected and URL is updated
      cy.url().should('include', `selectedIndex=${index}`);

      // Resize viewport to a smaller width - autoScrollOnResize should keep item in view
      cy.viewport(800, 800);
      cy.wait(500);

      // After resize, verify that:
      // 1. Items are still rendered
      cy.get('[id^="grid-item-"]').should('have.length.gt', 0);
      // 2. The URL still has the selected index (selection preserved)
      cy.url().should('include', `selectedIndex=${index}`);

      // Resize to an even smaller viewport
      cy.viewport(600, 800);
      cy.wait(500);

      // Verify items are rendered and selection is preserved
      cy.get('[id^="grid-item-"]').should('have.length.gt', 0);
      cy.url().should('include', `selectedIndex=${index}`);

      // If the item is currently visible, verify it's selected
      cy.get(`body`).then(($body) => {
        //if ($body.find(`#grid-item-${index}`).length > 0) {
          cy.get(`#grid-item-${index}`).should('have.attr', 'data-selected', 'true');
        //}
      });
    });
  });
});
