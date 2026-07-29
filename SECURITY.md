# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Open a private vulnerability report on our [GitHub Repository](https://github.com/sanromarth/ornas/security/advisories/new) with details of the vulnerability.
3. A maintainer will respond within 48 hours to acknowledge the report.

### Response Timeline

- **72 hours** — Acknowledge receipt of your report
- **1 week** — Provide an initial assessment and action plan
- **30 days** — Target fix release (for confirmed vulnerabilities)

## Security Model

ORNAS is an offline-only application. It makes zero network calls.
See [docs/ARCHITECTURE_FINAL.md](docs/ARCHITECTURE_FINAL.md) §15 for the full security model.

## Code Signing & OS Warnings

Windows (SmartScreen / Smart App Control) and macOS (Gatekeeper) may display security warnings when running ORNAS. This is expected because the binaries are currently **unsigned**. 

These warnings are not security vulnerabilities and should not be reported as such. Please refer to [SIGNING.md](SIGNING.md) for the current status of code signing and notarization for this project.
