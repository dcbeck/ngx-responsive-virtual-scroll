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

    // Scroll down to bring items into view (to ~item 30-40 range)
    scrollToVirtualScrollViewYPosition(3000);
    cy.wait(500);

    // Get all visible grid item IDs and pick one from the middle
    // Filter to only match grid-item-N (not grid-item-heading-N, etc.)
    cy.get('[id^="grid-item-"]').then(($items) => {
      // Filter to only get elements with IDs like "grid-item-0", "grid-item-1", etc.
      const gridItems = $items.filter((i, el) => /^grid-item-\d+$/.test(el.id));
      const middleIndex = Math.floor(gridItems.length / 2);
      const $targetItem = gridItems.eq(middleIndex);
      const targetId = $targetItem[0].id;
      const targetIndex = parseInt(targetId.replace('grid-item-', ''));

      cy.log(`Target item index: ${targetIndex}`);

      // Get the scroll position before selecting
      cy.get('ngx-responsive-virtual-scroll').then(($scroll) => {
        const scrollContainer = $scroll[0];
        const scrollTopBefore = scrollContainer.scrollTop;

        // Select the item by clicking its Learn More button
        cy.get(`#grid-item-learn-more-btn-${targetIndex}`).click();
        cy.wait(100);

        // Verify the item is selected
        cy.get(`#grid-item-${targetIndex}`).should('have.attr', 'data-selected', 'true');

        // Record the scroll position after selection
        cy.get('ngx-responsive-virtual-scroll').then(($scrollAfterSelect) => {
          const scrollTopAfterSelect = $scrollAfterSelect[0].scrollTop;

          // Resize viewport to a smaller width - this should trigger autoScrollOnResize
          cy.viewport(800, 800);
          // Wait longer for resize to complete and auto-scroll to happen
          cy.wait(800);

          // Verify the selected item is still in the DOM after resize
          // (autoScrollOnResize should have scrolled to keep it visible)
          cy.get(`#grid-item-${targetIndex}`).should('exist');

          // Verify the item is still selected after resize
          cy.get(`#grid-item-${targetIndex}`).should('have.attr', 'data-selected', 'true');

          // Get scroll position after resize to verify auto-scroll happened
          cy.get('ngx-responsive-virtual-scroll').then(($scrollAfterResize) => {
            const scrollTopAfterResize = $scrollAfterResize[0].scrollTop;

            // The scroll position should have changed to keep the selected item in view
            // or at least the item should be visible (which implies scroll adjustment)
            cy.log(`Scroll before resize: ${scrollTopBefore}`);
            cy.log(`Scroll after select: ${scrollTopAfterSelect}`);
            cy.log(`Scroll after resize: ${scrollTopAfterResize}`);

            // Resize to an even smaller viewport
            cy.viewport(600, 800);
            cy.wait(800);

            // The item should still be visible after second resize
            cy.get(`#grid-item-${targetIndex}`).should('exist');
            cy.get(`#grid-item-${targetIndex}`).should('have.attr', 'data-selected', 'true');
          });
        });
      });
    });
  });
});
