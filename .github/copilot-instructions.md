# GitHub Copilot instructions

Follow [`AGENTS.md`](../AGENTS.md) and, for TypeScript or React files, the matching
`.github/instructions/ui.instructions.md` guidance.

- Identify the owning layer before editing: Go API/model, application UI, shared library, specification, or plugin.
- Keep product-specific UI in `ui/app`; do not duplicate responsibilities owned by `perses/shared`, `perses/spec`, or
  `perses/plugins`.
- Preserve API, persisted-resource, authorization, and migration compatibility unless a breaking change is explicit.
- Do not hand-edit generated clients or `*_go_gen.cue` files.
- Add focused tests for behavior changes and use the closest existing test pattern.
- New source files require the Apache license header.
- Never raise Oxlint warning ceilings or add broad lint suppressions to make CI pass.
- Validate the changed layer with the commands documented in `AGENTS.md` before presenting the work as complete.
