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
- Full Context Ledger panel entries
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

To build an installable VS Code package:

```bash
npm run package:extension
```

The VSIX is written to `dist/vsix/smartide-0.1.0.vsix` and can be installed through **Extensions: Install from VSIX...** in VS Code.

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

The extension panel shows the active provider, model, and configuration status before a task runs. Hosted providers are blocked with a clear message when their API key is missing; the `mock` provider remains zero-config for local demos and CI.

Example extension settings:

```json
{
  "aiIdeAgent.provider": "glm",
  "aiIdeAgent.apiKey": "your-api-key",
  "aiIdeAgent.defaultModel": "glm-4.6"
}
```

For other OpenAI-compatible LLM services, use `openai-compatible` with a custom base URL:

```json
{
  "aiIdeAgent.provider": "openai-compatible",
  "aiIdeAgent.apiKey": "your-api-key",
  "aiIdeAgent.baseUrl": "https://api.example.com/v1",
  "aiIdeAgent.defaultModel": "provider-model-name"
}
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

## Agent Task Flow

The VS Code-compatible extension panel accepts a task goal, creates a local Agent Core lifecycle, and prepares source-file change proposals. It shows the Context Ledger entries used for the task, including path, source, reason, token estimate, and pinned/excluded flags. Users can preview original files against proposed content with VS Code's diff view before applying. Before applying, the panel shows the verification commands that may run. Users can choose **Apply & Run Verification** or **Apply Without Verification**. Verification output is shown in the panel and truncated before rendering to keep the UI responsive.

Provider responses can drive real source edits by returning structured JSON:

```json
{
  "summary": "short task summary",
  "patches": [
    {
      "targetPath": "relative/path/inside/workspace",
      "proposedContent": "complete replacement file content",
      "summary": "optional per-file summary"
    }
  ]
}
```

The older single-file `{ "targetPath", "proposedContent", "summary" }` shape is still supported. If the response is not valid structured patch JSON, smartIDE falls back to a safe local proposal note so the user still gets a reviewable diff instead of an untrusted write.

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

- Provider settings UI
- Verification runners
- Debug Hypothesis Mode
- Memory Update Proposal UI
- Budget and limits console
- Standalone desktop IDE exploration
