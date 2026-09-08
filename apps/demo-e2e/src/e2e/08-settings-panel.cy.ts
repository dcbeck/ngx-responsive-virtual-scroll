import {
  visitState,
  expectItemsAtGridPositions,
  expectScrollHeightCorrect,
  expectViewportCovered,
  getGridItemHeading,
  getItemsPerRow,
  scrollToBottom,
  setNumberInput,
  waitForStableRender,
} from '../support/app.po';

describe('Virtual Scroll - Settings Panel', () => {
  const setup = (numberOfItems: number) => {
    cy.viewport(1200, 700);
    visitState({ numberOfItems, itemWidth: 250, rowHeight: 280 });
  };

  it('grows the item count live and renders the new tail', () => {
    setup(50);
    setNumberInput('#quantity', 120);
    scrollToBottom();
    getGridItemHeading(119).should('exist');
    expectViewportCovered();
    expectItemsAtGridPositions(280);
  });

  it('shrinks the item count live and drops the DOM tail', () => {
    setup(300);
    setNumberInput('#quantity', 10);
    cy.get('#grid-item-50').should('not.exist');
    expectScrollHeightCorrect(10, 280);
    expectItemsAtGridPositions(280);
    expectViewportCovered();
  });

  it('renders the empty state and recovers from it', () => {
    setup(60);
    setNumberInput('#quantity', 0);
    cy.get('[data-vs-index]').should('not.exist');

    setNumberInput('#quantity', 30);
    getGridItemHeading(0).should('contain', 'Card 0');
    expectItemsAtGridPositions(280);
  });

  it('toggles between grid and list mode and re-renders correctly', () => {
    setup(200);
    cy.get('aside input[type="checkbox"]').first().click();
    waitForStableRender();
    cy.get('[data-vs-index]')
      .first()
      .should('have.class', 'ngx-scroll-view-list-item');
    getItemsPerRow().should('eq', 1);
    expectItemsAtGridPositions(280);

    cy.get('aside input[type="checkbox"]').first().click();
    waitForStableRender();
    cy.get('[data-vs-index]')
      .first()
      .should('have.class', 'ngx-scroll-view-grid-item');
    expectItemsAtGridPositions(280);
    expectViewportCovered();
  });

  it('applies a new item width live', () => {
    setup(200);
    getItemsPerRow().then((before) => {
      setNumberInput('#itemWidth', 450);
      getItemsPerRow().should('be.lessThan', before);
      expectItemsAtGridPositions(280);
      expectViewportCovered();
    });
  });

  it('applies a new row height live', () => {
    setup(200);
    setNumberInput('#itemHeight', 150);
    expectItemsAtGridPositions(150);
    expectScrollHeightCorrect(200, 150);
  });

  it('shows the validation message for invalid sizes', () => {
    cy.viewport(1200, 700);
    cy.visit('/#/?numberOfItems=50&itemWidth=50&rowHeight=50');
    cy.contains('Width of item must be greater than 100px').should('exist');
    cy.get('ngx-responsive-virtual-scroll').should('not.exist');
  });
});
