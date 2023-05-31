# Perses UI

This serves as the monorepo root for the packages that make up the Perses UI.

## UI quick start

If you are new to Perses, please review the rest of this README first before starting development.

### Perses app

- Start the backend server in development mode by running this script from the project root: `./scripts/api_backend_dev.sh`
- Change to the `ui` directory.
- Install dependencies: `npm install`
- Start the Perses app: `npm run start`
- Open the app: http://localhost:3000/

### Storybook

- Change to the `ui` directory.
- Install dependencies: `npm install`
- Start the storybook: `npm run storybook`
- Open the storybook: http://localhost:6006/

### Perses app and storybook

Follow the steps for "Perses app", but start using this script: `npm run start-with-storybook`.

### Run Jest tests

- Change to the `ui` directory.
- Install dependencies: `npm install`
- Run tests: `npm run test`

### Run end-to-end tests

- Follow the instructions to start the Perses app.
- Change to the `ui` directory.
- Run the end-to-end tests from the command line: `npm run e2e`

## Package organization

The UI-based code for Perses is organized as a monorepo using [turborepo](https://turbo.build/repo).

The root `package.json` in `ui` has
[NPM workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) enabled, so running `npm install` will install
dependencies for all packages and add symlinks to the local versions for packages that depend on other packages in the
workspace. The root `package.json` also contains `devDependencies` that are commonly used across multiple packages in
the workspace.

Perses is broken up in to a number of separate packages to allow for flexibility when embedding functionality. You can generate a graph of the dependencies by using the [turbo cli's `--graph` option](https://turbo.build/repo/docs/reference/command-line-reference#--graph). For example, `npm run start -- --graph=graph.svg` will output a graph of the dependencies of the `start` command in SVG format.

### Applications

- [`app`](./app): The main Perses UI React application.

### Libraries

The following packages include components, plugins, utilities, and other code that is used to compose the Perses UI React application and can be used by consumers to compose their own applications.

These packages are published to npm with the `@perses-dev` namespace.

- [`components`](./components): common components available to the app, plugins, or users who want to embed common Perses UI elements into their own applications.
- [`core`](./core): Core functionality that's exposed to plugins and also
  consumed by the app.
- [`dashboards`](./dashboards): Dashboard components and related utilities.
- [`panels-plugin`](./panels-plugin): a plugin module with `Panel` plugins for
  the core visualizations supported by Perses.
- [`plugin-system`](./plugin-system): All the type definitions and components that power our plugins, also includes the
  definitions for the runtime available to plugins (e.g. the current time range state, the current template variable
  state).
- [`prometheus-plugin`](./prometheus-plugin): a plugin module with multiple
  plugin types (e.g. `Variable`, `ChartQuery`, etc.) for supporting Prometheus
  in Perses.

### Internal tooling

The following packages are internal tooling that assists with development of the Perses UI. These are not published and are not intended for use outside of the project.

- [`e2e`](./e2e): End-to-end tests.
- [`storybook`](./storybook): Storybook management and configuration.

## Development Environment

First, check out the [UI Guidelines](./ui-guidelines.md) for some information on how the codebase is organized and our
approach to development in the UI. You'll need to have the following installed locally before you can start developing:

- [Node.js](https://nodejs.org/) v18 or higher: we suggest using [NVM](https://github.com/nvm-sh/nvm) for installing
  and managing versions.
- [NPM](https://npmjs.com/) v7 or higher: a version of `npm` that supports workspaces (use
  `npm --version` to check your version locally)

## Running Scripts

You can use the `-w ${WORKSPACE_NAME}` flag of `npm run` to run scripts inside
workspace packages from this root folder. For example, to start the main app,
you would run:

```sh
npm run start -w app
```

Keep in mind that since `npm install` symlinks to other local packages in the workspace, you may need to build some
packages first locally before they will be available to the local packages that depend on them (e.g. you need to build
`core` before building/running `app` locally).

You can also run a script across all packages in the workspace using NPM's
`--workspaces` flag.

Note: If you are trying to run the app (`npm run start -w app`), you may need to
first [setup a local backend server](https://github.com/perses/perses/blob/main/CONTRIBUTING.md).

## Troubleshooting

### I am getting build errors. What do I do?

Occasionally, after switching branches or installing new dependencies, your environment may start throwing build errors.
To fix, try clearing all dist folders by running `npm run clean` in the ui folder (before rerunning `npm start`).

If this does not work, `npm run reinstall` can be used to remove all `node_modules` folders and clear the `dist`
folders.
