# Storybook

This package is used to generate documentation for Perses UI components using [Storybook](https://storybook.js.org/).

> This project currently uses the [v7 beta](https://storybook.js.org/docs/7.0/react/get-started/introduction) of Storybook. Be sure to reference the associated [v7 beta documentation](https://storybook.js.org/docs/7.0/react/get-started/introduction).

## Getting started

### Running Storybook

- Run Storybook in development mode: `npm run storybook`

### Building Storybook

- Build only: `npm run storybook:build`
- Build & serve static assets from build: `npm run storybook:serve`

## Creating stories

### Where should stories live?

Stories **SHOULD** live in the first entry in the list below that matches their purpose:

- Stories that are tightly coupled with a component should be colocated with the component code in the associated package (e.g. the stories for the `LineChart` component live at `ui/components/src/LineChart/LineChart.stories.tsx` as a sibling of `LineChart.tsx`).
- Package-specific stories (e.g. top-level "About" story describing the package, stories showing how to use multiple components in the package together) should live in the `src/stories` directory for that package.
- Stories that provide project-wide documentation or involve components from multiple packages should live in the Storybook package (`ui/storybook/stories`).

### What kind of story format should I use?

#### Components

Stories for components should use [Component Story Format (CSF)](https://storybook.js.org/docs/react/api/csf) and follow the `PascalCaseName.stories.tsx` naming scheme.

See [Writing stories in TypeScript](https://storybook.js.org/blog/writing-stories-in-typescript/) for some additional guidance on typing for stories.

#### Text-only documentation

Stories that are primarily text-based documentation (e.g. the `About` pages for each package) should be written using [MDX](https://storybook.js.org/docs/react/writing-docs/mdx) and follow the `PascalCase.stories.mdx` naming scheme.

These may include importing a few small components like the `LinkTo` component from the [Link addon](https://storybook.js.org/addons/@storybook/addon-links/) to link out to other stories.

### Importing package code

#### TLDR;

Stories should import package code by referencing the package, not by making a relative reference. Under the hood, this will reference source code (not compiled code), so we can benefit from some Storybook features like autogenerating documentation from types.

Import like this in a story:

```ts
// Import from the package. Storybook's webpack config will alias this to the
// associated source code.
import { LineChart } from '@perses-dev/components';
```

Not like this:

```ts
// Importing directly from the source file will make it easier to forget to
// export components for consumption from the main export for the package.
import { LineChart } from '.';
```

#### Long version

Stories should import from source code (NOT compiled code) because this enables us to automatically generate documentation tables for component props from types. Stories should import from the top level export for that package to help ensure the component was properly exported for consumption from the package when published. The same versions of code need to be used across the Storybook to avoid issues when using `context` and singletons.

The project enforces the above contraints using the following tooling:

- **aliases to source for all @perses-dev packages in Storybook's webpack config** - E.g. `@perses-dev/components` will alias to `ui/components/src` instead of pointing to `ui/components/dist`). This makes it easy to import from packages in stories in a consistent way while pointing at the top level `src` export. It also ensures that components referenced indirectly in stories (usually a child of the component used directly in the story) point to source code to avoid accidentally mixing and matching source and compiled code, which can cause issues when using `context` and singletons.
- **alias to source for the specific @perses-dev package in package-specific tsconfig** - E.g. a story in the `@perses-dev/components` package can import from `@perses-dev/components` and have TypeScript look in `ui/components/src` for types. Without this, you would get type errors because TypeScript will expect the package to have installed itself.

## Notable addons

Below are some notable addons this project currently uses.

- [Accessibility](https://storybook.js.org/addons/@storybook/addon-a11y/) - Helpful for making components a11y.
- [Actions](https://storybook.js.org/addons/@storybook/addon-actions) - Used to display data received by event handlers.
- [Controls](https://storybook.js.org/addons/@storybook/addon-controls/) - Interact with component inputs dynamically in the Storybook UI.
- [Dark Mode](https://storybook.js.org/addons/storybook-dark-mode/) - Adds a toolbar toggle that switches between light and dark mode.
- [Docs](https://storybook.js.org/addons/@storybook/addon-docs/) - Document component usage and properties in Markdown.
- [Links](https://storybook.js.org/addons/@storybook/addon-links/) - Use to create links that navigate between stories.
- [Measure](https://storybook.js.org/addons/@storybook/addon-measure/) - Helpful for inspecting layouts by visualizing the box model.
- [Outline](https://storybook.js.org/addons/@storybook/addon-outline/) - Outline all elements with CSS to help with layout placement and alignment.
- [Storysource](https://storybook.js.org/addons/@storybook/addon-storysource/) - Used to show stories source in the addon panel
- [Viewport](https://storybook.js.org/addons/@storybook/addon-viewport/) - Allows stories to be displayed in different sizes and layouts.

We primarily use first party addons maintained by Storybook to avoid pain with upgrades and interoperability with the relatively complex Storybook ecosystem.

## Configuring Storybook

Storybook configuration lives in `src/config` and includes the following:

- `main.ts` - [Core configuration](https://storybook.js.org/docs/react/configure/overview#configure-your-storybook-project).
- `preview.ts` - [Rendering configuration](https://storybook.js.org/docs/react/configure/overview#configure-story-rendering)
- `decorators` - Directory for global [decorators](https://storybook.js.org/docs/react/writing-stories/decorators) that wrap all stories.
  - `WithBackground` - Decorator that allows toggling between different background colors from the projects theme. It relies on significant prior art from the [backgrounds addon](https://storybook.js.org/addons/@storybook/addon-backgrounds/), which we cannot easily use here because it requires the background colors to be hardcoded (instead of dynamic based on being in dark/light mode).
  - `WithThemes` - Decorator that wraps all stories with theming for MUI and echarts.
- `DocsContainer` - Custom container for the docs addon to make it work with the dark mode addon.

Storybook is currently configured to build with [Webpack 5](https://storybook.js.org/docs/react/builders/webpack#webpack-5).

## Visual tests

This project uses a free open source account from [Happo](https://happo.io/) for our visual testing. Visual tests generated for storybook use `happo-plugin-storybook`. See the `e2e` package for information about visual tests generated using that tooling.

- Use visual tests for use cases where a different type of test will not provide adequate coverage (e.g. canvas-based visualizations, styling).
- Only create visual tests that can reliably be reproduced. Flaky tests are often worse than no tests at all because they lead to toil and reduce trust in the overall test set. Some examples of things that can lead to unreliable tests are:
  - Inconsistent data sources. Consider using consistent mock data to avoid this. See `mockQueryRangeRequests` in `DashboardPage` for an example. Make sure to reset any mocked routes using `unroute` when the test is finished.
  - Time zones.
  - Current time.
  - Dynamic content. Wait for everything to load before taking a snapshot.
  - If individual elements are known to cause inconsistencies, consider adding the `data-happo-hide` attribute. This will render the element invisible in the screenshot.
- In most cases, visual tests should be generated for both light and dark themes.

### Happo issues

We have some customization over the default `happo-storybook` configuration related to some differences in our codebase.

- We explicitly build storybook before running happo and have `usePrebuiltPackage` set to `true`. This is needed because the name of the executable for storybook changed in v7 and happo hasn't updated to account for it yet.
- We need to set explicitly set the `HAPPO_COMMAND` env var when calling `happo-ci-github-actions` to run in CI. Their default script looks in the wrong location because it doesn't fully account for the complexity of a monorepo setup like ours.
- We use a modified version of the [`register.js`](https://github.com/happo/happo-plugin-storybook/blob/master/src/register.js) file provided by `happo-plugin-storybook`. This enables us to support Storybook v7 and to automatically grab light and dark mode screenshots without creating special stories for them.

## Known issues

Below are some known issues related to Storybook that developers should be aware of.

### Related to our setup/usage

These issues are related to our specific use of Storybook.

- Stories reference TypeScript source code (instead of compiled code) from packages to be able to autogenerate documentation from component prop types.
  - The webpack configuration for Storybook includes aliases for internal packages to ensure consistent reference of source code throughout TypeScript. Without this, issues can occur with mixing and matching `src` and `dist` versions of package context/providers.
- Storybook compiles code using Webpack and packages compile code using SWC. This is not currently causing any issues, but could lead to inconsistencies in the future.
  - There is a Storybook plugin for building using SWC, but it is not a core Storybook plugin, and it broke several Storybook features when we attempted to use it.
- The grid and background color toolbar items do not play nicely together because of some customizations we're doing to get the backgrounds to use our theme. For now, disabling the grid feature until we have time to dig into this more. Other Storybook addons (e.g. measure, outline) and browser extensions provide similar behavior, so this is not a priority to fix.

### In Storybook

These issues are related to generic Storybook issues that do not appear to be specific to our setup.

- `Warning: ReactDOM.render is no longer supported in React 18` error in console. It seems like a known issue based on discussion [in this issue](https://github.com/storybookjs/storybook/issues/17831) and some other issues on the Storybook repository. Hoping this will get resolved eventually in a future update, but can be ignored for now.
- `Warning: Attempted to synchronously unmount a root while React was already rendering.` - [see issue](https://github.com/storybookjs/storybook/issues/20731)
