# Perses UI quality instructions

Use these rules for new and modified TypeScript/React code. Older code may not follow every rule; improve the code you
touch without expanding the task into unrelated cleanup.

## Design and package boundaries

- Inspect neighboring code and the package's public entry point before adding a new pattern.
- Keep feature-specific code beside its feature. Move code to a shared component or utility only when there is a proven
  cross-feature use case.
- Respect package dependency direction and public exports. Do not deep-import another package's internal files.
- Prefer small, composable components and pure utilities over components that combine rendering, data transformation,
  network access, and orchestration.
- Do not add a dependency when an existing Perses package, current dependency, or small local helper solves the problem.

## TypeScript and public APIs

- Preserve strict typing. Prefer `unknown` plus narrowing over `any`, unchecked casts, non-null assertions, or blanket
  TypeScript suppressions.
- Give exported functions and module boundaries explicit return types. Model invalid states out of the type system when
  practical.
- Component prop types use `ComponentNameProps`; export them when the component is public.
- Use named exports. Update the package's public barrel only when the symbol is intentionally part of its supported API.
- Prefer optional properties and `undefined` unless `null` has explicit domain meaning.
- Validate untrusted or persisted input at a boundary; do not assume a TypeScript type validates runtime data.

## React, compiler, and rendering performance

- Follow the Rules of Hooks. Hooks are called unconditionally at component top level and have complete dependencies.
- Keep render pure: do not mutate props, state, hook-returned values, module globals, or refs during render.
- Do not read `ref.current` to calculate rendered output. Read or write refs in effects, layout effects, or event
  handlers.
- Derive values during render instead of synchronously setting derived state in an effect. Use effects only to
  synchronize with external systems and always clean up subscriptions, timers, and requests.
- Define components at module scope, not inside another component's render path.
- Keep props stable when identity affects rendering: hoist static objects and arrays, and use `useMemo` or `useCallback`
  for dynamic values passed across memoized boundaries. Do not add memoization blindly or omit dependencies.
- Memoize React context values when they contain objects or functions whose identity would otherwise change each render.
- Avoid array-index keys when a stable domain identifier exists.
- Treat `react/react-compiler` and `react-perf` diagnostics as design feedback. Fix new warnings rather than disabling
  the rule or increasing the repository warning ceiling.

## Components, state, and accessibility

- Start with existing Perses and Material UI components. Use theme tokens and `sx`; avoid hard-coded colors and
  arbitrary spacing when a theme value exists.
- Import Material Design icons directly from their icon module instead of the `mdi-material-ui` package barrel.
- Keep state as close as possible to its consumers. Use TanStack Query for server state and avoid copying query data
  into local state without a clear reason.
- Introduce context only for genuinely cross-cutting state. Library components should allow consumers to own
  application-level state.
- Provide loading, empty, error, and disabled states where applicable. Preserve error causes and never expose secrets or
  credentials in UI messages or logs.
- Use semantic HTML, labels, keyboard interaction, and correct ARIA relationships. Do not silence accessibility rules
  when the markup can be corrected.

## Tests and quality gates

- Add or update tests for new behavior and regressions. Keep tests beside source as `*.test.ts` or `*.test.tsx`.
- Test observable behavior with React Testing Library and `user-event`. Prefer role, name, label, and visible-text
  queries; use test IDs only as a last resort.
- Use Playwright for critical end-to-end flows or browser behavior that unit/integration tests cannot cover.
- Run a focused test while iterating, then the affected workspace's type-check and test commands.
- Before completion, run repository-level `pnpm lint`, `pnpm format:check`, and `pnpm type-check`.
- Oxfmt owns formatting and import sorting. Do not manually fight its output.
- A lint suppression must be narrow, name the rule, and include a nearby explanation of why the exception is necessary.
  Do not enable type-aware linting or change lint configuration unless the task explicitly concerns repository tooling.
