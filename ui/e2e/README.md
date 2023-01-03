# End-to-end tests

This package contains end-to-end tests for Perses written using [https://playwright.dev/](Playwright).

TODO: fill this in with some information about how to run, write, etc. tests and the associated patterns with page objects.

## Directory structure

- `src`
  - `fixtures` - [Playwright test fixtures](https://playwright.dev/docs/test-fixtures) live here. These are useful for managing common setup and teardown patterns across many tests. See `pages` for managing common page interactions and selectors.
  - `pages` - [Page object models](https://playwright.dev/docs/pom) live here. These are classes that wrap selectors, page interactions, and other common patterns associated with a page. This helps reduce code duplication and improve test maintenance. In addition to pages, it also includes classes for large, complex page elements (e.g. panel editor) that benefit from their own wrappers.
  - `tests` - [Playwright tests](https://playwright.dev/docs/writing-tests) live here and are named following the pattern `testName.spec.ts`.
- `playwright.config.ts` - [Playwright configuration](https://playwright.dev/docs/test-configuration).

## Running tests

### Locally

The tests depend on the local development servers (backend and UI) running to test against.

- Start the backend server from the project root: `./scripts/api_backend_dev.sh`
- Change to the `ui` directory.
- Start the UI server: `npm start`
- Run the end-to-end tests from the command line: `npm run e2e`
- (Optional) Install [Playwright VS Code extension](https://playwright.dev/docs/getting-started-vscode) and run tests using it.

### In CI

Tests are automatically run in CI using the workflow configured in `ci.yml`. In this case, Playwright automatically starts up and waits for the development servers.

## Writing tests
