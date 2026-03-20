const core = require('@actions/core');
const github = require('@actions/github');
const Action = require('./action');

async function main() {
  try {
    const token = core.getInput('token') || process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error('GitHub token not provided. Provide via `token` input or GITHUB_TOKEN env var.');
    }

    const octokit = github.getOctokit(token);
    
    const action = new Action(octokit);
    await action.run();
  } catch (error) {
    core.setFailed(`Commit Lint Action failed: ${error.message}`);
  }
}

main();
