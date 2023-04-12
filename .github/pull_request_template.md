<!--
  See the contributing guide for detailed guidance about contributing.
  https://github.com/perses/perses/blob/main/CONTRIBUTING.md
-->

# Checklist

- [ ] Pull request has a descriptive title and context useful to a reviewer.
- [ ] Pull request title follows the `[<catalog_entry>] <commit message>` naming convention using one of the following `catalog_entry` values: `FEATURE`, `ENHANCEMENT`, `BUGFIX`, `BREAKINGCHANGE`, `IGNORE`.
- [ ] All commits have [DCO signoffs](https://github.com/probot/dco#how-it-works).

## UI Changes

- [ ] Changes that impact the UI include screenshots and/or screencasts of the relevant changes.
- [ ] Code follows the [UI guidelines](https://github.com/perses/perses/blob/main/ui/ui-guidelines.md).
- [ ] Visual tests are stable and unlikely to be flaky. See [Storybook](https://github.com/perses/perses/tree/main/ui/storybook#visual-tests) and [e2e](https://github.com/perses/perses/tree/main/ui/e2e#visual-tests) docs for more details. Common issues include:
  - Is the data inconsistent? You need to mock API requests.
  - Does the time change? You need to use consistent time values or mock time utilities.
  - Does it have loading states? You need to wait for loading to complete.
