/// <reference types="cypress" />

import { ITEM_SELECTOR } from './app.po';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get the number of items displayed in the densest rendered row.
       */
      getFirstRowItemCount(): Chainable<number>;

      /**
       * Wait until the virtual scroll render pipeline has settled.
       */
      waitForVirtualScrollStabilization(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getFirstRowItemCount', () => {
  return cy.document({ log: false }).then((doc) => {
    const container = doc.querySelector('ngx-responsive-virtual-scroll');
    if (!container) return 0;
    const containerTop = container.getBoundingClientRect().top;
    const rowCounts = new Map<number, number>();
    doc.querySelectorAll(ITEM_SELECTOR).forEach((el) => {
      const y = Math.round(el.getBoundingClientRect().top - containerTop);
      rowCounts.set(y, (rowCounts.get(y) ?? 0) + 1);
    });
    return rowCounts.size ? Math.max(...rowCounts.values()) : 0;
  });
});

Cypress.Commands.add('waitForVirtualScrollStabilization', () => {
  // Cypress types cannot express runtime chain flattening.
  return cy
    .get(ITEM_SELECTOR, { log: false })
    .should('have.length.greaterThan', 0)
    .then(() => {
      cy.wait(100, { log: false });
    }) as unknown as Cypress.Chainable<void>;
});

export {};
