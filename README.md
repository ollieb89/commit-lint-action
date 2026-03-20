# 📋 Commit Lint Action

> Enforce [Conventional Commits](https://www.conventionalcommits.org/) format on every PR and push.

[![CI](https://github.com/ollieb89/commit-lint-action/actions/workflows/ci.yml/badge.svg)](https://github.com/ollieb89/commit-lint-action/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- ✅ Validates commit messages against conventional format
- 🔒 Configurable allowed types and scopes
- 💬 Posts PR comments with per-commit results
- 📊 GitHub Actions summary with full breakdown
- ⚙️ Deduplicates PR comments (updates instead of spamming)
- 🚦 Configurable fail / warn mode

## Usage

```yaml
name: Commit Lint

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: ollieb89/commit-lint-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `token` | GitHub token | `${{ github.token }}` |
| `fail-on-error` | Fail workflow on invalid commits | `true` |
| `post-comment` | Post PR comment with results | `true` |
| `types` | Allowed commit types (comma-separated) | `feat,fix,docs,style,refactor,perf,test,build,ci,chore,revert` |
| `scopes` | Allowed scopes — empty = any | `""` |
| `min-length` | Minimum message length | `10` |
| `max-length` | Maximum message length | `100` |

## Outputs

| Output | Description |
|--------|-------------|
| `valid` | `true` if all commits are valid |
| `invalid-count` | Number of invalid commits |
| `total-count` | Total commits checked |

## Conventional Commit Format

```
type(scope): description

feat(auth): add OAuth2 login
fix: handle null pointer in parser
docs(readme): update installation steps
chore!: drop Node 14 support
```

### Allowed Types (default)

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure |
| `perf` | Performance improvement |
| `test` | Adding/fixing tests |
| `build` | Build system changes |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |
| `revert` | Revert a commit |

## License

MIT © [ollieb89](https://github.com/ollieb89)

---

## 🔐 Level Up Your Security

Using GitHub Actions? Grab the **[GitHub Actions Security Checklist](https://trivexia.gumroad.com/l/bfsbud)** — 50+ battle-tested checks covering secrets management, supply chain attacks, permission scoping, and runner hardening.
