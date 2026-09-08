import {
  visitState,
  expectItemsAtGridPositions,
  expectScrollHeightCorrect,
  expectViewportCovered,
  getScrollMetrics,
  shouldHaveNumberOfColumns,
  scrollToBottom,
  scrollToY,
} from '../support/app.po';

describe('Virtual Scroll - Item Sizing & Padding', () => {
  const sizes = [
    { name: 'tiny items', itemWidth: 101, rowHeight: 101, items: 800 },
    { name: 'large items', itemWidth: 600, rowHeight: 500, items: 200 },
    { name: 'odd sizes', itemWidth: 173, rowHeight: 137, items: 900 },
  ];

  sizes.forEach(({ name, itemWidth, rowHeight, items }) => {
    it(`renders ${name} with exact geometry from top to bottom`, () => {
      cy.viewport(1200, 800);
      visitState({ numberOfItems: items, itemWidth, rowHeight });
      expectItemsAtGridPositions(rowHeight);
      expectScrollHeightCorrect(items, rowHeight);

      scrollToBottom();
      expectViewportCovered();
      expectItemsAtGridPositions(rowHeight);
      expectScrollHeightCorrect(items, rowHeight);
    });
  });

  it('keeps row height exact regardless of item padding', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 300,
      itemWidth: 250,
      rowHeight: 200,
      itemPadding: 60,
    });
    expectItemsAtGridPositions(200);
    expectScrollHeightCorrect(300, 200);
  });

  it('accounts for scroll view padding in geometry and scroll height', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 300,
      itemWidth: 250,
      rowHeight: 200,
      scrollViewPadding: 80,
    });
    getScrollMetrics().then((m) => {
      expect(m.paddingTop, 'container top padding').to.eq(40);
      expect(m.paddingBottom, 'container bottom padding').to.eq(40);
    });
    expectItemsAtGridPositions(200);
    expectScrollHeightCorrect(300, 200);
  });

  it('falls back to a single column when items are wider than the container', () => {
    cy.viewport(800, 700);
    visitState({ numberOfItems: 100, itemWidth: 900, rowHeight: 200 });
    shouldHaveNumberOfColumns(1);
    expectItemsAtGridPositions(200);
    expectViewportCovered();
  });

  it('keeps the total scroll height exact at every scroll position', () => {
    cy.viewport(1200, 700);
    visitState({ numberOfItems: 777, itemWidth: 250, rowHeight: 190 });
    [0, 3000, 9000, 120000].forEach((y) => {
      scrollToY(y);
      expectScrollHeightCorrect(777, 190);
      expectViewportCovered();
    });
    scrollToBottom();
    expectItemsAtGridPositions(190);
    expectScrollHeightCorrect(777, 190);
  });
});
