import {
  visitState,
  getGridItemHeading,
  getScrollMetrics,
  expectItemsAtGridPositions,
  expectScrollHeightCorrect,
  expectViewportCovered,
  getVisibleItemCount,
  scrollToY,
} from '../support/app.po';

describe('Virtual Scroll - Rendering & Virtualization', () => {
  it('renders the first items with correct content', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    getGridItemHeading(0).should('contain', 'Card 0');
    getGridItemHeading(1).should('contain', 'Card 1');
    getGridItemHeading(2).should('contain', 'Card 2');
  });

  it('virtualizes large lists by rendering only a bounded window', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 5000, itemWidth: 250, rowHeight: 280 });
    getVisibleItemCount().should('be.lessThan', 120);
    expectViewportCovered();
  });

  it('places rendered items at their exact grid offsets', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 300, itemWidth: 250, rowHeight: 280 });
    expectItemsAtGridPositions(280);
  });

  it('compensates unrendered space with virtual spacers', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 1000, itemWidth: 250, rowHeight: 280 });
    expectScrollHeightCorrect(1000, 280);
    expectViewportCovered();
  });

  it('removes items from the DOM when they scroll out of range', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 1000, itemWidth: 250, rowHeight: 280 });
    scrollToY(11200); // ~40 rows down
    cy.get('#grid-item-0').should('not.exist');
    cy.get('#grid-item-heading-0').should('not.exist');
    expectViewportCovered();
    expectItemsAtGridPositions(280);
  });

  it('renders an empty list without crashing', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 0, itemWidth: 250, rowHeight: 280 });
    cy.get('ngx-responsive-virtual-scroll').should('exist');
    cy.get('[data-vs-index]').should('not.exist');
  });

  it('renders a single item at the correct position', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 1, itemWidth: 250, rowHeight: 280 });
    getGridItemHeading(0).should('contain', 'Card 0');
    expectItemsAtGridPositions(280);
    expectScrollHeightCorrect(1, 280);
  });

  it('does not allocate scroll space for an empty list', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 0, itemWidth: 250, rowHeight: 280 });
    getScrollMetrics().then((m) => {
      expect(m.scrollHeight).to.be.at.most(m.clientHeight);
    });
  });
});
