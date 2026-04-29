# Development Guide

This guide covers the Phase 1 development workflow for AI IDE Agent.

## Setup

Install dependencies from the repository root:

```bash
npm install
```

Then verify the workspace:

```bash
npm test
npm run typecheck
npm run build
```

The CLI demo runs from the built output:

```bash
npm run demo
```

## Common Commands

- `npm test`: run the Vitest test suite.
- `npm run typecheck`: typecheck all workspaces.
- `npm run build`: build all packages and apps with build scripts.
- `npm run demo`: run the local CLI demo from `packages/cli/dist`.
- `git diff --check`: check for whitespace errors before committing.

## Package Boundaries

- `apps/extension`: VS Code-compatible extension shell.
- `packages/agent-core`: local task lifecycle orchestration.
- `packages/protocol`: shared protocol types for tasks, context, changes, verification, providers, and storage.
- `packages/providers`: provider contract, registry, Mock provider, OpenAI-compatible adapter, and Minimax, Kimi, and GLM presets.
- `packages/storage`: local project storage for ledgers, task specs, change capsules, and verification evidence.
- `packages/cli`: local demo entrypoint.

Keep editor-specific behavior in `apps/extension`. Keep reusable orchestration in `packages/agent-core`. Shared data contracts belong in `packages/protocol`; provider-specific network and SDK behavior belongs in `packages/providers`.

## Testing Rules

Tests should be deterministic and runnable without network access or real provider credentials. Use the Mock provider, local fixtures, or mocked transport for provider behavior.

Do not add default tests that call live model APIs. Live provider coverage must be opt-in through explicit environment variables and should be skipped unless those variables are present.

When changing shared protocol types, add or update tests in the package whose behavior depends on the type. When changing package boundaries, run the full root verification commands before committing.

## Local Data

AI IDE Agent is local-first. Source code stays in the workspace, and project data should remain under local project storage. API keys should be stored through editor or OS secret storage, not in repository files or generated local data.

Generated local state such as `.ai-ide-agent/` is workspace data. Review it before committing and avoid checking in machine-specific or secret-bearing content.
