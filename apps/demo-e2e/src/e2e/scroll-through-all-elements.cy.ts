import { getItemIndexValueAtPosition, visitState } from '../support/app.po';

describe('Virtual Scroll - Scrolled Through all items E2E Tests', () => {
  const rowHeight = 400;
  const numColumns = 4;
  const numItems = 210;
  const itemPadding = 24;

  const rowShouldHaveAscendingValuesFrom = (
    firstValueInRow: number,
    rowIndex: number
  ) => {
    let itemIndex = firstValueInRow;
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      cy.log(`currentAbsoluteItemIndex: ${itemIndex}`);

      getItemIndexValueAtPosition(colIndex, rowIndex).should('eq', itemIndex);
      itemIndex++;
    }
  };

  it('renders 200 items in a grid with 3 per row and displays the last cards when scrolled to the bottom', () => {
    cy.viewport(1100, 820);

    visitState({
      numberOfItems: numItems,
      itemWidth: 240,
      rowHeight: rowHeight,
      stretchItems: true,
      itemPadding: itemPadding,
    });

    rowShouldHaveAscendingValuesFrom(0, 0);
    rowShouldHaveAscendingValuesFrom(4, 1);
    rowShouldHaveAscendingValuesFrom(8, 2);
  });
});
