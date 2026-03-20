# commit-lint-action Design Spec

## Overview
A lightweight GitHub Action that validates commit messages against the Conventional Commits format on pull requests. Fails PR checks if any commits violate the format, with clear inline feedback.

## Purpose & Success Criteria
- **Purpose:** Enforce consistent commit message format across repositories
- **Users:** Teams/projects that adopt conventional commits for better changelog automation and code history readability
- **Success:** Action runs, validates commits, provides clear failure messages, integrates with GitHub PR workflow

## Architecture

### Core Components
1. **Input Validation** — Parse action inputs (scopes, types, allow-merge-commits)
2. **Commit Fetcher** — Get commit messages from PR (using GitHub API)
3. **Validator** — Check each commit against conventional commit regex
4. **Reporter** — Output results as PR check status + annotations

### Conventional Commit Format
```
<type>(<scope>?): <subject>

<body?>

<footer?>
```
- **type:** feat, fix, docs, style, refactor, perf, test, chore (configurable)
- **scope:** optional, in parentheses
- **subject:** imperative, lowercase, <50 chars
- **body/footer:** optional, free-form

### Data Flow
1. Action receives PR event
2. Fetch all commits in PR via GitHub API
3. For each commit, extract message and validate against pattern
4. Report pass/fail as PR check
5. If any fail, output annotations (file/line/message) for developer feedback

## Configuration
Users will configure via `action.yml` inputs:
- `types` — comma-separated list of allowed commit types (default: feat,fix,docs,style,refactor,perf,test,chore)
- `scopes` — optional whitelist of scopes (default: any)
- `allow-merge-commits` — boolean (default: false)
- `allow-revert` — boolean (default: true)

## Output
- **PR Check:** Pass/Fail status
- **Annotations:** Per-commit violations with line numbers and message
- **Log:** Detailed validation results in action output

## Error Handling
- Invalid PR context → fail gracefully with helpful error
- API rate limit → retry with exponential backoff
- Malformed config → fail with validation error message

## Implementation Stack
- **Language:** JavaScript (Node.js, no external dependencies beyond @actions/github and @actions/core)
- **Action Type:** Composite action
- **Trigger:** `pull_request` event

## Testing
- Unit tests for validator regex
- Integration test with mock PR data
- CI via workflow-guardian

## MVP Constraints
- Single language (English error messages)
- No custom regex override (predefined types only)
- Validates against strict conventional commits spec v1.0.0
