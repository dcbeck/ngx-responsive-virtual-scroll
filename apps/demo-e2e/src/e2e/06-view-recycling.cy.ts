import {
  visitState,
  expectItemsAtGridPositions,
  expectViewportCovered,
  scrollToTop,
  scrollToY,
  waitForStableRender,
} from '../support/app.po';

/**
 * Tags the DOM node of a rendered item so tests can later tell whether the
 * exact same node was reused (view cache hit) or recreated (view destroyed).
 */
const markItem = (index: number) =>
  cy.document({ log: false }).then((doc) => {
    doc
      .querySelector(`[data-vs-index="${index}"]`)
      ?.setAttribute('data-e2e-marker', 'original');
  });

describe('Virtual Scroll - View Cache & Async Rendering', () => {
  it('reuses DOM views for cached items when scrolling back (viewCache=true)', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 400,
      itemWidth: 250,
      rowHeight: 280,
      viewCache: true,
    });
    markItem(0);
    scrollToY(5600);
    cy.get('[data-vs-index="0"]').should('not.exist');
    scrollToTop();
    cy.document({ log: false }).then((doc) => {
      cy.wrap(
        doc.querySelector('[data-vs-index="0"]')
      ).should('have.attr', 'data-e2e-marker', 'original');
    });
    expectItemsAtGridPositions(280);
  });

  it('recreates DOM views when viewCache is disabled', () => {
    cy.viewport(1200, 700);
    visitState({ numberOfItems: 400, itemWidth: 250, rowHeight: 280 });
    markItem(0);
    scrollToY(5600);
    cy.get('[data-vs-index="0"]').should('not.exist');
    scrollToTop();
    cy.document({ log: false }).then((doc) => {
      cy.wrap(
        doc.querySelector('[data-vs-index="0"]')
      ).should('not.have.attr', 'data-e2e-marker');
    });
  });

  it('evicts cached views beyond the numeric viewCache budget', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 2000,
      itemWidth: 250,
      rowHeight: 280,
      viewCache: 20,
    });
    markItem(0);
    // Each jump caches the previous window; after a few jumps the oldest
    // cached views (item 0 first) exceed the 20-view budget and are purged.
    scrollToY(14000);
    scrollToY(28000);
    scrollToY(42000);
    scrollToY(56000);
    cy.get('[data-vs-index="0"]').should('not.exist');
    scrollToTop();
    cy.document({ log: false }).then((doc) => {
      cy.wrap(
        doc.querySelector('[data-vs-index="0"]')
      ).should('not.have.attr', 'data-e2e-marker');
    });
  });

  it('shows placeholders during async rendering and resolves them', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 1000,
      itemWidth: 250,
      rowHeight: 280,
      asyncRendering: true,
    });

    cy.document({ log: false })
      .then((doc) => {
        const win = doc.defaultView as unknown as {
          e2ePlaceholdersSeen: number;
        };
        win.e2ePlaceholdersSeen = 0;
        const observer = new MutationObserver(() => {
          const count = doc.querySelectorAll(
            '[data-vs-placeholder], .virtual-placeholder'
          ).length;
          if (count > win.e2ePlaceholdersSeen) {
            win.e2ePlaceholdersSeen = count;
          }
        });
        observer.observe(doc.body, { childList: true, subtree: true });
      })
      .then(() => scrollToY(28000));

    cy.document({ log: false }).then((doc) => {
      const win = doc.defaultView as unknown as {
        e2ePlaceholdersSeen: number;
      };
      expect(
        win.e2ePlaceholdersSeen,
        'placeholders appeared during async render'
      ).to.be.greaterThan(0);
    });

    cy.get('[data-vs-placeholder], .virtual-placeholder').should('not.exist');
    expectViewportCovered();
    expectItemsAtGridPositions(280);
  });

  it('uses the custom placeholder template when provided', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 1000,
      itemWidth: 250,
      rowHeight: 280,
      asyncRendering: true,
      customPlaceholder: true,
    });

    cy.document({ log: false })
      .then((doc) => {
        const win = doc.defaultView as unknown as {
          e2eCustomPlaceholdersSeen: number;
        };
        win.e2eCustomPlaceholdersSeen = 0;
        const observer = new MutationObserver(() => {
          const count = doc.querySelectorAll('[data-vs-placeholder]').length;
          if (count > win.e2eCustomPlaceholdersSeen) {
            win.e2eCustomPlaceholdersSeen = count;
          }
        });
        observer.observe(doc.body, { childList: true, subtree: true });
      })
      .then(() => scrollToY(28000));

    cy.document({ log: false }).then((doc) => {
      const win = doc.defaultView as unknown as {
        e2eCustomPlaceholdersSeen: number;
      };
      expect(
        win.e2eCustomPlaceholdersSeen,
        'custom placeholders appeared during async render'
      ).to.be.greaterThan(0);
    });

    cy.get('[data-vs-placeholder]').should('not.exist');
    expectViewportCovered();
    expectItemsAtGridPositions(280);
  });

  it('renders correctly without placeholders after several async jumps', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 2000,
      itemWidth: 250,
      rowHeight: 280,
      asyncRendering: true,
    });
    scrollToY(8400);
    scrollToY(25200);
    scrollToY(4200);
    cy.get('[data-vs-placeholder], .virtual-placeholder').should('not.exist');
    expectViewportCovered();
    expectItemsAtGridPositions(280);
    waitForStableRender();
  });
});
