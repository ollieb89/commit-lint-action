const core = require('@actions/core');
const github = require('@actions/github');

const CONVENTIONAL_PATTERN = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?(!)?: .{1,}/;

function parseCommitType(message) {
  const match = message.match(/^([a-z]+)(\([^)]*\))?(!)?: /);
  return match ? match[1] : null;
}

function parseCommitScope(message) {
  const match = message.match(/^[a-z]+\(([^)]*)\)/);
  return match ? match[1] : null;
}

function validateCommit(message, allowedTypes, allowedScopes, minLen, maxLen) {
  const errors = [];
  const firstLine = message.split('\n')[0].trim();

  if (firstLine.length < minLen) {
    errors.push(`Message too short (${firstLine.length} < ${minLen} chars)`);
  }
  if (firstLine.length > maxLen) {
    errors.push(`Message too long (${firstLine.length} > ${maxLen} chars)`);
  }

  if (!CONVENTIONAL_PATTERN.test(firstLine)) {
    const type = parseCommitType(firstLine);
    if (!type) {
      errors.push(`Missing type prefix. Expected format: \`type(scope): description\``);
    } else if (!allowedTypes.includes(type)) {
      errors.push(`Invalid type \`${type}\`. Allowed: ${allowedTypes.map(t => `\`${t}\``).join(', ')}`);
    } else {
      errors.push(`Invalid format. Expected: \`type(scope): description\` or \`type: description\``);
    }
  } else {
    const type = parseCommitType(firstLine);
    if (type && !allowedTypes.includes(type)) {
      errors.push(`Invalid type \`${type}\`. Allowed: ${allowedTypes.map(t => `\`${t}\``).join(', ')}`);
    }
    if (allowedScopes.length > 0) {
      const scope = parseCommitScope(firstLine);
      if (scope && !allowedScopes.includes(scope)) {
        errors.push(`Invalid scope \`${scope}\`. Allowed: ${allowedScopes.map(s => `\`${s}\``).join(', ')}`);
      }
    }
  }

  return errors;
}

async function run() {
  try {
    const token = core.getInput('token');
    const failOnError = core.getInput('fail-on-error') === 'true';
    const postComment = core.getInput('post-comment') === 'true';
    const typesInput = core.getInput('types');
    const scopesInput = core.getInput('scopes');
    const minLength = parseInt(core.getInput('min-length'), 10);
    const maxLength = parseInt(core.getInput('max-length'), 10);

    const allowedTypes = typesInput.split(',').map(t => t.trim()).filter(Boolean);
    const allowedScopes = scopesInput ? scopesInput.split(',').map(s => s.trim()).filter(Boolean) : [];

    const octokit = github.getOctokit(token);
    const context = github.context;

    let commits = [];

    if (context.eventName === 'pull_request') {
      const { data } = await octokit.rest.pulls.listCommits({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.payload.pull_request.number,
        per_page: 100,
      });
      commits = data.map(c => ({ sha: c.sha.substring(0, 7), message: c.commit.message }));
    } else if (context.eventName === 'push') {
      commits = (context.payload.commits || []).map(c => ({
        sha: c.id.substring(0, 7),
        message: c.message,
      }));
    } else {
      core.warning(`Event ${context.eventName} not fully supported. Skipping.`);
      core.setOutput('valid', 'true');
      core.setOutput('invalid-count', '0');
      core.setOutput('total-count', '0');
      return;
    }

    if (commits.length === 0) {
      core.info('No commits to lint.');
      core.setOutput('valid', 'true');
      core.setOutput('invalid-count', '0');
      core.setOutput('total-count', '0');
      return;
    }

    let invalidCount = 0;
    const results = [];

    for (const commit of commits) {
      const errors = validateCommit(commit.message, allowedTypes, allowedScopes, minLength, maxLength);
      const valid = errors.length === 0;
      if (!valid) invalidCount++;
      results.push({ ...commit, valid, errors });
    }

    const allValid = invalidCount === 0;

    // Summary
    core.summary
      .addHeading('📋 Commit Lint Results')
      .addTable([
        [{ data: 'SHA', header: true }, { data: 'Status', header: true }, { data: 'Commit Message', header: true }, { data: 'Issues', header: true }],
        ...results.map(r => [
          r.sha,
          r.valid ? '✅ Valid' : '❌ Invalid',
          r.message.split('\n')[0].substring(0, 72),
          r.errors.join('; ') || '—',
        ])
      ])
      .addRaw(`\n**${commits.length - invalidCount}/${commits.length}** commits passed conventional format check.`)
      .write();

    // PR Comment
    if (postComment && context.eventName === 'pull_request') {
      const body = buildComment(results, commits.length, invalidCount, allowedTypes);
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
      });
      const existing = comments.find(c => c.body.includes('<!-- commit-lint-action -->'));
      if (existing) {
        await octokit.rest.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: existing.id,
          body,
        });
      } else {
        await octokit.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.payload.pull_request.number,
          body,
        });
      }
    }

    core.setOutput('valid', String(allValid));
    core.setOutput('invalid-count', String(invalidCount));
    core.setOutput('total-count', String(commits.length));

    if (!allValid && failOnError) {
      core.setFailed(`❌ ${invalidCount} commit(s) do not follow conventional commit format.`);
    } else if (!allValid) {
      core.warning(`⚠️ ${invalidCount} commit(s) do not follow conventional commit format.`);
    } else {
      core.info(`✅ All ${commits.length} commit(s) follow conventional format.`);
    }

  } catch (err) {
    core.setFailed(`Action failed: ${err.message}`);
  }
}

function buildComment(results, total, invalidCount, allowedTypes) {
  const allValid = invalidCount === 0;
  const status = allValid ? '✅ All commits pass' : `❌ ${invalidCount}/${total} commits fail`;
  const rows = results.map(r => {
    const icon = r.valid ? '✅' : '❌';
    const msg = r.message.split('\n')[0].substring(0, 72);
    const issues = r.errors.length ? r.errors.map(e => `- ${e}`).join('\n') : '';
    return `| ${icon} | \`${r.sha}\` | ${msg} | ${issues || '—'} |`;
  }).join('\n');

  return `<!-- commit-lint-action -->
## 📋 Commit Lint — ${status}

| | SHA | Message | Issues |
|---|---|---|---|
${rows}

${allValid
  ? '🎉 All commits follow [Conventional Commits](https://www.conventionalcommits.org/) format!'
  : `**Fix your commits** to use format: \`type(scope): description\`\n\nAllowed types: ${allowedTypes.map(t => `\`${t}\``).join(', ')}`
}
`;
}

run();
