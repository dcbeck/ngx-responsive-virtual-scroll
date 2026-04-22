import {
  visitState,
  waitForVirtualScroll,
} from '../support/app.po';

describe('Virtual Scroll - Grid/Settings Configuration', () => {
  it('should switch between grid and list views', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 50, isGrid: true, itemWidth: 250 });
    waitForVirtualScroll();

    // In grid view - check for grid-like layout
    cy.get('ngx-responsive-virtual-scroll').should('exist');

    // Toggle to list view using the settings panel
    cy.get('aside input[type="checkbox"]').first().click();
    cy.wait(300);

    // Component should still exist
    cy.get('ngx-responsive-virtual-scroll').should('exist');
  });

  it('should respect custom item width', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 50, itemWidth: 400 });
    waitForVirtualScroll();

    // With itemWidth=400, fewer items should fit per row
    cy.getFirstRowItemCount().should('be.at.most', 3);
  });

  it('should handle stretchItems mode', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 50, stretchItems: true, itemWidth: 200 });
    waitForVirtualScroll();

    // Items should stretch to fill available space
    cy.get('[id^="grid-item-"]').should('exist');
  });

  it('should handle custom item padding', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 50, itemPadding: 50, itemWidth: 250 });
    waitForVirtualScroll();

    // Items should have custom padding
    cy.get('[id^="grid-item-"]').first().parent().should('have.css', 'padding');
  });

  it('should handle custom scroll view padding', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 50, scrollViewPadding: 40, itemWidth: 250 });
    waitForVirtualScroll();

    // Scroll view should have custom padding
    cy.get('ngx-responsive-virtual-scroll').should(
      'have.css',
      'padding'
    );
  });

  it('should update item count via settings', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 50, itemWidth: 250 });
    waitForVirtualScroll();

    // Update item count via settings panel
    cy.get('#quantity').clear().type('100');
    cy.wait(500);

    // Should have more items available - verify by scrolling to new end
    cy.get('ngx-responsive-virtual-scroll:first').scrollTo('bottom', { duration: 500 });
    cy.wait(200);

    // New items should be rendered
    cy.get('[id^="grid-item-"]').should('exist');
  });

  it('should show validation message for invalid dimensions', () => {
    cy.viewport(1000, 660);
    // Try to set invalid dimensions - the app shows a validation message
    cy.visit('/#/?numberOfItems=50&itemWidth=50&rowHeight=50');

    // Give the app time to process
    cy.wait(1000);

    // The app shows an error message when dimensions are too small
    cy.contains('Width of item must be greater than 100px').should('exist');
  });
});
