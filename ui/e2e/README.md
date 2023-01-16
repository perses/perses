# End-to-end tests

This package contains end-to-end tests for Perses written using [Playwright](https://playwright.dev/).

## Directory structure

- `src`
  - `config` - [Playwright configurations](https://playwright.dev/docs/test-configuration) live here.
    - `base.playwright.config.ts` - Base configuration with common settings.
    - `ci.playwright.config.ts` - Configuration used when running in continuous integration.
    - `local.playwright.config.ts` - Configuration used when running in local development.
  - `fixtures` - [Playwright test fixtures](https://playwright.dev/docs/test-fixtures) live here. These are useful for managing common setup and teardown patterns across many tests. See `pages` for managing common page interactions and selectors.
  - `pages` - [Page object models](https://playwright.dev/docs/pom) live here. These are classes that wrap selectors, page interactions, and other common patterns associated with a page. This helps reduce code duplication and improve test maintenance. In addition to pages, it also includes classes for large, complex page elements (e.g. panel editor) that benefit from their own wrappers.
  - `tests` - [Playwright tests](https://playwright.dev/docs/writing-tests) live here and are named following the pattern `testName.spec.ts`.
- `playwright.config.ts` - [Playwright configuration](https://playwright.dev/docs/test-configuration).

## Running tests

### Locally

Tests are run during local development using the configuration in `local.playwright.config.ts`. The tests depend on the local development servers (backend and UI) to test against.

- Start the backend server from the project root: `./scripts/api_backend_dev.sh`
- Change to the `ui` directory.
- Start the UI server: `npm start`
- Run the end-to-end tests from the command line: `npm run e2e`
- (Optional) Run the end-to-end tests in debug mode to walk through a test step by step to debug issues: `npm run e2e:debug`.
- (Optional) Install [Playwright VS Code extension](https://playwright.dev/docs/getting-started-vscode). This extension has a lot of helpful tools for running tests, debugging, and creating selectors. Select `local.playwright.config.ts` as the profile to use when running locally.

### In CI

Tests are automatically run in CI using the workflow configured in `e2e.yml` with the configuration in `ci.playwright.config.ts`. In this case, Playwright automatically starts up and waits for the development servers.

## Writing tests

Check out [Playwright's documentation](https://playwright.dev/docs/writing-tests) for general guidance on writing tests.

### Test data

- The `testing` project in `dev/data/project.json` and associated dashboards in `dev/data/dashboard.json` should be used for end-to-end tests.
  - Give dashboards names that match the tests they are associated with for ease of debugging and maintenance.
  - Create separate dashboards for tests that mutate the dashboard to ensure that tests can be run in parallel.
- The project does not currently have a data source that can be used to test consistent rendering in plugins (e.g. a line chart with time series data). Therefore, you should not write tests for this level of detail because they will be inherently flaky.

### Guidelines

- Tests live in `ui/e2e/src/tests` and follow the `testName.spec.ts` naming scheme.
- Tests should be able to run in parallel. Do not write tests that depend on specific order.
- Tests should not be flaky! Flaky tests are frustrating, waste time, and lead to decreased trust in the entire test suite. Ask for help if you are having trouble writing a non-flaky test for specific functionality.
- Use [Page Object Models](https://playwright.dev/docs/pom) to reduce code duplication and improve test maintenance.
- Use the [recommended locators](https://playwright.dev/docs/locators#quick-guide) (Playwright's term for element selectors), when possible. These patterns are very similar to React Testing Library, which is used for the project's Jest tests.
- Use unique names for panel groups and panels for ease of writing tests.
- Recommend using using`toBeCloseTo` when asserting on inexact pixel values to allow a margin of error associated with padding/margins/etc. to avoid flaky tests. Note that the precision (second argument) is calculated as `Math.pow(10, -precision) / 2` (e.g. precision 1 will allow for a difference of 0.05).

## Troubleshooting

### Tests failed in CI (GitHub Actions)

- Go to the failing action in GitHub.
- Follow the Playwright instructions for [viewing test logs](https://playwright.dev/docs/ci-intro#viewing-test-logs) and [viewing the html report](https://playwright.dev/docs/ci-intro#html-report).
