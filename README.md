# smartIDE

[![CI](https://github.com/ezmoney4scout/smartIDE/actions/workflows/ci.yml/badge.svg)](https://github.com/ezmoney4scout/smartIDE/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)
![VS Code Extension](https://img.shields.io/badge/VS%20Code-extension-007ACC?logo=visualstudiocode&logoColor=white)

smartIDE is an open-source, local-first AI IDE agent based on VS Code extension architecture, designed for Vibe Coding workflows. It integrates multiple LLM choices, project context awareness, intelligent code search, AI-assisted editing, debugging support, and agent-style automation to help developers write and improve code more efficiently.

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
- Interactive VS Code-compatible task panel
- Diff preview and confirmed proposal write flow

## Quick Start

```bash
npm install
npm test
npm run build
npm run demo
```

## Provider Configuration

The project can run with a local mock provider, hosted OpenAI-compatible providers, or built-in presets for Minimax, Kimi, and GLM.

Copy `.env.example` into your shell or local environment manager, then choose a provider:

```bash
AI_IDE_AGENT_PROVIDER=kimi
KIMI_API_KEY=your-api-key
AI_IDE_AGENT_MODEL=kimi-k2.5
```

Supported provider values:

| Provider | Environment key | Default base URL |
| --- | --- | --- |
| `mock` | none | local mock |
| `openai-compatible` | `AI_IDE_AGENT_API_KEY` | `https://api.openai.com/v1` |
| `minimax` | `MINIMAX_API_KEY` | `https://api.minimax.io/v1` |
| `kimi` | `KIMI_API_KEY` | `https://api.moonshot.ai/v1` |
| `glm` | `GLM_API_KEY` | `https://open.bigmodel.cn/api/paas/v4` |

The VS Code-compatible extension also exposes `aiIdeAgent.provider`, `aiIdeAgent.apiKey`, `aiIdeAgent.baseUrl`, and `aiIdeAgent.defaultModel` settings. Environment variables are safer for shared workspaces because they reduce the chance of committing secrets.

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

## Agent Task Flow

The VS Code-compatible extension panel accepts a task goal, creates a local Agent Core lifecycle, and prepares a source-file change proposal for the first planned file. Users can preview the original file against the proposed content with VS Code's diff view before applying it. Applying writes the proposed content back to that workspace file, keeping source edits behind an explicit confirmation step.

Provider responses can drive real source edits by returning structured JSON:

```json
{
  "targetPath": "relative/path/inside/workspace",
  "proposedContent": "complete replacement file content",
  "summary": "short change summary"
}
```

If the response is not valid structured patch JSON, smartIDE falls back to a safe local proposal note so the user still gets a reviewable diff instead of an untrusted write.

## Open Source Status

This repository is ready for an initial public GitHub release:

- MIT licensed
- GitHub Actions CI
- bug and feature issue templates
- pull request template
- development guide
- provider adapter guide

Before pushing publicly, review repository ownership, package publisher names, and any organization-specific contact details.

## Contributing

See `CONTRIBUTING.md` and `docs/contributors/development.md`.

## Roadmap

- Full Context Ledger UI
- Provider settings UI
- Multi-file structured patch output
- Verification runners
- Debug Hypothesis Mode
- Memory Update Proposal UI
- Budget and limits console
- Standalone desktop IDE exploration
