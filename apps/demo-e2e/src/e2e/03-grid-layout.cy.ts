import {
  visitState,
  expectItemsAtGridPositions,
  expectViewportCovered,
  getItemsPerRow,
  getRenderedIndices,
  getScrollMetrics,
  shouldHaveNumberOfColumns,
  scrollToY,
  waitForStableRender,
} from '../support/app.po';

describe('Virtual Scroll - Grid Layout & Responsiveness', () => {
  const ITEM_WIDTH = 250;
  const ROW_HEIGHT = 280;

  const expectedItemsPerRow = () =>
    getScrollMetrics().then((m) =>
      Math.max(1, Math.floor((m.clientWidth - m.paddingLeft - m.paddingRight) / ITEM_WIDTH))
    );

  it('computes items per row from item width and container width', () => {
    cy.viewport(1600, 900);
    visitState({ numberOfItems: 500, itemWidth: ITEM_WIDTH, rowHeight: ROW_HEIGHT });
    getItemsPerRow().then((actual) =>
      expectedItemsPerRow().should('eq', actual)
    );
    expectItemsAtGridPositions(ROW_HEIGHT);
  });

  it('adapts columns on viewport resize and keeps geometry intact', () => {
    cy.viewport(1600, 900);
    visitState({ numberOfItems: 800, itemWidth: ITEM_WIDTH, rowHeight: ROW_HEIGHT });

    cy.viewport(1000, 700);
    waitForStableRender();
    getItemsPerRow().then((actual) =>
      expectedItemsPerRow().should('eq', actual)
    );
    expectItemsAtGridPositions(ROW_HEIGHT);
    expectViewportCovered();
  });

  it('collapses to a single column at very small viewports', () => {
    cy.viewport(500, 800);
    visitState({ numberOfItems: 100, itemWidth: ITEM_WIDTH, rowHeight: ROW_HEIGHT });
    shouldHaveNumberOfColumns(1);
    expectItemsAtGridPositions(ROW_HEIGHT);
    expectViewportCovered();
  });

  it('keeps geometry correct after the inspector opens and closes', () => {
    cy.viewport(1400, 800);
    visitState({ numberOfItems: 500, itemWidth: ITEM_WIDTH, rowHeight: ROW_HEIGHT });
    getItemsPerRow().then((before) => {
      cy.get('#grid-item-learn-more-btn-1').click();
      waitForStableRender();
      getItemsPerRow().then((open) => {
        expect(open, 'columns with inspector open').to.be.at.most(before);
        cy.get('#inspector-close-button').click();
        waitForStableRender();
        getItemsPerRow().should('eq', before);
      });
    });
    expectItemsAtGridPositions(ROW_HEIGHT);
  });

  it('keeps the focused item in view on resize (autoScrollOnResize)', () => {
    cy.viewport(1400, 700);
    visitState({ numberOfItems: 800, itemWidth: ITEM_WIDTH, rowHeight: ROW_HEIGHT });
    scrollToY(11200); // ~row 40

    getRenderedIndices().then((indices) => {
      const target = indices[Math.floor(indices.length / 2)];
      cy.get(`#grid-item-learn-more-btn-${target}`).click();
      cy.get(`#grid-item-${target}`).should('have.attr', 'data-selected', 'true');

      cy.viewport(700, 700);
      waitForStableRender();

      cy.get(`#grid-item-${target}`)
        .should('exist')
        .then(($el) => {
          const container = $el[0].closest('ngx-responsive-virtual-scroll')!;
          const itemRect = $el[0].getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          expect(itemRect.top, 'focused item top inside viewport').to.be.at
            .least(containerRect.top - 2);
          expect(itemRect.bottom, 'focused item bottom inside viewport').to.be
            .at.most(containerRect.bottom + 2);
        });
      expectItemsAtGridPositions(ROW_HEIGHT);
    });
  });

  it('stretchItems widens items to fill the row without changing the layout', () => {
    cy.viewport(1200, 700);
    visitState({
      numberOfItems: 300,
      itemWidth: ITEM_WIDTH,
      rowHeight: ROW_HEIGHT,
      stretchItems: true,
    });

    getItemsPerRow().then((ipr) => {
      expectedItemsPerRow().should('eq', ipr);
      cy.document({ log: false }).then((doc) => {
        const container = doc.querySelector(
          'ngx-responsive-virtual-scroll'
        ) as HTMLElement;
        const style = getComputedStyle(container);
        const usable = container.clientWidth -
          (parseFloat(style.paddingLeft) || 0) -
          (parseFloat(style.paddingRight) || 0);
        const firstRowWidth = Array.from(
          doc.querySelectorAll<HTMLElement>('[data-vs-index]')
        )
          .filter((el) => {
            const containerTop = container.getBoundingClientRect().top;
            return (
              Math.round(
                el.getBoundingClientRect().top - containerTop
              ) ===
              Math.round(
                doc.querySelector<HTMLElement>('[data-vs-index]')!
                  .getBoundingClientRect()
                  .top - containerTop
              )
            );
          })
          .reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
        // Stretched items fill (almost) the whole row but never overflow.
        expect(firstRowWidth).to.be.at.most(usable + 1);
        expect(usable - firstRowWidth, 'row filled by stretched items').to.be
          .at.most(ipr + 1);
      });
    });
    expectItemsAtGridPositions(ROW_HEIGHT);
    expectViewportCovered();
  });

  it('tags rendered wrappers with the grid item class', () => {
    cy.viewport(1200, 700);
    visitState({ numberOfItems: 100, itemWidth: ITEM_WIDTH, rowHeight: ROW_HEIGHT });
    cy.get('[data-vs-index]')
      .first()
      .should('have.class', 'ngx-scroll-view-grid-item')
      .and('not.have.class', 'ngx-scroll-view-list-item');
  });
});
