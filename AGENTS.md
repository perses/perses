# AI contributor guide

## Purpose and instruction scope

This is the main Perses product repository. It combines a Go API server and CLI, CUE and Go Dashboard-as-Code tooling,
and the React application under `ui/`. Make changes in the layer that owns the behavior and keep cross-repository public
contracts compatible.

Before editing:

- Read `CONTRIBUTING.md` for DCO and pull-request conventions.
- Read `ui/ARCHITECTURE.md` before moving UI responsibilities between repositories or packages.
- For TypeScript or React work, also follow `STYLEGUIDE.md`.
- For UI application structure and established patterns, read `ui/README.md` and `ui/ui-guidelines.md`.

## Architecture map

- `cmd/perses/` and `cmd/percli/`: server and CLI entry points; keep orchestration thin.
- `internal/api/`: API implementation, persistence, routing, migrations, and generated client endpoints.
- `pkg/model/`: backend resource models and validation. Changes can affect API compatibility, CUE, SDKs, and the UI.
- `pkg/client/`: generated Go API clients. Do not hand-edit files marked as generated.
- `go-sdk/`: public Go Dashboard-as-Code builders and tests.
- `cue/`: CUE schemas and utilities. Files ending in `_go_gen.cue` are generated from Go models.
- `ui/app/`: the product-specific React application: routes, administration, authentication, projects, and API usage.
- `ui/e2e/`: Playwright fixtures, page objects, and critical user-flow tests.
- `ui/internal-utils/`: private UI development and test utilities.
- `internal/cli/cmd/plugin/generate/templates/`: source templates for newly generated plugin modules. Keep their
  Oxlint and Oxfmt configuration aligned with `ui/`.

Reusable UI libraries belong in `perses/shared`, canonical TypeScript specification contracts belong in `perses/spec`,
and official plugin implementations belong in `perses/plugins`. Do not recreate those layers inside `ui/app`.

## Engineering rules

- Prefer the smallest coherent change. Do not combine feature work with unrelated migrations or repository-wide cleanup.
- Preserve API and stored-resource compatibility unless a breaking change is explicit. Treat authentication,
  authorization, secret handling, and database migrations as security-sensitive code.
- When a backend resource shape changes, assess validation, generated clients, CUE schemas, Go SDK builders, REST
  behavior, migration compatibility, and corresponding UI/spec consumers.
- Never hand-edit a file containing a generated-file notice. Update its source and run the documented generator; inspect
  generated diffs before committing them.
- New source files need the repository's Apache license header.
- Do not add dependencies or introduce a new architectural pattern without a clear need and maintainer discussion.
- Keep documentation accurate when commands, configuration, public APIs, or user-visible behavior change.
- Do not raise lint warning ceilings or add broad suppressions. New code must not add Oxlint warnings.

## Validation

Use Go 1.26.x, Node.js from `ui/.nvmrc`, and npm from `ui/package.json`.

For UI changes, run from `ui/`:

```sh
npm ci
npm run lint
npm run format:check
npm run type-check
npm run test
```

Start with a focused workspace command while iterating, such as `npm run test -w app -- <test-pattern>`. Run Playwright
tests for changed critical flows, page objects, or E2E fixtures.

For Go or CUE changes, select the checks relevant to the affected layer:

```sh
make checkformat
make checkunused
go test ./path/to/affected/package/...
make checkstyle
make cue-eval
make build
```

`make test` and integration targets perform generation and may require downloaded default plugins, CUE, Prometheus, or
database services. Use them for broad backend changes when those prerequisites are available. Run `make checkdocs` for
mdox-managed Markdown changes.

## Completion checklist

- The change is in the correct repository and architectural layer.
- Public contracts and generated counterparts remain aligned.
- New behavior and important failures are covered by focused tests.
- Relevant lint, format, type, test, schema, and documentation checks pass.
- The final diff contains no generated artifacts, credentials, warning-ceiling increases, or unrelated edits.
