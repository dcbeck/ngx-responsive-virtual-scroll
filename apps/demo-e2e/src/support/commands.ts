/// <reference types="cypress" />

// Custom commands for ngx-responsive-virtual-scroll e2e tests

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get the number of items displayed in the first visible row
       */
      getFirstRowItemCount(): Chainable<number>;

      /**
       * Wait for the virtual scroll to stabilize after viewport changes
       */
      waitForVirtualScrollStabilization(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getFirstRowItemCount', () => {
  return cy.get('[id^="grid-item-learn-more-btn-"]').then(($items) => {
    const itemsArray = $items.toArray();
    if (itemsArray.length === 0) return 0;

    const firstY = itemsArray[0].getBoundingClientRect().top;
    const sameRowItems = itemsArray.filter(
      (el) => el.getBoundingClientRect().top === firstY
    );
    return sameRowItems.length;
  });
});

Cypress.Commands.add('waitForVirtualScrollStabilization', () => {
  // Wait for virtual scroll to render items
  cy.get('[id^="grid-item-"]').should('exist');
  cy.wait(100);
});
