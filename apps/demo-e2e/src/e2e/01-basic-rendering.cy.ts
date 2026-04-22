import {
  visitState,
  getGridItem,
  getGridItemHeading,
  waitForVirtualScroll,
} from '../support/app.po';

describe('Virtual Scroll - Basic Rendering', () => {
  it('should render the virtual scroll component', () => {
    visitState({ numberOfItems: 100 });
    cy.get('ngx-responsive-virtual-scroll').should('exist');
  });

  it('should render items with correct headings', () => {
    visitState({ numberOfItems: 50 });
    waitForVirtualScroll();

    // First few items should be visible
    getGridItemHeading(0).should('contain', 'Card 0');
    getGridItemHeading(1).should('contain', 'Card 1');
    getGridItemHeading(2).should('contain', 'Card 2');
  });

  it('should render items with correct IDs', () => {
    visitState({ numberOfItems: 30 });
    waitForVirtualScroll();

    getGridItem(0).should('have.id', 'grid-item-0');
    getGridItem(1).should('have.id', 'grid-item-1');
    getGridItem(2).should('have.id', 'grid-item-2');
  });

  it('should handle empty data set gracefully', () => {
    visitState({ numberOfItems: 0 });
    cy.get('ngx-responsive-virtual-scroll').should('exist');
    // The component renders even with 0 items, showing default items
    // or an empty state. We just verify the app doesn't crash.
  });

  it('should render large data sets efficiently', () => {
    visitState({ numberOfItems: 10000 });
    waitForVirtualScroll();

    // Should not have all items in DOM, only visible ones
    cy.get('[id^="grid-item-"]').its('length').should('be.lt', 100);
  });
});
