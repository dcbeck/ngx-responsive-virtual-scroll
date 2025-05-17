import {
  visitState,
  shouldHaveNumberOfColumns,
  getGridItem,
  selectGridItem,
} from '../support/app.po';

describe('Virtual Scroll - Responsive grid', () => {
  it('should update the grid layout after selecting an item', () => {
    cy.viewport(1000, 660);
    visitState({ numberOfItems: 521, maxItemsPerRow: 3 });

    getGridItem(0).should('exist');
    shouldHaveNumberOfColumns(3);
    selectGridItem(0);
    shouldHaveNumberOfColumns(2);
  });

  it('should update the number of grid columns responsively when resizing the viewport', () => {
    cy.viewport(2000, 660);
    visitState({ numberOfItems: 521, maxItemsPerRow: 10 });

    getGridItem(0).should('exist');
    shouldHaveNumberOfColumns(8);
    cy.viewport(1500, 800);
    shouldHaveNumberOfColumns(6);
    cy.viewport(1200, 400);
    shouldHaveNumberOfColumns(4);
    cy.viewport(500, 900);
    shouldHaveNumberOfColumns(2);
    cy.viewport(250, 1000);
    shouldHaveNumberOfColumns(1);
  });

  it('should keep the selected item visible after resizing the viewport', () => {
    cy.viewport(1200, 660);
    visitState({ numberOfItems: 100, maxItemsPerRow: 5 });
    selectGridItem(12);
    getGridItem(12).should('exist');
    cy.viewport(800, 660);
    getGridItem(12).should('exist');
    cy.viewport(400, 660);
    getGridItem(12).should('exist');
  });

  it('should update columns correctly when maxItemsPerRow is 1 (single column)', () => {
    cy.viewport(600, 800);
    visitState({ numberOfItems: 20, maxItemsPerRow: 1 });
    shouldHaveNumberOfColumns(1);
    selectGridItem(0);
    shouldHaveNumberOfColumns(1);
  });

  it('should update columns correctly when maxItemsPerRow is high and viewport is wide', () => {
    cy.viewport(3000, 800);
    visitState({ numberOfItems: 100, maxItemsPerRow: 20 });
    shouldHaveNumberOfColumns(13); // Adjust if your grid logic differs
    cy.viewport(1500, 800);
    shouldHaveNumberOfColumns(6);
  });

  it('should not reduce columns below 1 when viewport is very small', () => {
    cy.viewport(200, 400);
    visitState({ numberOfItems: 10, maxItemsPerRow: 3 });
    shouldHaveNumberOfColumns(1);
  });
});
