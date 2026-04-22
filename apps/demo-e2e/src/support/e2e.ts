// Support file for Cypress e2e tests
// Automatically loaded before test files

import './commands';
import './types';

// Global test setup
beforeEach(() => {
  // Clear local storage between tests
  cy.clearLocalStorage();
});
