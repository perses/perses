# UI Guidelines

This document lays out the current state of how the frontend code is architected, the best
practices to follow when adding new code to the frontend, and the considerations
for the future growth of the frontend. This is meant to be a living document that
will evolve as the UI grows.

There are lots of exceptions to every rule laid out
here as UI code can vary significantly from feature to feature.

> ⚠️ You may find inconsistencies with some of the best practices in older code that was written before these guidelines were updated. New code should follow these guidelines. We are slowly working on bringing older code in line with the best practices.

## Notable tooling choices

Below is a list of notable tooling that is used throughout the Perses UI.

- Development utilities
  - Monorepo management: [turborepo](https://turbo.build/)
  - Code compiling: [swc](https://swc.rs/) (used for libraries), [webpack](https://webpack.js.org/) (used for applications)
  - Code linting/formatting: [eslint](https://eslint.org/), [prettier](https://prettier.io/)
  - Language: [TypeScript](https://www.typescriptlang.org/) (with a few exceptions for things like config files)
  - Package manager: [npm](https://docs.npmjs.com/) with [workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- Core UI and component libraries
  - UI library: [React](https://react.dev/)
  - Component library: [@mui/material](https://mui.com/material-ui/getting-started/overview/), [@mui/x-date-pickers](https://mui.com/x/react-date-pickers/getting-started/)
  - Icons: [mdi-material-ui](https://github.com/TeamWertarbyte/mdi-material-ui) (see [Material Design icons for a view of available icons](https://pictogrammers.com/library/mdi/))
  - Charts: [echarts](https://echarts.apache.org/)
  - Grid layout: [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
- Utilities
  - State management: [zustand](https://github.com/pmndrs/zustand), [immer](https://immerjs.github.io/immer/)
  - Data fetching: [react-query](https://tanstack.com/query)
  - Url query params: [use-query-params](https://github.com/pbeshai/use-query-params)
  - Dates & time: [date-fns](https://date-fns.org/), [date-fns-tz](https://github.com/marnusw/date-fns-tz)
  - Code editor: [CodeMirror](https://codemirror.net/), [@uiw/react-codemirror](https://uiwjs.github.io/react-codemirror/), [@lezer/highlight](https://github.com/lezer-parser/highlight), [@lezer/lr](https://github.com/lezer-parser/lr)
  - Markdown parser: [marked](https://marked.js.org/)
  - Math: [math.js](https://mathjs.org/)
  - XSS util: [dompurify](https://github.com/cure53/DOMPurify)
  - Other: [use-resize-observer](https://github.com/ZeeCoder/use-resize-observer), [lodash-es](https://lodash.com/), [react-error-boundary](https://github.com/bvaughn/react-error-boundary)
- Testing tools
  - Unit/integration testing for components & utilities: [Jest](https://jestjs.io/), [React Testing library](https://testing-library.com/docs/react-testing-library/intro/)
  - Browser testing: [Playwright](https://playwright.dev/)
  - Visual testing: [Happo](https://happo.io/)

### Modifying tooling

- Make sure to hold a discussion with fellow engineers before introducing a new
  dependency/library to the codebase. While third party libraries can benefit from
  community maintenance and include solid documentation, oftentimes the solution may
  have a performance impact and could introduce a new coding pattern to the codebase that may not be aligned with the rest of the code.
- For smaller libraries, a simple discussion over Matrix or a PR may suffice. Larger
  proposals to replace or introduce a new library that may impact other engineer’s
  workflows should ideally be documented within a discussion first.

## Package organization

The Perses UI can be broken down into a few different pieces that
are reflected in how the packages are organized. There is some variability from package-to-package depending on its purpose.

### Views - feature and domain specific logic

- When working on a specific section of the app like Dashboards or Projects, we
  organize all the related pieces (UI, data models, fetching) into a single folder
  with subfolders for sub sections of that feature
- This folder (`views`) often ends up mirroring the routing in the application
  with subfolders often reflecting subroutes inside particular features.

### Components - the base building blocks of the UI

- Most components in the `/components` folder are meant to be used anywhere in the UI
- Anything that is not defined in the components directory is used directly from
  Material UI, our base component library of choice
- Some components are not reused often, but belong in the `/components` folder
  because they are used in a global context (e.g. App-wide Navigation, Header,
  Footer, etc.).

### Hooks - like components but for logic

- A hook is a bundle of state and behavior (no visuals) that is used in the context
  of React
- These typically let us combine UI logic in a way that is decoupled from how the
  UI actually looks so we can easily share common UI interactions like how you
  interact with table sorting while making it easy to change how the UI looks in each
  spot
- Feature or domain-specific hooks live next to the view that needs it or in the
  `/models` folder where shared business logic lives.
- Hooks can also be found in the `/utils` directory if they don't deal with
  business logic, but are still "framework" level concerns (e.g. interacting
  with browser storage, query string manipulation, etc.)

### Models

- These exist both globally in `model` and living alongside features in views
- Represent the various data models and "business logic" in our application.
  These files include formatters, validation logic, type interfaces, fetching
  logic/hooks and other helper functions for interacting with these domains

### Context - global state for use across the React application

- Most state is feature-specific and so it lives alongside that feature's
  components (i.e. in `/views`), but for passing state via React Context that is
  application-wide, we use the `/context` folder

## Build Process

### All packages

- Eslint enforces certain style and correctness rules, these can be ignored on a case
  by case basis but usually are intended to help you avoid common JS pitfalls
- Typescript is used to provide a stronger guarantee of correctness across the
  application. Please avoid using escape hatches like `any`, prefer using `unknown`
  and type narrowing instead.
- Prettier is auto formatting all code to avoid bikeshedding on basic stylistic
  concerns

### Application

- We use webpack to bundle our application, our config is heavily inspired by Create
  React App, but ejected because we had the need to configure it to support specific
  requirements for our project

### Libraries

- We use swc and tsc to build libraries.

## Naming conventions

- Enums, components, component directories, and types are `PascalCase`.
- Enum members and constants are snakecase `ALL_CAPS`.
- Other variables are `camelCase`.
- Non-component directories are `kebab-case`.

## React components

### Component directory structure

- In library packages that contain more than just components, components should live in a top-level `components` directory.
- React components should always live in a directory with a matching name and an index.ts file that exports the contents of the directory that we want to expose for public consumption.
- The component directory may include additional components that help with composing the component (e.g. a `List` component may also include a `ListItem` component, a complex component may be broken down into pieces for ease of code maintenance).
- The component directory should also include closely associated files like unit tests (`*.test.tsx`) and stories (`*.stories.tsx`).

### Component responsibilities and composition

- When designing components and their APIs for libraries, assume they may be used individually, in a dashboard, and alongside other components that are not dashboards.
- It is better to err on the side of building more components with less responsibilities than a single component with a lot of responsibilities. This makes it easier to use components as composable building blocks in a wide variety of use cases.
- If a component has multiple boolean flag props, consider to split it into multiple
  components instead of making it do too many things.
- If you find yourself doing significant data transformation or business logic inside a component, think about if it may want to be used outside that component. If so, consider pulling it out into a utility function or wrapper component that is more reusable.
- When possible, avoid building atomic components (e.g. buttons, alerts, dropdowns) from scratch. Instead use or build on top of MUI components.

### Component props

- All components with props should define their types in a prop using the naming scheme `ComponentNameProps` and export that type for external use.
- Be thoughtful about exposing props from MUI when using it as a tool to build components. Do we actually want consumers to be able to override all of those values? Will we be able to support them doing so?

### Styling components

- Most of our CSS lives inline with components because we believe that the look
  and behavior of a component should be coupled
- Use the [`SxProps` API in Material UI](https://mui.com/system/getting-started/the-sx-prop/) for doing most custom styling inline with
  the components. We occasionally use the `styled` hook.
- Material UI is themeable, so we define any global overrides for Material UI
  components in the theme
- The theme includes our color palette, typography, spacing units and more and is
  available and used by our custom component styles as well
- When writing CSS, **ALWAYS** use the variables from our Theme instead of writing
  your own magic numbers/colors unless required
- External CSS files should typically only be used for third-party libraries that
  require them for styling

## State management in libraries

When possible, libraries should manage internal state and avoid forcing specific application-level state decisions on consumers. A good question to ask yourself is, "Will all consumers want their state to be stored this way?" In cases where state belongs in the application, library code should provide a means for the consumer to manage that state themselves. For example, a component can take a `value` prop and update the consumer about changes using an `onChange` prop.

### Tools for storing state

After deciding that state does belong in the library, how should it be stored? It depends. Below are some examples of ways to store state and when to use them.

#### React useState

React’s state using the `useState` hook is a good general tool for storing state. We recommend starting here unless you are starting with an
inherently complex use case that definitely needs one of the more complex tools.

- Try to put the application state as close to where it’s used. When writing feature
  specific code, don’t worry about putting all of the state in a single "container"
  that orchestrates everything. If the state ends up being shared, you can refactor
  it then instead of prematurely collocating the state.

#### React context

React [context](https://react.dev/learn/passing-data-deeply-with-context) can be really useful, but it can lead to a poor developer experience when it is overused. Some good questions to ask [before using context](https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context):

- Does this state need to be accessible by many components at different nesting levels?
- Can this be accomplished with component composition?

It can be really frustrating to try to use a component and run into several levels of providers trying to get started. In use cases where context is the right way to manage state, reduce this pain for consumers by:

- Ensuring that there is documentation for how to use the context and when it is needed.
- When possible, have a reasonable fallback behavior when the context is not set.

#### Zustand & immer

[Zustand](https://github.com/pmndrs/zustand) (with [immer](https://immerjs.github.io/immer/)) is useful for managing complex internal state. It is primarily used for the internal state for working with dashboards.

#### React query

[React query](https://tanstack.com/query) should be used for managing state associated with fetching data. Keep in mind that consumers will likely want to fetch data from a variety of data sources.

#### Local storage

Libraries should ideally avoid storing state in local storage. If you run into a compelling case for using local storage, you should discuss with other maintainers before proceeding.

#### Url & query params

Libraries should not **require** storing state in the url using routes or query parameters. The url is part of the application state that should be controlled by application owners, not the library. Libraries may provide optional features that store state in the url as long as the functionality has the ability to opt out.

> ⚠️ Note: this is an aspirational guideline that should impact _new_ development. There are currently a small number of use cases where library code is opinionated about using query params to manage state and does not have the ability to opt out.

## Testing

Any new feature work or essential bug fixes should include tests. The appropriate type of test will depend on the features being built. See each of the sections below for guidance on the forms of testing we use.

> ⚠️ Note: these are aspirational testing guidelines that should impact _new_ development. The project currently has limited code coverage, and we are slowly working on fixing it.

### Unit and integration testing for components and utilities

Unit and integration tests for components & utilities are written using a combination of [Jest](https://jestjs.io/) and [React Testing library](https://testing-library.com/docs/react-testing-library/intro/). These tests are relatively fast to run and are the first testing tool to reach for when testing React components, utility functions, and other smaller segments of the codebase.

- Tests live alongside the application code in `*.test.ts` files.
- Methods, classes, and other non-React utility code with important logic should be unit tested using Jest.
- When possible, complex logic within components should be pulled out into utility methods, so that logic can more easily be unit tested with Jest tests.
- If an integration test is hard to write, break down the logic and write unit tests
  instead. Unit tests are encouraged for complex utilities, but can be omitted in
  place of well written integration tests.
- We tend to bias towards writing integration tests at the "View" level, rather
  than the individual component level since we can often exercise the components
  by testing the view
- We try to write integration test scenarios that represent the user using the
  application
- Try to use the ARIA role-based selectors when writing tests and don’t be afraid to
  go back and modify components to make them accessible to those selectors in tests.
  This has the advantage of adding at least a modicum of accessibility to the
  application as we build it. Using a “test id” should be the absolute last resort.

### End-to-end and browser testing

End-to-end and browser tests are written using [Playwright](https://playwright.dev/). These tests are significantly more time-consuming to run, so they account for a small portion of our test suite. They should focus on [smoke testing](<https://en.wikipedia.org/wiki/Smoke_testing_(software)>) critical user flows and testing use cases that are difficult to cover using other tools (e.g. drag and drop interactions).

- Tests live in the `ui/e2e` directory. See the [README](./e2e) in that directory for additional guidance.
- Each large feature should include at least one e2e test to ensure the most
  common flow works.

### Visual testing

- Visualization-heavy components (e.g. charts using `canvas`) should have visual tests using [Happo](https://happo.io/).
- Visual tests can be generated during the execution of an end-to-end test with Playwright or by creating stories in Storybook. See the [e2e](./e2e) and [storybook](./storybook) readmes for additional guidance.

## Documentation

Code intended for use by library consumers should include documentation using the following tools:

- jsdoc in comments explaining the purpose of components, classes, and functions.
- jsdoc on types and their properties, especially types that define component props.
- Stories using storybook for components. Stories autogenerate a significant portion of their documentation using jsdoc comments, so the prior items are important for this to work well.

> ⚠️ Note: this is an aspirational guideline that should impact _new_ development. There is a small amount of documentation for the current codebase, and we are slowly working on expanding it.

## Additional best bractices

These are things we look for in code review. Most of these are general guidelines
to ensure you are writing modular UI code.

- Avoid breaking things out into a reusable global component unless it needs to be
  used in 3 or more places.
- Start thinking about breaking a module into smaller modules or sub components when
  it exceeds 300 lines, unless there is a good reason to couple all of the code in a
  single module)
- Use explicit `null` or `undefined` checks instead of relying on JS falsiness
- Bias towards using optional properties (i.e. `foo?: bar`) and `undefined` over
  `null`, unless an explicit `null` is required or has semantic meaning
- Feature specific code within `/views` should not be imported by a different feature
  or global component. This is a sign of too much coupling between things OR a sign
  that the thing should be turned into a globally reusable component or utility.
