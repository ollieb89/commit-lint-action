# Commit Lint Action

🔨 GitHub Action to enforce [Conventional Commits](https://www.conventionalcommits.org/) format on your pull requests.

Validates every commit message in a PR against the conventional commits specification. Fails the check if any commits don't follow the format, with clear inline feedback.

## Features

- ✅ Validates commit messages against Conventional Commits format
- ✅ Configurable commit types and scopes
- ✅ Supports merge commits and revert commits
- ✅ Clear error messages with format examples
- ✅ Zero dependencies
- ✅ Fast execution

## Usage

### Basic

```yaml
name: CI
on: [pull_request]

jobs:
  commit-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ollieb89/commit-lint-action@v1
```

### With custom types

```yaml
- uses: ollieb89/commit-lint-action@v1
  with:
    types: feat,fix,docs,chore,ci
```

### With scope validation

```yaml
- uses: ollieb89/commit-lint-action@v1
  with:
    types: feat,fix
    scopes: api,ui,db
```

## Inputs

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `token` | GitHub token (defaults to `GITHUB_TOKEN`) | `""` | No |
| `types` | Comma-separated list of allowed commit types | `feat,fix,docs,style,refactor,perf,test,chore` | No |
| `scopes` | Comma-separated list of allowed scopes (empty = any) | `""` | No |
| `allow-merge-commits` | Allow merge commit messages | `false` | No |
| `allow-revert` | Allow revert commit messages | `true` | No |

## Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Rules

- **type** — lowercase, required, one of: feat, fix, docs, style, refactor, perf, test, chore
- **scope** — optional, alphanumeric with hyphens
- **subject** — lowercase, imperative mood, no period, < 50 characters
- **body** — optional, explains what and why
- **footer** — optional, references issues

### Examples

✅ Valid:
```
feat: add user authentication
fix(api): resolve null pointer exception
docs: update readme
chore: update dependencies
```

❌ Invalid:
```
Add user authentication          # Missing type
feat: Add user authentication    # Uppercase subject
feat(Invalid): something         # Unknown scope
feat: add feature with a very long subject that exceeds fifty characters
```

## License

MIT © 2026 Ollie B
