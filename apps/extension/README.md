# smartIDE

smartIDE is a local-first AI IDE Agent for VS Code-compatible editors. It connects third-party LLM providers to a visible engineering workflow with Context Ledger entries, task specs, source change proposals, diff preview, and verification evidence.

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

## Provider Settings

The extension defaults to the zero-config mock provider. Hosted providers require an API key.

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
  "aiIdeAgent.defaultModel": "kimi-k2.5"
}
```

Use `aiIdeAgent.baseUrl` for OpenAI-compatible provider overrides.
