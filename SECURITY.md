# Security Policy

AI IDE Agent is local-first. Source code should remain in the local workspace
unless a user explicitly sends context to a configured model provider.

## Reporting

Please report security issues privately to the project maintainers rather than
opening a public issue. If no private contact is available yet, open a minimal
public issue that says a private security report is available, without including
exploit details.

## API Keys

Do not commit API keys. Prefer environment variables or editor/OS secret storage
over shared workspace settings.
