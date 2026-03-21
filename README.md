# commit-lint-action

A GitHub Action that enforces [Conventional Commits](https://www.conventionalcommits.org/) format on your commit messages and fails CI clearly when commits are invalid.

## Why

Bad commit messages create noise. When every team member writes messages differently, git history becomes useless for changelogs, release notes, and debugging. This action enforces a consistent format automatically.

## Quick Start

```yaml
name: Commit Lint
on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ollieb89/commit-lint-action@v1
```

That's it. Every PR commit will be validated against Conventional Commits format.

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `mode` | `pr` | Validation mode: `pr`, `push`, `sha`, or `range` |
| `types` | `feat,fix,docs,style,refactor,perf,test,build,ci,chore,revert` | Comma-separated allowed types |
| `requireScope` | `false` | Require a scope in commit messages |
| `allowBreaking` | `true` | Allow `!` breaking change marker |
| `minSubjectLength` | `3` | Minimum subject length |
| `maxSubjectLength` | `72` | Maximum subject length |
| `githubToken` | `${{ github.token }}` | GitHub token for API access |
| `sha` | | Specific commit SHA (for `sha` mode) |
| `range` | | Git range (for `range` mode, e.g. `HEAD~3..HEAD`) |

## Examples

### PR Mode (default)

```yaml
- uses: ollieb89/commit-lint-action@v1
```

### Push Mode

```yaml
name: Commit Lint
on: [push]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: ollieb89/commit-lint-action@v1
        with:
          mode: push
```

### Custom Types

```yaml
- uses: ollieb89/commit-lint-action@v1
  with:
    types: feat,fix,hotfix,release
```

### Require Scope

```yaml
- uses: ollieb89/commit-lint-action@v1
  with:
    requireScope: 'true'
```

### Range Mode

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- uses: ollieb89/commit-lint-action@v1
  with:
    mode: range
    range: HEAD~5..HEAD
```

## Supported Formats

### Valid

```
feat: add user authentication
fix(api): resolve null pointer exception
docs: update installation guide
feat!: remove deprecated endpoint
fix(auth)!: change token format
chore(deps): bump lodash to 4.17.21
```

### Invalid

```
fixed the login bug          → no type:subject format
FEAT: add login              → type must be lowercase
feat:                        → empty subject
feat(): add thing            → empty scope
yolo: ship it                → unknown type
```

## Error Output

When commits fail validation, you get clear output:

```
❌ 2 of 5 commit(s) failed validation:

  a1b2c3d — fixed stuff
    ⚠ Does not match conventional commit format: type[(scope)][!]: subject

  d4e5f6g — FEAT: Add Feature
    ⚠ Type must be lowercase (got "FEAT")

Valid examples:
  feat: add user authentication
  fix(api): resolve null pointer
  docs: update installation guide
```

## Limitations

- Validates first line of commit message only (body/footer not checked)
- No PR comment posting (CI output only)
- No auto-fix or commit rewriting
- PR mode requires `pull_request` event; push mode requires `push` event
- Range/SHA modes require `fetch-depth: 0` in checkout

## License

MIT — see [LICENSE](LICENSE)
