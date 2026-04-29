# Contributing

Thanks for helping shape AI IDE Agent.

Start with the local development guide:

- `docs/contributors/development.md`

Before opening a pull request, run:

```bash
npm run build
npm test
npm run typecheck
```

Provider-specific code should stay behind provider adapters. Do not commit API
keys, local memory stores, or workspace-specific agent data.
