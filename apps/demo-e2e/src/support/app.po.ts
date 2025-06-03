import { getStateUrl } from './getStateUrl';

export const getGreeting = () => cy.get('h1');

export const visitState = (options?: {
  selectedIndex?: number;
  numberOfItems?: number;
  itemWidth?: number;
  rowHeight?: number;
  itemPadding?: number;
  scrollViewPadding?: number;
  stretchItems?: boolean;
  isGrid?: boolean;
}) => {
  const numItems = options?.numberOfItems || 500;
  cy.visit(
    getStateUrl({
      selectedIndex: options?.selectedIndex,
      numberOfItems: numItems,

      itemWidth: options?.itemWidth || 200,
      rowHeight: options?.rowHeight || 200,
      itemPadding: options?.itemPadding || 24,
      scrollViewPadding: options?.scrollViewPadding || 24,
      stretchItems:
        options?.stretchItems === undefined ? false : options.stretchItems,
      isGrid: options?.isGrid === undefined ? true : options.stretchItems,
    })
  );

  if (numItems > 0) {
    cy.get('#grid-item-learn-more-btn-0').contains('Learn More');
  }

  cy.get('ngx-responsive-virtual-scroll').then(() => {
    if (Cypress.$('input').length !== 0) {
      cy.get('#quantity').should('have.value', `${numItems}`);
    }
  });
};

export const scrollToVirtualScrollViewBottom = () =>
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo('bottom');

export const scrollToVirtualScrollViewTop = () =>
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo('top');

export const scrollToVirtualScrollViewYPosition = (yPosition: number) =>
  cy.get('ngx-responsive-virtual-scroll:first').scrollTo(0, yPosition);

export const getGridItemHeading = (index: number) => {
  return cy.get('#grid-item-heading-' + index);
};

export const gridItemWithIndexShouldBeSelected = (index: number) => {
  getGridItem(index).invoke('attr', 'data-selected').should('eq', 'true');
};

export const gridItemWithIndexShouldNotBeSelected = (index: number) => {
  getGridItem(index).invoke('attr', 'data-selected').should('eq', 'false');
};

export const getGridItem = (index: number) => {
  return cy.get('#grid-item-' + index);
};

export const selectGridItem = (index: number) => {
  return cy.get('#grid-item-learn-more-btn-' + index).click();
};

export const getFirstRowItems = () => {
  return cy.get('.ngx-scroll-view-grid-item').then(($items) => {
    const itemsArray = Cypress.$.makeArray($items);
    if (itemsArray.length === 0) return;
    const firstY = itemsArray[0].getBoundingClientRect().top;
    const sameRowItems = itemsArray.filter(
      (el) => el.getBoundingClientRect().top === firstY
    );
    // Wrap the filtered elements as a Cypress chainable
    cy.wrap(sameRowItems);
  });
};

export const getNthRowItems = (rowIndex: number) => {
  return cy.get('.ngx-scroll-view-grid-item').then(($items) => {
    const itemsArray = Cypress.$.makeArray($items);
    if (itemsArray.length === 0) return;
    // Get all unique Y positions (rows)
    const yPositions = Array.from(
      new Set(itemsArray.map((el) => el.getBoundingClientRect().top))
    ).sort((a, b) => a - b);
    if (rowIndex < 0 || rowIndex >= yPositions.length) return;
    const targetY = yPositions[rowIndex];
    const rowItems = itemsArray.filter(
      (el) => el.getBoundingClientRect().top === targetY
    );
    cy.wrap(rowItems);
  });
};

export const shouldHaveNumberOfColumns = (cols: number) => {
  getFirstRowItems().should('have.length', cols);
};

export const getNumberOfVirtualRows = () => {
  return cy.get('.ngx-scroll-view-grid-item').then(($items) => {
    const itemsArray = Cypress.$.makeArray($items);

    const yValueSet = new Set<number>();

    for (const item of itemsArray) {
      yValueSet.add(item.getBoundingClientRect().top);
    }

    return yValueSet.size;
  });
};

export const getItemIndexValueAtPosition = (
  colIndex: number,
  rowIndex: number
) => {
  return getItemAtPosition(colIndex, rowIndex).then((item) => {
    const firstId = item.attr('id');
    if (firstId === undefined) return 0;
    const value = firstId.replace('grid-item-', '');
    const index = parseInt(value);
    if (Number.isNaN(index)) {
      throw new Error('could not parse index of value');
    }
    return index;
  });
};

export const getItemAtPosition = (colIndex: number, rowIndex: number) => {
  cy.log(`get items at ${colIndex}, ${rowIndex}`);
  return getNthRowItems(rowIndex).find('demo-grid-item').eq(colIndex);
};


export const gridItemsShouldExistWithinIndexRange = (
  fromIndex: number,
  toIndex: number
) => {
  for (let index = fromIndex; index < toIndex; index++) {
    getGridItemHeading(index)
      .should('exist')
      .contains('Card ' + index);
  }
  for (let a = 20; a > 1; a--) {
    getGridItemHeading(toIndex + a).should('not.exist');
    getGridItemHeading(fromIndex - a).should('not.exist');
  }
};

export const closeInspector = () => {
  cy.get('#inspector-close-button').click();
};

export const inspectorShouldBeOpenWithItemAtIndex = (index: number) => {
  cy.get('#inspector-heading').contains(index);
};

export const toggleStarWidthIndex = (index: number) => {
  selectGridItem(index);
  gridItemWithIndexShouldBeSelected(index);
  inspectorShouldBeOpenWithItemAtIndex(index);
  cy.get('#inspector-star-button').click();
};

export const gridItemWithIndexShouldHaveActiveStar = (index: number) => {
  cy.get('#grid-item-star-' + index)
    .invoke('attr', 'data-starred')
    .should('eq', 'true');
};

export const gridItemWithIndexShouldHaveNoStar = (index: number) => {
  cy.get('#grid-item-star-' + index)
    .invoke('attr', 'data-starred')
    .should('eq', 'false');
};
