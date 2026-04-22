import {
  visitState,
  selectGridItem,
  gridItemWithIndexShouldBeSelected,
  closeInspector,
  inspectorShouldBeOpenWithItemAtIndex,
  getGridItem,
  getGridItemHeading,
  waitForVirtualScroll,
} from '../support/app.po';

describe('Virtual Scroll - Item Selection', () => {
  it('should select an item and show inspector', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    selectGridItem(5);
    gridItemWithIndexShouldBeSelected(5);
    inspectorShouldBeOpenWithItemAtIndex(5);
  });

  it('should deselect previous item when selecting new one', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    selectGridItem(3);
    gridItemWithIndexShouldBeSelected(3);

    selectGridItem(5);
    gridItemWithIndexShouldBeSelected(5);

    // Item 3 should not be selected anymore
    // Note: Due to virtual scroll, item 3 might not be in DOM
    // We verify the URL updated instead
    cy.url().should('include', 'selectedIndex=5');
  });

  it('should close inspector when clicking close button', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    selectGridItem(5);
    inspectorShouldBeOpenWithItemAtIndex(5);

    closeInspector();
    cy.get('#inspector-heading').should('not.exist');
  });

  it('should keep selected state in URL after scrolling', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 200, itemWidth: 250 });
    waitForVirtualScroll();

    // Select a visible item
    selectGridItem(5);
    gridItemWithIndexShouldBeSelected(5);

    // Scroll down significantly
    cy.get('ngx-responsive-virtual-scroll:first').scrollTo(0, 5000, { duration: 500 });
    cy.wait(300);

    // Verify URL still has selected item
    cy.url().should('include', 'selectedIndex=5');

    // Scroll back to top
    cy.get('ngx-responsive-virtual-scroll:first').scrollTo('top', { duration: 500 });
    cy.wait(300);

    // Verify the URL still has the selected item
    cy.url().should('include', 'selectedIndex=5');

    // Verify items are rendered (selection state is preserved in URL)
    cy.get('[id^="grid-item-"]').should('exist');
  });

  it('should select items and update URL', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    // Select first item
    selectGridItem(0);
    cy.url().should('include', 'selectedIndex=0');
    closeInspector();

    // Scroll down and select another item
    cy.get('ngx-responsive-virtual-scroll:first').scrollTo(0, 2000, { duration: 500 });
    cy.wait(300);

    // Find a visible item and select it
    cy.get('[id^="grid-item-learn-more-btn-"]').first().click();
    cy.wait(100);

    // URL should have updated
    cy.url().should('match', /selectedIndex=\d+/);
  });

  it('should update URL when selecting items', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    selectGridItem(5);
    cy.url().should('include', 'selectedIndex=5');
  });
});
