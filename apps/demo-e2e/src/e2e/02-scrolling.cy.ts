import {
  visitState,
  expectItemsAtGridPositions,
  expectScrollHeightCorrect,
  expectViewportCovered,
  getGridItemHeading,
  getScrollContainer,
  scrollToBottom,
  scrollToTop,
  scrollToY,
  waitForStableRender,
} from '../support/app.po';

describe('Virtual Scroll - Scrolling', () => {
  const ITEM_WIDTH = 250;
  const ROW_HEIGHT = 280;

  const setup = (numberOfItems: number) => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems, itemWidth: ITEM_WIDTH, rowHeight: ROW_HEIGHT });
  };

  it('renders the correct window at the middle of the list', () => {
    setup(2000);
    scrollToY(14000); // ~50 rows down
    expectViewportCovered();
    expectItemsAtGridPositions(ROW_HEIGHT);
  });

  it('jumps to the bottom and renders the last item', () => {
    setup(2000);
    scrollToBottom();
    getGridItemHeading(1999).should('exist');
    expectViewportCovered();
    expectItemsAtGridPositions(ROW_HEIGHT);
    expectScrollHeightCorrect(2000, ROW_HEIGHT);
  });

  it('returns to the top after scrolling to the bottom', () => {
    setup(2000);
    scrollToBottom();
    cy.get('#grid-item-0').should('not.exist');
    scrollToTop();
    getGridItemHeading(0).should('contain', 'Card 0');
    expectItemsAtGridPositions(ROW_HEIGHT);
  });

  it('survives rapid successive scroll jumps', () => {
    setup(2000);
    scrollToY(5600);
    scrollToY(22400);
    scrollToY(8400);
    scrollToY(16800);
    expectViewportCovered();
    expectItemsAtGridPositions(ROW_HEIGHT);
  });

  it('scrolls through a very large list (50k items)', () => {
    setup(50000);
    scrollToY(700000); // middle of the list
    expectViewportCovered();
    scrollToBottom();
    getGridItemHeading(49999).should('exist');
    expectViewportCovered();
    expectItemsAtGridPositions(ROW_HEIGHT);
    scrollToTop();
    getGridItemHeading(0).should('contain', 'Card 0');
  });

  it('throttles re-rendering while the scrollDebounceMs window is open', () => {
    cy.viewport(1200, 660);
    visitState({
      numberOfItems: 3000,
      itemWidth: ITEM_WIDTH,
      rowHeight: ROW_HEIGHT,
      scrollDebounceMs: 400,
    });

    // Two jumps back-to-back: the first consumes the leading throttle edge,
    // the second lands inside the throttle window and must be deferred.
    getScrollContainer().scrollTo(0, 14000, {
      ensureScrollable: false,
      log: false,
    });
    getScrollContainer().scrollTo(0, 28000, {
      ensureScrollable: false,
      log: false,
    });
    cy.wait(120); // well below the 400ms debounce

    cy.document({ log: false }).then((doc) => {
      const container = doc.querySelector(
        'ngx-responsive-virtual-scroll'
      ) as HTMLElement;
      const containerTop = container.getBoundingClientRect().top;
      const items = Array.from(
        doc.querySelectorAll<HTMLElement>('[data-vs-index]')
      );
      expect(items.length, 'items still rendered').to.be.greaterThan(0);
      const renderedRows = items.map(
        (el) =>
          Math.round(
            (el.getBoundingClientRect().top - containerTop) / ROW_HEIGHT
          ) + Math.round(container.scrollTop / ROW_HEIGHT)
      );
      const maxRenderedRow = Math.max(...renderedRows);
      // Row ~100 (the 28000px target) must not be rendered yet. Whatever
      // stale window is on screen (top or ~row 50), it is far above row 70.
      expect(
        maxRenderedRow,
        'render window not yet moved to the debounced target'
      ).to.be.lessThan(70);
    });

    // After the debounce window the target position must be rendered.
    waitForStableRender();
    expectViewportCovered();
    expectItemsAtGridPositions(ROW_HEIGHT);
  });
 });
