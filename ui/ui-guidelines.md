# UI Guidelines

## Background

This lays out the current state of how the frontend code is architected, the best
practices to follow when adding new code to the frontend and the considerations
for the future growth of the frontend. This is meant to be a living document that
will evolve as the UI grows. There are lots of exceptions to every rule laid out
here as UI code can vary significantly from feature to feature.

## Elements of the UI

The Perses UI application can be broken down into a few different pieces that
are reflected in how the codebase is organized.

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
  Footer, etc.)

### Styles

- Most of our CSS lives inline with components because we believe that the look
  and behavior of a component should be coupled
- Material UI is themeable, so we define any global overrides for Material UI
  components in the theme
- The theme includes our color palette, typography, spacing units and more and is
  available and used by our custom component styles as well

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

### Tests

- Unit and integration tests live alongside the application code in `__tests__`
  folders
- Server mocks live in `__server__` folders alongside app code
- Any new feature work or essential bug fixes should include integration tests
  written with jest and react-testing-library.
- If an integration test is hard to write, break down the logic and write unit tests
  instead. Unit tests are encouraged for complex utilities, but can be omitted in
  place of well written integration tests.
- We tend to bias towards writing integration tests at the "View" level, rather
  than the individual component level since we can often exercise the components
  by testing the view
- We try to write integration test scenarios that represent the user using the
  application
- End-to-end (e2e) tests are written in Cypress under the `ui/e2e` directory.
  These tests should only cover golden workflow or business essential user flows.
  They account for a small portion of our entire test suite because they are
  generally more time consuming to run and more prone to flakiness. That being said,
  each large feature/project should include at least one e2e test to ensure the most
  common flow works.

### Build Process

- We use webpack to bundle our application, our config is heavily inspired by Create
  React App, but ejected because we had the need to configure it to support specific
  requirements for our project
- Eslint enforces certain style and correctness rules, these can be ignored on a case
  by case basis but usually are intended to help you avoid common JS pitfalls
- Typescript is used to provide a stronger guarantee of correctness across the
  application. Please avoid using escape hatches like `any`, prefer using `unknown`
  and type narrowing instead.
- Prettier is auto formatting all code to avoid bikeshedding on basic stylistic
  concerns

## Frontend Best Practices

These are things we look for in code review. Most of these are general guidelines
to ensure you are writing modular UI code.

- When writing CSS, _always_ use the variables from our Theme instead of writing
  your own magic numbers/colors unless required
- Avoid breaking things out into a reusable global component unless it needs to be
  used in 3 or more places.
- Start thinking about breaking a module into smaller modules or sub components when
  it exceeds 300 lines, unless there is a good reason to couple all of the code in a
  single module)
- If a component has multiple boolean flag props, consider to split it into multiple
  components instead of making it do too many things.
- Use Null or Undefined checks instead of relying on JS falsiness
- Feature specific code within `/views` should not be imported by a different feature
  or global component This is a sign of too much coupling between things OR a sign
  that the thing should be turned into a globally reusable component or utility.
- Try to put the application state as close to where it’s used. When writing feature
  specific code, don’t worry about putting all of the state in a single "container"
  that orchestrates everything. If the state ends up being shared, you can refactor
  it then instead of prematurely collocating the state.
- Try to use the ARIA role-based selectors when writing tests and don’t be afraid to
  go back and modify components to make them accessible to those selectors in tests.
  This has the advantage of adding at least a modicum of accessibility to the
  application as we build it. Using a “test id” should be the absolute last resort.
- Naming Conventions
  - Enums and Components are `PascalCase`
  - Enum Members and Constants are snakecase `ALL_CAPS`
  - Other variables are `camelCase`
- Make sure to hold a discussion with fellow engineers before introducing a new
  dependency/library to the codebase. While third party libraries can benefit from
  community maintenance and include solid documentation, oftentimes the solution may
  have a performance impact and could introduce a new coding pattern to the codebase that may not be aligned with the rest of the code.
- For smaller libraries, a simple discussion over Matrix or PR may suffice. Larger
  proposals to replace or introduce a new library that may impact other engineer’s
  workflows should be ideally documented within a discussion first.
