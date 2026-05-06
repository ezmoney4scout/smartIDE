# smartIDE

smartIDE is a local-first AI IDE Agent for VS Code-compatible editors. It connects third-party LLM providers to a visible engineering workflow with an Activity Bar Chat sidebar, panel-based provider settings, Context Ledger entries, local Memory RAG retrieval, task specs, budget limits, source change proposals, diff preview, Pre-write Code Review, Human Approval / Full Automation write modes, configurable verification evidence, and user-approved Memory Update Proposals.

## Install From VSIX

Build the installable package from the repository root:

```bash
npm install
npm run package:extension
```

The generated VSIX is written to:

```text
dist/vsix/smartide-0.1.0.vsix
```

In VS Code, run **Extensions: Install from VSIX...** and select that file.

The smartIDE Chat sidebar opens on startup by default. To focus it manually, run **AI IDE Agent: Focus Chat** from the command palette. Set `aiIdeAgent.openOnStartup` to `false` to keep it hidden until requested.

## Provider Settings

The extension defaults to the zero-config mock provider. Hosted providers require an API key, including providers that offer free models or free trial quota.

Supported provider values:

- `mock`
- `openai-compatible`
- `minimax`
- `kimi`
- `glm`

Configure these settings in VS Code when using a hosted provider:

```json
{
  "aiIdeAgent.provider": "kimi",
  "aiIdeAgent.apiKey": "your-api-key",
  "aiIdeAgent.defaultModel": "kimi-k2.6"
}
```

The Provider Settings panel includes a Recommended Models dropdown:

| Provider | Recommended models | API key |
| --- | --- | --- |
| `mock` | `mock-model` | Not needed |
| `glm` | `glm-4.7-flash`, `glm-4-flash-250414`, `glm-4.6v-flash` | Required |
| `kimi` | `kimi-k2.6`, `kimi-k2.5` | Required |
| `minimax` | `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`, `MiniMax-M2.5` | Required |

Use `aiIdeAgent.baseUrl` for OpenAI-compatible provider overrides.
