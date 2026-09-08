import {
  visitState,
  expectItemsAtGridPositions,
  expectScrollHeightCorrect,
  expectViewportCovered,
  getGridItemHeading,
  shouldHaveNumberOfColumns,
  scrollToBottom,
  scrollToY,
} from '../support/app.po';

describe('Virtual Scroll - List Mode', () => {
  const setup = (numberOfItems: number, rowHeight: number, extra = {}) => {
    cy.viewport(1200, 660);
    visitState({
      numberOfItems,
      isGrid: false,
      itemWidth: 300,
      rowHeight,
      ...extra,
    });
  };

  it('renders a single full-width column of fixed-height rows', () => {
    setup(400, 180);
    shouldHaveNumberOfColumns(1);
    expectItemsAtGridPositions(180);
    expectViewportCovered();
    expectScrollHeightCorrect(400, 180, 1);
  });

  it('tags rendered wrappers with the list item class only', () => {
    setup(100, 160);
    cy.get('[data-vs-index]')
      .first()
      .should('have.class', 'ngx-scroll-view-list-item')
      .and('not.have.class', 'ngx-scroll-view-grid-item');
  });

  it('scrolls to the bottom and renders the last item', () => {
    setup(1500, 120);
    scrollToBottom();
    getGridItemHeading(1499).should('exist');
    expectViewportCovered();
    expectItemsAtGridPositions(120);
    expectScrollHeightCorrect(1500, 120, 1);
  });

  it('renders the correct window mid-list', () => {
    setup(800, 140);
    scrollToY(14000); // row 100
    expectViewportCovered();
    expectItemsAtGridPositions(140);
    cy.get('#grid-item-0').should('not.exist');
  });

  it('measures row height automatically when rowHeight is omitted', () => {
    cy.viewport(1200, 660);
    visitState({
      numberOfItems: 300,
      isGrid: false,
      autoSize: true,
      rowHeight: 280, // passed via URL but not bound to the component
    });

    // All items share the measured natural height and sit at exact offsets.
    expectItemsAtGridPositions(); // rowHeight derived live
    expectViewportCovered();
    expectScrollHeightCorrect(300); // rowHeight derived live
  });

  it('supports bufferLength in list mode', () => {
    setup(400, 140, { bufferLength: 2 });
    scrollToY(4200);
    expectViewportCovered(2);
    expectItemsAtGridPositions(140);
    expectScrollHeightCorrect(400, 140, 1);
  });
});
