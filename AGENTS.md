# Agent Guide

## Scope

This file applies to the whole `ankhorage/deploy` repository.

`@ankhorage/deploy` is the standalone, headless deployment engine for Ankhorage-compatible Expo projects. It is designed to support web, iOS, and Android without requiring Ankhorage Studio.

## Repository facts

- Package name: `@ankhorage/deploy`.
- Runtime/tooling: Bun.
- Language: TypeScript, ESM, strict mode.
- Main source root: `src/`.
- Build output: `dist/`.
- Deployment is a headless domain; UI belongs to consumers such as Studio.
- README/docs use Paradox where applicable.

## Architectural rules

- Keep the package standalone and headless.
- Never depend on `@ankhorage/studio`.
- Keep Studio-specific UI, routing, dialogs, and state outside this repository.
- Treat web, Android, and iOS as deployment targets behind common domain contracts.
- Keep provider-specific behavior behind provider adapters rather than leaking Apple, Google, or EAS concepts into the public domain model.
- Prefer desired-state planning over imperative provider command sequences.
- Keep credentials and secrets out of serializable project configuration.
- Preserve deterministic, resumable, inspectable deployment behavior as the domain evolves.
- Do not introduce target/provider APIs before their contracts are specified in the roadmap.

## Public API rules

- Keep exports narrow and intentional.
- Add public types only when consumers need them directly.
- Prefer implementation-local types for internal shapes.
- Update package exports, tests, docs, and changesets together when public API changes.
- Keep the programmatic API independent of CLI and Studio presentation concerns.

## Code quality

- Use strict TypeScript.
- Do not use `any`, `@ts-ignore`, lint disables, or weakened compiler/lint settings.
- Keep every function at 50 lines or fewer.
- Keep modules focused and cohesive.
- Prefer one public export per focused file as the domain grows.
- Add focused tests for exported behavior.
- Keep tests deterministic and runnable offline where provider integration is not explicitly under test.

## Validation

Run the relevant checks before handing off:

```bash
bun run build
bun run lint:fix
bun run test
bun run knip
bun run typecheck
bun run format:check
bunx @ankhorage/ankh doctor validate .
```

Report clearly if any validation step could not be executed.

## Changesets

Add a changeset for published behavior or public API changes, including new exports, changed behavior, or changed package exports. Repository-documentation-only changes generally do not require a changeset.

## Working style for agents

Before coding, inspect the roadmap, the relevant domain boundary, current exports, and whether a changeset is required. While coding, keep changes narrow, preserve strictness, and avoid introducing Studio coupling. Before handoff, run validation, summarize public API changes, and mention any required changeset or follow-up issue.
