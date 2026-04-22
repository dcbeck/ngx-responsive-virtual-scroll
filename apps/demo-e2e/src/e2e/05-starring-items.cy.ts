import {
  visitState,
  toggleStarWithIndex,
  gridItemWithIndexShouldHaveActiveStar,
  gridItemWithIndexShouldHaveNoStar,
  closeInspector,
  scrollToVirtualScrollViewYPosition,
  scrollToVirtualScrollViewBottom,
  scrollToVirtualScrollViewTop,
  waitForVirtualScroll,
} from '../support/app.po';

describe('Virtual Scroll - Starring/Favoriting Items', () => {
  it('should toggle star state on an item', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    // Initially no star
    gridItemWithIndexShouldHaveNoStar(5);

    // Toggle star on
    toggleStarWithIndex(5);
    closeInspector();
    gridItemWithIndexShouldHaveActiveStar(5);

    // Toggle star off
    toggleStarWithIndex(5);
    closeInspector();
    gridItemWithIndexShouldHaveNoStar(5);
  });

  it('should persist star state after scrolling away and back', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 300, itemWidth: 250 });
    waitForVirtualScroll();

    // Star an item
    toggleStarWithIndex(5);
    closeInspector();
    gridItemWithIndexShouldHaveActiveStar(5);

    // Scroll away and back
    scrollToVirtualScrollViewYPosition(8000);
    cy.wait(300);

    scrollToVirtualScrollViewTop();
    cy.wait(300);

    // Star should still be there
    gridItemWithIndexShouldHaveActiveStar(5);
  });

  it('should allow starring multiple items in view', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    // Star a few items that are initially visible
    const indices = [0, 1, 2];

    indices.forEach((idx) => {
      toggleStarWithIndex(idx);
      closeInspector();
    });

    // All should have stars
    indices.forEach((idx) => {
      gridItemWithIndexShouldHaveActiveStar(idx);
    });
  });

  it('should allow starring first and last items', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 50, itemWidth: 250 });
    waitForVirtualScroll();

    // Star first item
    toggleStarWithIndex(0);
    closeInspector();
    gridItemWithIndexShouldHaveActiveStar(0);

    // Star last item (scroll to bottom first)
    scrollToVirtualScrollViewBottom();
    cy.wait(300);

    // Last item should be visible
    toggleStarWithIndex(49);
    closeInspector();
    gridItemWithIndexShouldHaveActiveStar(49);

    // Verify first item still has star after scrolling back
    scrollToVirtualScrollViewTop();
    cy.wait(300);
    gridItemWithIndexShouldHaveActiveStar(0);
  });

  it('should allow un-starring an item', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 100, itemWidth: 250 });
    waitForVirtualScroll();

    // Star and then un-star
    toggleStarWithIndex(5);
    closeInspector();
    gridItemWithIndexShouldHaveActiveStar(5);

    toggleStarWithIndex(5);
    closeInspector();
    gridItemWithIndexShouldHaveNoStar(5);
  });
});
