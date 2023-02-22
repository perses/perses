# Storybook

This package is used to generate documentation for Perses UI components using [Storybook](https://storybook.js.org/).

## Getting started

- Run storybook in development mode: `npm run storybook`

## Creating stories

### Where should stories live?

Stories **SHOULD** live in the first entry in the list below that matches their purpose:

- Stories that are tightly coupled with a component should be colocated with the component code in the associated package (e.g. the stories for the `LineChart` component live at `ui/components/src/LineChart/LineChart.stories.tsx` as a sibling of `LineChart.tsx`).
- Package-specific stories should live in the `src/stories` directory for that package.
- Stories that provide project-wide documentation or involve components from multiple packages should live in the storybook package (`ui/storybook/stories`).

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

Stories should import from source code (NOT compiled code) because this enables us to automatically generate documentation tables for component props from types. Stories should import from the top level export for that package to help ensure the component was properly exported for consumption from the package when published. The same versions of code need to be used across the storybook to avoid issues when using `context` and singletons.

The project enforces the above contraints using the following tooling:

- **aliases to source for all @perses-dev packages in storybook's webpack config** - E.g. `@perses-dev/components` will alias to `ui/components/src` instead of pointing to `ui/components/dist`). This makes it easy to import from packages in stories in a consistent way while pointing at the top level `src` export. It also ensures that components referenced indirectly in stories (usually a child of the component used directly in the story) point to source code to avoid accidentally mixing and matching source and compiled code, which can cause issues when using `context` and singletons.
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

## Known issues

Below are some known issues related to storybook that developers should be aware of.

### Related to our setup/usage

These issues are related to our specific use of Storybook.

- Stories reference TypeScript source code (instead of compiled code) from packages to be able to autogenerate documentation from component prop types.
  - The webpack configuration for storybook includes aliases for internal packages to ensure consistent reference of source code throughout TypeScript. Without this, issues can occur with mixing and matching `src` and `dist` versions of package context/providers.
- Storybook compiles code using Webpack and packages compile code using SWC. This is not currently causing any issues, but could lead to inconsistencies in the future.
  - There is a Storybook plugin for building using SWC, but it is not a core Storybook plugin, and it broke several Storybook features when we attempted to use it.
- The grid and background color toolbar items do not play nicely together because of some customizations we're doing to get the backgrounds to use our theme. For now, disabling the grid feature until we have time to dig into this more. Other storybook addons (e.g. measure, outline) and browser extensions provide similar behavior, so this is not a priority to fix.

### In Storybook

These issues are related to generic Storybook issues that do not appear to be specific to our setup.

- `Warning: ReactDOM.render is no longer supported in React 18` error in console. It seems like a known issue based on discussion [in this issue](https://github.com/storybookjs/storybook/issues/17831) and some other issues on the Storybook repository. Hoping this will get resolved eventually in a future update, but can be ignored for now.
- `You are loading @emotion/react when it is already loaded. Running multiple instances may cause problems.` warning in console. This might be a combination of our setup (MUI docs use emotion) and some storybook issues. It's not causing any immediate issues, but we should keep an eye on it. It looks like this might be fixed in Storybook 7.
- Some documentation in the storybook dark mode theme is hard to read (e.g. links look bad). The theme is customizable, so we can fix this when we have time.
