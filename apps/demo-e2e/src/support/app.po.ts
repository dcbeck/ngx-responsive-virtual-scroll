import { getStateUrl } from './getStateUrl';
import { StateParams } from './types';

/**
 * Selector for a rendered virtual scroll item wrapper. The demo app tags each
 * rendered item template root with `data-vs-index="<global item index>"`.
 */
export const ITEM_SELECTOR = '[data-vs-index]';

const renderedIndicesOf = (doc: Document) =>
  Array.from(doc.querySelectorAll(ITEM_SELECTOR))
    .map((el) => parseInt(el.getAttribute('data-vs-index')!, 10))
    .sort((a, b) => a - b);

/**
 * Visit the demo app with the given state parameters and wait until the
 * virtual scroll has settled (initial render complete, no pending
 * placeholders, rendered item set stable).
 */
export const visitState = (options?: Partial<StateParams>) => {
  const numItems = options?.numberOfItems ?? 500;
  const invalidSizes =
    (options?.itemWidth !== undefined && options.itemWidth < 100) ||
    (options?.rowHeight !== undefined && options.rowHeight < 100);

  cy.visit(
    getStateUrl({
      selectedIndex: options?.selectedIndex,
      numberOfItems: numItems,
      itemWidth: options?.itemWidth ?? 300,
      rowHeight: options?.rowHeight ?? 280,
      itemPadding: options?.itemPadding ?? 24,
      scrollViewPadding: options?.scrollViewPadding ?? 24,
      stretchItems: options?.stretchItems ?? false,
      isGrid: options?.isGrid ?? true,
      bufferLength: options?.bufferLength,
      viewCache: options?.viewCache,
      scrollDebounceMs: options?.scrollDebounceMs,
      asyncRendering: options?.asyncRendering,
      customPlaceholder: options?.customPlaceholder,
      autoSize: options?.autoSize,
    })
  );

  if (numItems > 0 && !invalidSizes) {
    cy.get('ngx-responsive-virtual-scroll', { timeout: 15000 }).should('exist');
    waitForStableRender();
  }
};

/**
 * Wait until the set of rendered item indices is stable (no pending render
 * pipeline, no visible placeholders, no grid toggle flicker) for several
 * consecutive samples. Replaces arbitrary `cy.wait(...)` calls.
 */
export const waitForStableRender = () => {
  let prev: string | null = null;
  let stableSamples = 0;
  const requiredStableSamples = 3;

  // Recursive chain: Cypress types cannot express runtime chain flattening.
  const poll = (): Cypress.Chainable<void> =>
    cy.document({ log: false }).then((doc) => {
      const snapshot = Array.from(doc.querySelectorAll(ITEM_SELECTOR))
        .map((el) => el.getAttribute('data-vs-index'))
        .sort()
        .join(',');
      const hasPlaceholders =
        doc.querySelectorAll('[data-vs-placeholder], .virtual-placeholder')
          .length > 0;

      stableSamples =
        snapshot === prev && !hasPlaceholders ? stableSamples + 1 : 1;
      prev = snapshot;

      if (stableSamples >= requiredStableSamples) {
        return;
      }
      return cy.wait(80, { log: false }).then(poll);
    }) as unknown as Cypress.Chainable<void>;

  return poll();
};

export const getScrollContainer = () =>
  cy.get('ngx-responsive-virtual-scroll:first');

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

/**
 * Live geometry of the scroll container (the virtual scroll host element).
 */
export const getScrollMetrics = (): Cypress.Chainable<ScrollMetrics> =>
  getScrollContainer().then(($el) => {
    const el = $el[0];
    const style = getComputedStyle(el);
    return {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      clientWidth: el.clientWidth,
      paddingTop: parseFloat(style.paddingTop) || 0,
      paddingBottom: parseFloat(style.paddingBottom) || 0,
      paddingLeft: parseFloat(style.paddingLeft) || 0,
      paddingRight: parseFloat(style.paddingRight) || 0,
    };
  });

/**
 * Sorted global indices of all currently rendered items.
 */
export const getRenderedIndices = (): Cypress.Chainable<number[]> =>
  cy.document({ log: false }).then(renderedIndicesOf);

/**
 * Number of items per row, derived live from the rendered DOM (the densest
 * y-aligned row). Returns 1 in list mode.
 */
export const getItemsPerRow = (): Cypress.Chainable<number> =>
  cy.document({ log: false }).then((doc) => {
    const container = doc.querySelector('ngx-responsive-virtual-scroll');
    if (!container) return 1;
    const containerTop = container.getBoundingClientRect().top;
    const rowCounts = new Map<number, number>();
    doc.querySelectorAll(ITEM_SELECTOR).forEach((el) => {
      const y = Math.round(el.getBoundingClientRect().top - containerTop);
      rowCounts.set(y, (rowCounts.get(y) ?? 0) + 1);
    });
    return Math.max(1, ...rowCounts.values());
  });

/**
 * Scroll the virtual scroll container to an absolute Y offset (instant) and
 * wait for the render pipeline to settle.
 */
export const scrollToY = (y: number) => {
  getScrollContainer().scrollTo(0, y, { ensureScrollable: false, log: false });
  return waitForStableRender();
};

export const scrollToTop = () => {
  getScrollContainer().scrollTo('top', {
    ensureScrollable: false,
    log: false,
  });
  return waitForStableRender();
};

export const scrollToBottom = () => {
  getScrollContainer().scrollTo('bottom', {
    ensureScrollable: false,
    log: false,
  });
  return waitForStableRender();
};

/**
 * Assert that every rendered item sits exactly at its calculated grid
 * position:
 * - `y` = paddingTop + row * rowHeight
 * - `x` = paddingLeft + column * itemWidth (uniform item width)
 * - `index === row * itemsPerRow + column`
 *
 * `rowHeight` defaults to the live measured item height (used for auto-size
 * mode). Works for both grid and list mode (list => 1 column).
 */
export const expectItemsAtGridPositions = (
  rowHeight?: number
) => {
  return cy
    .document({ log: false })
    .then((doc) => {
      const container = doc.querySelector(
        'ngx-responsive-virtual-scroll'
      ) as HTMLElement;
      expect(container, 'scroll container exists').to.exist;
      const containerStyle = getComputedStyle(container);
      const padLeft = parseFloat(containerStyle.paddingLeft) || 0;
      const padTop = parseFloat(containerStyle.paddingTop) || 0;
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;

      const items = Array.from(
        doc.querySelectorAll<HTMLElement>(ITEM_SELECTOR)
      );
      expect(items.length, 'at least one item rendered').to.be.greaterThan(0);

      const measuredRowHeight =
        rowHeight ?? items[0].getBoundingClientRect().height;

      const rows = new Map<number, number>();
      const positions: {
        index: number;
        row: number;
        col: number;
        x: number;
        y: number;
        w: number;
        h: number;
      }[] = [];

      items.forEach((el) => {
        const index = parseInt(el.getAttribute('data-vs-index')!, 10);
        const rect = el.getBoundingClientRect();
        const y = rect.top - containerRect.top + scrollTop;
        const x = rect.left - containerRect.left;
        const row = Math.round((y - padTop) / measuredRowHeight);
        rows.set(row, (rows.get(row) ?? 0) + 1);
        positions.push({ index, row, col: 0, x, y, w: rect.width, h: rect.height });
      });

      const itemsPerRow = Math.max(1, ...rows.values());
      const uniformWidth = positions[0].w;

      positions.forEach((p) => {
        const expectedY = padTop + p.row * measuredRowHeight;
        expect(
          Math.abs(p.y - expectedY),
          `item ${p.index} y-offset`
        ).to.be.at.most(1.5);

        expect(
          Math.abs(p.w - uniformWidth),
          `item ${p.index} uniform width`
        ).to.be.at.most(1.5);
        expect(
          Math.abs(p.h - measuredRowHeight),
          `item ${p.index} height matches row height`
        ).to.be.at.most(1.5);

        const col = Math.round((p.x - padLeft) / uniformWidth);
        expect(
          Math.abs(p.x - (padLeft + col * uniformWidth)),
          `item ${p.index} x-offset`
        ).to.be.at.most(1.5);

        expect(
          p.index,
          `item ${p.index} at row ${p.row} column ${col} (ipr ${itemsPerRow})`
        ).to.equal(p.row * itemsPerRow + col);
      });
    });
};

/**
 * Assert the total scroll height of the container equals the padding plus
 * the fully virtualized content height (rows * rowHeight).
 * `columns` is derived live when omitted.
 */
export const expectScrollHeightCorrect = (
  numberOfItems: number,
  rowHeight?: number,
  columns?: number
) => {
  const resolve = (
    metrics: ScrollMetrics,
    itemsPerRow: number,
    measuredRowHeight: number
  ) => {
    const rows = Math.ceil(numberOfItems / itemsPerRow);
    const expected =
      metrics.paddingTop + rows * measuredRowHeight + metrics.paddingBottom;
    // scrollHeight never reports less than clientHeight.
    const expectedVisible = Math.max(expected, metrics.clientHeight);
    expect(
      Math.abs(metrics.scrollHeight - expectedVisible),
      `scrollHeight ${metrics.scrollHeight} ≈ ${expectedVisible}`
    ).to.be.at.most(2);
  };

  if (rowHeight !== undefined && columns !== undefined) {
    return getScrollMetrics().then((metrics) =>
      resolve(metrics, columns, rowHeight)
    );
  }

  return cy
    .document({ log: false })
    .then((doc) => {
      const firstItem = doc.querySelector<HTMLElement>(ITEM_SELECTOR);
      return firstItem ? firstItem.getBoundingClientRect().height : 0;
    })
    .then((measuredRowHeight) =>
      getItemsPerRow().then((itemsPerRow) =>
        getScrollMetrics().then((metrics) =>
          resolve(metrics, itemsPerRow, measuredRowHeight)
        )
      )
    );
};

/**
 * Assert that every row intersecting the visible viewport has at least one
 * rendered item (no blank gaps while scrolling), and that the render window
 * stays within the viewport plus the configured buffer.
 */
export const expectViewportCovered = (
  bufferLength = 1
) =>
  getScrollMetrics().then((metrics) =>
    cy.document({ log: false }).then((doc) => {
      const items = Array.from(
        doc.querySelectorAll<HTMLElement>(ITEM_SELECTOR)
      );
      expect(items.length, 'items are rendered').to.be.greaterThan(0);

      const container = doc.querySelector(
        'ngx-responsive-virtual-scroll'
      ) as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const padTop = metrics.paddingTop;
      const rowHeight = items[0].getBoundingClientRect().height;

      const rows = new Map<number, number>();
      items.forEach((el) => {
        const y = el.getBoundingClientRect().top - containerRect.top + metrics.scrollTop;
        const row = Math.round((y - padTop) / rowHeight);
        rows.set(row, (rows.get(row) ?? 0) + 1);
      });

      const firstVisibleRow = Math.max(
        0,
        Math.floor((metrics.scrollTop - padTop) / rowHeight)
      );
      const lastVisibleRow = Math.floor(
        (metrics.scrollTop + metrics.clientHeight - padTop) / rowHeight
      );
      // The bottom padding zone is visible but contains no content row.
      const totalContentRows = Math.round(
        (metrics.scrollHeight - metrics.paddingTop - metrics.paddingBottom) /
          rowHeight
      );
      const lastContentRow = Math.max(0, totalContentRows - 1);
      const firstRowToCheck = Math.min(firstVisibleRow, lastContentRow);
      const lastRowToCheck = Math.min(lastVisibleRow, lastContentRow);

      for (let row = firstRowToCheck; row <= lastRowToCheck; row++) {
        expect(
          rows.get(row) ?? 0,
          `visible row ${row} has rendered items`
        ).to.be.greaterThan(0);
      }

      const bufferRows = Math.ceil(
        (metrics.clientHeight * bufferLength) / rowHeight
      );
      const minAllowedRow = firstVisibleRow - bufferRows - 1;
      const maxAllowedRow = lastVisibleRow + bufferRows + 1;
      Array.from(rows.keys()).forEach((row) => {
        expect(
          row,
          `rendered row ${row} within [${minAllowedRow}, ${maxAllowedRow}]`
        ).to.be.within(minAllowedRow, maxAllowedRow);
      });
    })
  );

export const getGridItem = (index: number) => cy.get(`#grid-item-${index}`);

export const getGridItemHeading = (index: number) =>
  cy.get(`#grid-item-heading-${index}`);

/**
 * Click the "Learn More" button of an item. The item must be rendered.
 */
export const selectGridItem = (index: number) => {
  cy.get(`#grid-item-learn-more-btn-${index}`).click();
  return gridItemWithIndexShouldBeSelected(index);
};

export const gridItemWithIndexShouldBeSelected = (index: number) =>
  getGridItem(index).should('have.attr', 'data-selected', 'true');

export const toggleStarWithIndex = (index: number) => {
  selectGridItem(index);
  cy.get('#inspector-star-button').click();
};

export const gridItemWithIndexShouldHaveActiveStar = (index: number) =>
  cy
    .get(`#grid-item-star-${index}`)
    .should('have.attr', 'data-starred', 'true');

export const gridItemWithIndexShouldHaveNoStar = (index: number) =>
  cy
    .get(`#grid-item-star-${index}`)
    .should('have.attr', 'data-starred', 'false');

/**
 * Set a number input through Angular's ngModel pipeline in one shot.
 * Keystroke-by-keystroke typing races ngModel's write-back on number inputs
 * and can garble the value, so tests use this instead of `.clear().type()`.
 */
export const setNumberInput = (selector: string, value: number) =>
  cy
    .get(selector)
    .then(($el) => {
      const el = $el[0] as HTMLInputElement;
      el.value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })
    .then(() => waitForStableRender());

export const closeInspector = () => cy.get('#inspector-close-button').click();

export const inspectorShouldBeOpenWithItemAtIndex = (index: number) =>
  cy.get('#inspector-heading').should('contain', `Item ${index}`);

export const inspectorShouldBeClosed = () =>
  cy.get('#inspector-heading').should('not.exist');

export const shouldHaveNumberOfColumns = (expectedCols: number) =>
  getItemsPerRow().should('eq', expectedCols);

export const getVisibleItemCount = () =>
  cy.get(ITEM_SELECTOR, { log: false }).its('length');
