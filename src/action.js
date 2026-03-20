const core = require('@actions/core');
const CommitValidator = require('./validator');

class Action {
  constructor(github) {
    this.github = github;
  }

  getInputs() {
    const types = (core.getInput('types') || '').split(',').filter(t => t.trim());
    const scopes = (core.getInput('scopes') || '').split(',').filter(s => s.trim());
    
    return {
      types: types.length > 0 ? types : ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'],
      scopes,
      allowMergeCommits: core.getInput('allow-merge-commits') === 'true',
      allowRevert: core.getInput('allow-revert') !== 'false',
    };
  }

  async run() {
    try {
      const context = this.github.context;
      
      if (context.eventName !== 'pull_request') {
        core.info('Action only runs on pull_request events. Skipping.');
        return;
      }

      const inputs = this.getInputs();
      const prNumber = context.payload.pull_request.number;
      
      core.info(`Validating commits for PR #${prNumber}`);
      core.info(`Allowed types: ${inputs.types.join(', ')}`);
      if (inputs.scopes.length > 0) {
        core.info(`Allowed scopes: ${inputs.scopes.join(', ')}`);
      }

      // Fetch commits from PR
      const { data: commits } = await this.github.rest.pulls.listCommits({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber,
      });

      if (commits.length === 0) {
        core.info('No commits to validate');
        return;
      }

      const validationResults = commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        isValid: CommitValidator.isValid(commit.commit.message, inputs),
        errors: CommitValidator.getErrors(commit.commit.message, inputs),
      }));

      const failedCommits = validationResults.filter(r => !r.isValid);

      if (failedCommits.length === 0) {
        core.info(`✓ All ${commits.length} commits follow Conventional Commits format`);
        return;
      }

      // Report failures
      const summary = `❌ ${failedCommits.length} of ${commits.length} commits do not follow Conventional Commits format`;
      
      let details = summary + '\n\n';
      failedCommits.forEach((result, idx) => {
        details += `**Commit ${idx + 1}:** \`${result.sha.slice(0, 7)}\`\n`;
        result.errors.forEach(err => {
          details += `  - ${err}\n`;
        });
        details += `\n**Message:** ${result.message.split('\n')[0]}\n\n`;
      });

      details += '\n**Format:** `<type>(<scope>): <subject>`\n';
      details += `**Examples:**\n  - \`feat: add user authentication\`\n  - \`fix(api): resolve null pointer\`\n`;

      core.setFailed(summary);
      core.notice(details);
    } catch (error) {
      core.setFailed(`Action failed: ${error.message}`);
    }
  }
}

module.exports = Action;
