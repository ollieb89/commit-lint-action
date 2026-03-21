const core = require('@actions/core');
const github = require('@actions/github');
const { validate, DEFAULT_TYPES } = require('./validate');
const { getCommits } = require('./commits');

async function main() {
  try {
    // Parse inputs
    const mode = core.getInput('mode') || 'pr';
    const typesInput = core.getInput('types');
    const types = typesInput ? typesInput.split(',').map(t => t.trim()).filter(Boolean) : DEFAULT_TYPES;
    const requireScope = core.getInput('requireScope') === 'true';
    const allowBreaking = core.getInput('allowBreaking') !== 'false';
    const minSubjectLength = parseInt(core.getInput('minSubjectLength') || '3', 10);
    const maxSubjectLength = parseInt(core.getInput('maxSubjectLength') || '72', 10);
    const token = core.getInput('githubToken') || process.env.GITHUB_TOKEN;
    const sha = core.getInput('sha');
    const range = core.getInput('range');

    if (!token && (mode === 'pr')) {
      throw new Error('githubToken is required for PR mode');
    }

    const octokit = token ? github.getOctokit(token) : null;
    const opts = { types, requireScope, allowBreaking, minSubjectLength, maxSubjectLength };

    core.info(`Mode: ${mode}`);
    core.info(`Allowed types: ${types.join(', ')}`);
    core.info(`Require scope: ${requireScope}`);
    core.info(`Allow breaking: ${allowBreaking}`);
    core.info(`Subject length: ${minSubjectLength}-${maxSubjectLength}`);

    // Fetch commits
    const commits = await getCommits(mode, octokit, { sha, range });

    if (commits.length === 0) {
      core.info('No commits to validate');
      return;
    }

    core.info(`Validating ${commits.length} commit(s)...`);

    // Validate each commit
    const results = commits.map(c => ({
      sha: c.sha,
      message: c.message.split('\n')[0],
      ...validate(c.message, opts),
    }));

    const failures = results.filter(r => !r.valid);

    if (failures.length === 0) {
      core.info(`✅ All ${commits.length} commit(s) follow Conventional Commits format`);
      return;
    }

    // Report failures
    let output = `\n❌ ${failures.length} of ${commits.length} commit(s) failed validation:\n\n`;

    for (const f of failures) {
      output += `  ${f.sha.slice(0, 7)} — ${f.message}\n`;
      for (const err of f.errors) {
        output += `    ⚠ ${err}\n`;
      }
      output += '\n';
    }

    output += `Valid examples:\n`;
    output += `  feat: add user authentication\n`;
    output += `  fix(api): resolve null pointer\n`;
    output += `  docs: update installation guide\n`;

    core.setFailed(`${failures.length} commit(s) have invalid messages`);
    core.info(output);

  } catch (error) {
    core.setFailed(`commit-lint-action failed: ${error.message}`);
  }
}

main();
