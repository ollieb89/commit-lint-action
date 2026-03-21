/**
 * Commit fetching logic for different modes
 */
const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');

/**
 * Fetch commits based on mode
 * @param {string} mode - pr|push|sha|range
 * @param {object} octokit - GitHub API client
 * @param {object} opts - Additional options (sha, range)
 * @returns {Promise<Array<{sha: string, message: string}>>}
 */
async function getCommits(mode, octokit, opts = {}) {
  const context = github.context;

  switch (mode) {
    case 'pr': {
      if (context.eventName !== 'pull_request' && context.eventName !== 'pull_request_target') {
        throw new Error(`PR mode requires pull_request event (got ${context.eventName}). Use mode: push, sha, or range.`);
      }
      const prNumber = context.payload.pull_request?.number;
      if (!prNumber) throw new Error('No PR number found in event payload');

      const { data } = await octokit.rest.pulls.listCommits({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber,
        per_page: 250,
      });
      return data.map(c => ({ sha: c.sha, message: c.commit.message }));
    }

    case 'push': {
      if (context.eventName !== 'push') {
        throw new Error(`Push mode requires push event (got ${context.eventName}). Use mode: pr, sha, or range.`);
      }
      const before = context.payload.before;
      const after = context.payload.after;
      if (!before || !after) throw new Error('Missing before/after refs in push payload');

      // Use git log for the range
      const output = execSync(`git log --format="%H %s" ${before}..${after}`, { encoding: 'utf-8' }).trim();
      if (!output) return [];
      return output.split('\n').map(line => {
        const [sha, ...rest] = line.split(' ');
        return { sha, message: rest.join(' ') };
      });
    }

    case 'sha': {
      const sha = opts.sha;
      if (!sha) throw new Error('SHA mode requires sha input');
      const output = execSync(`git log --format="%H %s" -1 ${sha}`, { encoding: 'utf-8' }).trim();
      const [commitSha, ...rest] = output.split(' ');
      return [{ sha: commitSha, message: rest.join(' ') }];
    }

    case 'range': {
      const range = opts.range;
      if (!range) throw new Error('Range mode requires range input (e.g. HEAD~3..HEAD)');
      const output = execSync(`git log --format="%H|||%s" ${range}`, { encoding: 'utf-8' }).trim();
      if (!output) return [];
      return output.split('\n').map(line => {
        const [sha, message] = line.split('|||');
        return { sha: sha.trim(), message: (message || '').trim() };
      });
    }

    default:
      throw new Error(`Unknown mode "${mode}". Use: pr, push, sha, or range.`);
  }
}

module.exports = { getCommits };
