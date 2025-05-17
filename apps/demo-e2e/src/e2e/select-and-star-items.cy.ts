import {
  visitState,
  gridItemsShouldExistWithinIndexRange,
  scrollToVirtualScrollViewYPosition,
  selectGridItem,
  gridItemWithIndexShouldBeSelected,
  gridItemWithIndexShouldNotBeSelected,
  toggleStarWidthIndex,
  gridItemWithIndexShouldHaveActiveStar as itemShouldHaveStar,
  gridItemWithIndexShouldHaveNoStar as itemShouldHaveNoStar,
  scrollToVirtualScrollViewBottom,
  closeInspector,
  scrollToVirtualScrollViewTop,
} from '../support/app.po';

describe('Virtual Scroll - Select and star items', () => {
  it('should select a grid item and verify selection state', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 521, maxItemsPerRow: 3 });

    scrollToVirtualScrollViewYPosition(2471);
    gridItemsShouldExistWithinIndexRange(36, 47);

    const selectItemIndex = 44;
    // Select the grid item and verify selection state
    selectGridItem(selectItemIndex);
    gridItemWithIndexShouldBeSelected(selectItemIndex);
    gridItemWithIndexShouldNotBeSelected(selectItemIndex + 1);
  });

  it('should allow toggling the star state for items and persist state after scrolling', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 521, maxItemsPerRow: 3 });

    scrollToVirtualScrollViewYPosition(2471);
    gridItemsShouldExistWithinIndexRange(36, 47);

    const selectItemIndex = 44;
    toggleStarWidthIndex(selectItemIndex);
    itemShouldHaveStar(selectItemIndex);
    itemShouldHaveNoStar(selectItemIndex + 1);
    toggleStarWidthIndex(selectItemIndex + 1);
    itemShouldHaveStar(selectItemIndex + 1);
    toggleStarWidthIndex(selectItemIndex);
    itemShouldHaveNoStar(selectItemIndex);

    scrollToVirtualScrollViewBottom();
    toggleStarWidthIndex(520);
    itemShouldHaveStar(520);
    closeInspector();
    scrollToVirtualScrollViewYPosition(2475);
    itemShouldHaveStar(selectItemIndex + 1);
    itemShouldHaveNoStar(selectItemIndex);
  });

  it('should allow selecting and deselecting multiple items in sequence', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 30, maxItemsPerRow: 4 });
    scrollToVirtualScrollViewYPosition(400);
    const indices = [8, 9, 10, 11];
    indices.forEach((idx) => {
      selectGridItem(idx);
      gridItemWithIndexShouldBeSelected(idx);
    });
  
    scrollToVirtualScrollViewTop()
    selectGridItem(7);
    gridItemWithIndexShouldBeSelected(7);
  });

  it('should persist star state after scrolling away and back', () => {
    cy.viewport(1400, 660);
    visitState({ numberOfItems: 1000, maxItemsPerRow: 5 });
    const starIndex = 2;
    toggleStarWidthIndex(starIndex);
    itemShouldHaveStar(starIndex);
    scrollToVirtualScrollViewYPosition(1500);
    scrollToVirtualScrollViewTop();
    itemShouldHaveStar(starIndex);
  });

  it('should allow toggling stars on first and last items and persist after navigation', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 50, maxItemsPerRow: 2 });
    toggleStarWidthIndex(0);
    itemShouldHaveStar(0);
    scrollToVirtualScrollViewBottom();
    toggleStarWidthIndex(49);
    itemShouldHaveStar(49);
    closeInspector();
    toggleStarWidthIndex(49);
    itemShouldHaveNoStar(49);
    scrollToVirtualScrollViewTop();
    itemShouldHaveStar(0);
  });

  it('should allow selecting', () => {
    cy.viewport(1600, 660);
    visitState({ numberOfItems: 25000, maxItemsPerRow: 5 });
    const idx = 2;
    selectGridItem(idx);
    gridItemWithIndexShouldBeSelected(idx);
    toggleStarWidthIndex(idx);
    itemShouldHaveStar(idx);
    closeInspector();
    cy.viewport(300, 660);
    scrollToVirtualScrollViewYPosition(10000);
    scrollToVirtualScrollViewTop();
    itemShouldHaveStar(idx);
  });
});
