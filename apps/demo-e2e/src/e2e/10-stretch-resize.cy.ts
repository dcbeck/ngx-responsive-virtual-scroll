import { visitState } from '../support/app.po';

/** Minimal Angular dev-mode global for driving the component in tests. */
interface StretchToggleApi {
  itemWidthCalculated: {
    setShouldStretchItems(value: boolean): void;
    shouldStretchItems$: { value: boolean };
    scrollContainerWidth$: { value: number };
    itemsPerRow$: { value: number };
  };
  itemWidthReal?: number;
  itemsPerRow: number;
}

declare global {
  interface Window {
    ng?: {
      getComponent(element: Element): StretchToggleApi | null;
    };
  }
}

interface StretchState {
  usable: number;
  stretch: boolean;
  contW: number;
  iprSub: number;
  real?: number;
  stateIPR: number;
  cssVar: string;
}

const setStretchDirect = (value: boolean) => {
  cy.window({ log: false }).then((win) => {
    const ng = win.ng;
    if (!ng) {
      throw new Error('Angular dev-mode global `ng` is unavailable');
    }
    const el = win.document.querySelector('ngx-responsive-virtual-scroll');
    if (!el) {
      throw new Error('virtual scroll host not found');
    }
    const cmp = ng.getComponent(el);
    if (!cmp) {
      throw new Error('virtual scroll component instance not found');
    }
    cmp.itemWidthCalculated.setShouldStretchItems(value);
    expect(
      cmp.itemWidthCalculated.shouldStretchItems$.value,
      'stretch flag after direct toggle'
    ).to.eq(value);
  });
};

const readStretchState = () => {
  return cy.window({ log: false }).then((win): StretchState => {
    const el = win.document.querySelector('ngx-responsive-virtual-scroll');
    if (!el || !win.ng) {
      throw new Error('probe unavailable');
    }
    const cmp = win.ng.getComponent(el);
    if (!cmp) {
      throw new Error('probe: component instance not found');
    }
    const host = el as HTMLElement;
    const style = getComputedStyle(host);
    const usable =
      host.clientWidth -
      (parseFloat(style.paddingLeft) || 0) -
      (parseFloat(style.paddingRight) || 0);
    return {
      usable: Math.round(usable),
      stretch: cmp.itemWidthCalculated.shouldStretchItems$.value,
      contW: cmp.itemWidthCalculated.scrollContainerWidth$.value,
      iprSub: cmp.itemWidthCalculated.itemsPerRow$.value,
      real: cmp.itemWidthReal,
      stateIPR: cmp.itemsPerRow,
      cssVar: style.getPropertyValue('--item-width').trim(),
    };
  });
};

/** Poll until the component's itemsPerRow state settles (RO processed). */
const waitForStateIPR = (expected: number) => {
  const poll = (): Cypress.Chainable<StretchState> =>
    readStretchState().then((s) => {
      if (s.stateIPR === expected) {
        return cy.wrap(s, { log: false });
      }
      return cy.wait(80, { log: false }).then(poll);
    }) as unknown as Cypress.Chainable<StretchState>;
  return poll();
};

/**
 * Reproduction: with stretchItems enabled, items must fill the container
 * width exactly (stretchedWidth = floor(usableWidth / itemsPerRow)) after
 * every window resize — no fallback to min width, no wrapping rows.
 */
describe('Virtual Scroll - Stretch items across window resizes', () => {
  const minItemWidth = 300;

  const expectStretchedToFullWidth = (minW: number = minItemWidth) => {
    // Retryable: the width pipeline settles asynchronously after load and
    // after each resize (ResizeObserver + setTimeout width application).
    cy.get('ngx-responsive-virtual-scroll:first', { timeout: 15000 }).should(
      ($el) => {
        const container = $el[0];
        const style = getComputedStyle(container);
        const usable =
          container.clientWidth -
          (parseFloat(style.paddingLeft) || 0) -
          (parseFloat(style.paddingRight) || 0);
        const itemsPerRow = Math.max(1, Math.floor(usable / minW));
        const expectedWidth = Math.floor(usable / itemsPerRow);

        const varWidth = style.getPropertyValue('--item-width').trim();
        expect(varWidth, '--item-width').to.eq(`${expectedWidth}px`);

        const items = Array.from(
          container.querySelectorAll<HTMLElement>(
            '.ngx-scroll-view-grid-item'
          )
        );
        expect(items.length, 'rendered items').to.be.greaterThan(0);
        const containerTop = container.getBoundingClientRect().top;
        const rows: Record<number, number> = {};
        for (const item of items) {
          expect(item.offsetWidth, 'item width').to.eq(expectedWidth);
          const y = Math.round(
            item.getBoundingClientRect().top - containerTop
          );
          rows[y] = (rows[y] ?? 0) + 1;
        }

        const counts = Object.values(rows);
        // Every row except the (legitimately partial) last rendered row
        // must hold exactly itemsPerRow stretched items — no wrapping.
        counts.slice(0, -1).forEach((count) => {
          expect(count, 'items in full row').to.eq(itemsPerRow);
        });
      }
    );
  };

  const expectMinWidth = () => {
    cy.get('ngx-responsive-virtual-scroll:first', { timeout: 15000 }).should(
      ($el) => {
        expect(
          getComputedStyle($el[0]).getPropertyValue('--item-width').trim(),
          '--item-width with stretch off'
        ).to.eq(`${minItemWidth}px`);
      }
    );
  };

  const resizeSweep = (minW: number = minItemWidth) => {
    for (const width of [1200, 1000, 800, 700, 900, 1100, 1350]) {
      cy.viewport(width, 800);
      expectStretchedToFullWidth(minW);
    }
  };

  it('keeps items stretched to full width while resizing the window', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: minItemWidth,
      rowHeight: 280,
      stretchItems: true,
      isGrid: true,
    });
    expectStretchedToFullWidth();
    resizeSweep();
  });

  it('stays stretched with zero paddings', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: minItemWidth,
      rowHeight: 280,
      itemPadding: 0,
      scrollViewPadding: 0,
      stretchItems: true,
      isGrid: true,
    });
    expectStretchedToFullWidth();
    resizeSweep();
  });

  it('stays stretched with large paddings', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: minItemWidth,
      rowHeight: 280,
      itemPadding: 60,
      scrollViewPadding: 80,
      stretchItems: true,
      isGrid: true,
    });
    expectStretchedToFullWidth();
    resizeSweep();
  });

  it('stays stretched with odd minimum item width', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: 173,
      rowHeight: 137,
      stretchItems: true,
      isGrid: true,
    });
    expectStretchedToFullWidth(173);
    resizeSweep(173);
  });

  it('stays stretched with async rendering', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: minItemWidth,
      rowHeight: 280,
      stretchItems: true,
      isGrid: true,
      asyncRendering: true,
    });
    expectStretchedToFullWidth();
    resizeSweep();
  });

  it('stays stretched after a rapid resize drag', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: minItemWidth,
      rowHeight: 280,
      stretchItems: true,
      isGrid: true,
    });
    expectStretchedToFullWidth();
    // Simulate a manual drag: many resizes with no settle in between.
    for (let width = 1400; width >= 500; width -= 50) {
      cy.viewport(width, 800);
    }
    for (let width = 500; width <= 1400; width += 50) {
      cy.viewport(width, 800);
    }
    expectStretchedToFullWidth();
  });

  it('restretches correctly when stretch is toggled without recreation', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: minItemWidth,
      rowHeight: 280,
      stretchItems: true,
      isGrid: true,
    });
    expectStretchedToFullWidth();

    // Toggle stretch directly on the component instance, bypassing the
    // demo state so the component is NOT destroyed/recreated (pure library
    // input toggle). Resize while stretch is off, then toggle back on.
    setStretchDirect(false);
    expectMinWidth();
    cy.viewport(1000, 800);
    // Wait until the resize's ResizeObserver emission was processed while
    // stretch is off (state itemsPerRow flips 3 -> 2 with no scrolling).
    // The width tap runs upstream of that recalculation, so toggling
    // stretch back on afterwards must use the post-resize width — this
    // ordering used to strand a stale width and break stretching.
    waitForStateIPR(2);
    setStretchDirect(true);
    expectStretchedToFullWidth();
  });

  it('stretches after enabling stretch at runtime, across resizes', () => {
    cy.viewport(1400, 800);
    visitState({
      numberOfItems: 500,
      itemWidth: minItemWidth,
      rowHeight: 280,
      stretchItems: false,
      isGrid: true,
    });
    // Enable stretch like a user would via the settings panel. This
    // destroys and recreates the virtual scroll component.
    cy.contains('span', 'Stretch items to full width')
      .parent()
      .find('input[type="checkbox"]')
      .check();
    expectStretchedToFullWidth();
    resizeSweep();
  });
});
