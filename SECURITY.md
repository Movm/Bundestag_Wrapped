# Security Policy

## Supported versions

This is an actively developed project; only the `main` branch receives security
fixes. Deployed services run from the latest `main`.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately via GitHub's [private vulnerability reporting][pvr] on this
repository (**Security → Report a vulnerability**), or email the maintainer at
the address on their GitHub profile.

Please include:

- affected component (`services/mcp`, `services/analysis`, `apps/wrapped`, or `apps/wrapped/mobile`),
- a description and impact assessment,
- reproduction steps or a proof of concept,
- any suggested remediation.

You can expect an acknowledgement within **72 hours** and a status update within
**7 days**. Please allow a reasonable window for a fix before any public
disclosure.

## Scope

This project processes **only public data** from the Bundestag DIP API and
publishes a static "Wrapped" site. Of particular interest:

- **`services/mcp`** — the public MCP/HTTP endpoint (`bundestagapi.moritz-waechter.de/mcp`)
  and the Grünerator integration seam. SSRF, injection, auth-bypass, and
  request-smuggling reports are highest priority here.
- **Secrets handling** — `DIP_API_KEY`, `MISTRAL_API_KEY`, and Qdrant credentials
  are provided via environment variables (`*.env.example`) and must never be
  committed.

## Automated security tooling

- **Dependabot** version updates across npm (web/mcp/mobile), pip, Docker base
  images, and GitHub Actions — see [`.github/dependabot.yml`](.github/dependabot.yml).
- **CodeQL** code scanning for JavaScript/TypeScript and Python on every push and
  PR to `main`, plus a weekly scheduled scan.
- **Dependency Review** on pull requests fails the build on newly-introduced
  high-severity vulnerabilities.

Maintainers should also enable, in **Settings → Code security**: Dependabot
**security** updates, secret scanning, and **push protection**.

[pvr]: https://docs.github.com/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository
