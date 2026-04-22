import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'nx run demo:serve:development -- --port 4300',
        production: 'nx run demo:serve:production -- --port 4300',
      },
      ciWebServerCommand: 'nx run demo:serve-static',
    }),
    baseUrl: 'http://localhost:4300',
    // Please ensure you use `cy.origin()` when navigating between domains and remove this option.
    // See https://docs.cypress.io/app/references/migration-guide#Changes-to-cyorigin
    injectDocumentDomain: true,
  },
});
