# AI IDE Agent

AI IDE Agent is an open-source, local-first IDE agent platform for bringing third-party LLMs into a trustworthy software engineering workflow.

Positioning: **From Prompt to Proof.**

The project starts as a VS Code-compatible extension plus reusable local Agent Core. The long-term roadmap keeps the core editor-independent so it can later power a CLI, desktop IDE, or other editor integrations.

## Phase 1 Features

- TypeScript monorepo
- VS Code-compatible extension shell
- Local Agent Core lifecycle
- Provider adapter contract
- Mock provider
- OpenAI-compatible provider adapter
- Minimax, Kimi, and GLM provider presets
- Context Ledger model
- Task Spec model
- Change Capsule model
- Verification evidence model
- Local project storage
- CLI demo

## Quick Start

```bash
npm install
npm test
npm run build
npm run demo
```

## Architecture

```text
apps/extension
  -> packages/agent-core
       -> packages/protocol
       -> packages/providers
       -> packages/storage
```

## Local-First Policy

Source code stays in the local workspace. API keys should be stored through editor or OS secret storage. Long-term memory stores references, summaries, and provenance instead of copying source files by default.

## Roadmap

- Full Context Ledger UI
- Provider settings UI
- Real diff preview and Change Capsules
- Verification runners
- Debug Hypothesis Mode
- Memory Update Proposal UI
- Budget and limits console
- Standalone desktop IDE exploration
