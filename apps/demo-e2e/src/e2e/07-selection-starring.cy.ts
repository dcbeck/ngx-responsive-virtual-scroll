import {
  visitState,
  closeInspector,
  gridItemWithIndexShouldBeSelected,
  gridItemWithIndexShouldHaveActiveStar,
  gridItemWithIndexShouldHaveNoStar,
  inspectorShouldBeClosed,
  inspectorShouldBeOpenWithItemAtIndex,
  selectGridItem,
  getItemsPerRow,
  getRenderedIndices,
  scrollToTop,
  scrollToY,
  waitForStableRender,
} from '../support/app.po';

const ROW_HEIGHT = 280;

describe('Virtual Scroll - Selection & Starring', () => {
  const setup = () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 500, itemWidth: 250, rowHeight: ROW_HEIGHT });
  };

  it('selects an item and shows it in the inspector', () => {
    setup();
    selectGridItem(3);
    inspectorShouldBeOpenWithItemAtIndex(3);
    gridItemWithIndexShouldBeSelected(3);
    cy.url().should('include', 'selectedIndex=3');
  });

  it('moves the selection when another item is picked', () => {
    setup();
    selectGridItem(3);
    selectGridItem(7);
    gridItemWithIndexShouldBeSelected(7);
    inspectorShouldBeOpenWithItemAtIndex(7);
    cy.get('#grid-item-3').should('have.attr', 'data-selected', 'false');
  });

  it('closes the inspector and clears the selection', () => {
    setup();
    selectGridItem(5);
    closeInspector();
    inspectorShouldBeClosed();
    cy.url().should('include', 'selectedIndex=-1');
  });

  it('stars an item from the inspector', () => {
    setup();
    selectGridItem(6);
    cy.get('#inspector-star-button').click();
    gridItemWithIndexShouldHaveActiveStar(6);
  });

  it('unstars a starred item', () => {
    setup();
    selectGridItem(6);
    cy.get('#inspector-star-button').click();
    gridItemWithIndexShouldHaveActiveStar(6);
    cy.get('#inspector-star-button').click();
    gridItemWithIndexShouldHaveNoStar(6);
  });

  it('keeps the star state after scrolling away and back', () => {
    setup();
    selectGridItem(4);
    cy.get('#inspector-star-button').click();
    closeInspector();
    gridItemWithIndexShouldHaveActiveStar(4);

    scrollToY(14000);
    cy.get('#grid-item-4').should('not.exist');
    scrollToTop();
    gridItemWithIndexShouldHaveActiveStar(4);
  });

  it('supports multiple starred items across long scroll distances', () => {
    setup();
    selectGridItem(2);
    cy.get('#inspector-star-button').click();
    closeInspector();

    scrollToY(22400); // ~row 80
    getRenderedIndices().then((indices) => {
      const target = indices[0]; // topmost rendered row - stable in window
      selectGridItem(target);
      waitForStableRender();
      cy.get('#inspector-star-button').click();
      waitForStableRender();

      scrollToTop();
      gridItemWithIndexShouldHaveActiveStar(2);
      cy.get(`#grid-item-star-${target}`).should('not.exist');

      scrollToTop();
      gridItemWithIndexShouldHaveActiveStar(2);
      gridItemWithIndexShouldHaveNoStar(3);
      cy.get(`#grid-item-star-${target}`).should('not.exist');

      // The inspector changes itemsPerRow, so scroll to the target's row
      // computed from the live column count instead of a fixed offset.
      getItemsPerRow().then((ipr) => {
        scrollToY(Math.floor(target / ipr) * ROW_HEIGHT);
        gridItemWithIndexShouldHaveActiveStar(target);
      });
    });
  });

  it('recycles only the starred view (trackBy semantics)', () => {
    setup();
    selectGridItem(3);
    waitForStableRender();

    cy.document({ log: false }).then((doc) => {
      [2, 3, 4].forEach((index) => {
        doc
          .querySelector(`[data-vs-index="${index}"]`)
          ?.setAttribute('data-e2e-marker', `${index}`);
      });
    });

    cy.get('#inspector-star-button').click();
    waitForStableRender();

    cy.document({ log: false }).then((doc) => {
      // Item 3 changed identity (isFavored flipped) -> view recreated.
      cy.wrap(doc.querySelector('[data-vs-index="3"]')).should(
        'not.have.attr',
        'data-e2e-marker'
      );
      // Unchanged neighbors keep their exact DOM views.
      cy.wrap(doc.querySelector('[data-vs-index="2"]')).should(
        'have.attr',
        'data-e2e-marker',
        '2'
      );
      cy.wrap(doc.querySelector('[data-vs-index="4"]')).should(
        'have.attr',
        'data-e2e-marker',
        '4'
      );
    });
  });

  it('restores the selected item via URL on reload', () => {
    cy.viewport(1200, 660);
    visitState({
      numberOfItems: 500,
      itemWidth: 250,
      rowHeight: ROW_HEIGHT,
      selectedIndex: 42,
    });
    inspectorShouldBeOpenWithItemAtIndex(42);
    // The initial render does not scroll to the selected item, so only the
    // inspector and the URL carry the restored selection.
    cy.url().should('include', 'selectedIndex=42');
  });
});
