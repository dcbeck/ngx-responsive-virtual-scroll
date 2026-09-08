import {
  ITEM_SELECTOR,
  getScrollContainer,
  inspectorShouldBeOpenWithItemAtIndex,
  visitState,
  waitForStableRender,
} from '../support/app.po';

const ROW_HEIGHT = 280;
const NUMBER_OF_ITEMS = 1200000;
const LAST_INDEX = NUMBER_OF_ITEMS - 1;

/**
 * The browser caps the height of a single element (~2^25 px in Chromium),
 * which caps the scrollable area absolute virtual-scroll spacers can provide.
 * The virtual scroll therefore keeps a logical scroll offset: the container
 * scrolls within the current segment and the offset is advanced by wheel
 * events at the segment edges (see VirtualScrollComponent.reanchorOnWheel).
 * These specs pin that behavior: items whose absolute offset lies beyond the
 * cap must stay reachable, and must stay in view when the layout shifts under
 * the selection.
 *
 * Note: raw absolute scrollTop assignments targeting another segment are
 * inherently lossy (the browser clamps them to the physical range before the
 * component can react) — the same limitation applies to native
 * scrollIntoView; Cypress's actionability scrolling is disabled in this spec
 * for that reason (click with `scrollBehavior: false`).
 */
describe('Virtual Scroll - Large Lists (browser scroll limit)', () => {
  const setup = () => {
    cy.viewport(1400, 800);
    // 1.2M items * 280px / ~4 columns ~ 84M px of logical content — far
    // beyond the ~33.5M px a single element can span.
    visitState({
      numberOfItems: NUMBER_OF_ITEMS,
      itemWidth: 238,
      rowHeight: ROW_HEIGHT,
    });
  };

  const scrollToBottomEdge = () =>
    getScrollContainer()
      .then(($el) => {
        $el[0].scrollTop = $el[0].scrollHeight;
      })
      .then(() => waitForStableRender());

  const scrollToTopEdge = () =>
    getScrollContainer()
      .then(($el) => {
        $el[0].scrollTop = 0;
      })
      .then(() => waitForStableRender());

  const wheelBy = (deltaY: number) =>
    getScrollContainer()
      .then(($el) => {
        $el[0].dispatchEvent(
          new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true })
        );
      })
      .then(() => waitForStableRender());

  const navigateToLastItem = () => {
    // Segment 1 via absolute scroll, then cross the remaining boundaries
    // with wheel events (the handler advances the logical offset).
    scrollToBottomEdge();
    wheelBy(50000000);
    wheelBy(50000000);
    return getScrollContainer()
      .then(($el) => {
        const item = $el[0].querySelector(
          `${ITEM_SELECTOR}[data-vs-index="${LAST_INDEX}"]`
        );
        if (!item) {
          wheelBy(50000000);
        }
      })
      .then(() => waitForStableRender());
  };

  it('renders the last items via offset remapping', () => {
    setup();
    navigateToLastItem();
    cy.get(`${ITEM_SELECTOR}[data-vs-index="${LAST_INDEX}"]`).should('exist');
  });

  it('keeps the clicked item in view when selecting it changes the layout', () => {
    setup();
    navigateToLastItem();

    const itemSelector = `${ITEM_SELECTOR}[data-vs-index="${LAST_INDEX}"]`;
    cy.get(itemSelector).should('exist');

    // scrollBehavior: false — Cypress's actionability scrolling would scroll
    // the capped container to the item's physical (segment-relative)
    // position and destroy the logical scroll mapping.
    cy.get(`#grid-item-learn-more-btn-${LAST_INDEX}`).click({
      scrollBehavior: false,
    });
    cy.get(`#grid-item-${LAST_INDEX}`).should(
      'have.attr',
      'data-selected',
      'true'
    );
    inspectorShouldBeOpenWithItemAtIndex(LAST_INDEX);

    // Selecting the item shrinks the scroll area (fewer items per row),
    // which pushes the item's logical position further past the scrollable
    // cap. autoScrollOnResize must re-anchor so the item stays visible.
    cy.get(itemSelector).should('exist');
    getScrollContainer().should(($el) => {
      const container = $el[0].getBoundingClientRect();
      const item = $el[0].querySelector(itemSelector)!.getBoundingClientRect();
      // The item must be (at least partially) in view. The last row can sit
      // partially below the fold — native scrolling cannot scroll it fully
      // above the container bottom either.
      expect(item.top, JSON.stringify({ scrollTop: $el[0].scrollTop })).to.be
        .at.least(container.top - 1);
      expect(item.bottom - container.top).to.be.above(0);
    });
  });

  it('walks back to the first item after reaching the bottom', () => {
    setup();
    navigateToLastItem();
    cy.get(`${ITEM_SELECTOR}[data-vs-index="${LAST_INDEX}"]`).should('exist');

    scrollToTopEdge();
    wheelBy(-50000000);
    wheelBy(-50000000);
    cy.get(`${ITEM_SELECTOR}[data-vs-index="0"]`).should('exist');
  });
});
