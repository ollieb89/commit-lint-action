/**
 * Validates commit messages against Conventional Commits format
 * https://www.conventionalcommits.org/
 */

class CommitValidator {
  static isValid(message, options = {}) {
    const {
      types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'],
      scopes = [],
      allowMergeCommits = false,
      allowRevert = true,
    } = options;

    const firstLine = message.split('\n')[0].trim();

    // Allow merge commits
    if (allowMergeCommits && /^Merge /.test(firstLine)) {
      return true;
    }

    // Allow revert
    if (allowRevert && /^revert/.test(firstLine.toLowerCase())) {
      return true;
    }

    // Conventional commit pattern: type(scope?): subject
    // - type: from allowed list
    // - scope: optional, alphanumeric with hyphens
    // - subject: lowercase, no leading space, <50 chars
    
    let scopePart;
    if (scopes.length > 0) {
      scopePart = `(${scopes.join('|')})?`;
    } else {
      scopePart = '([a-z0-9-]*)?';
    }
    
    const pattern = new RegExp(
      `^(${types.join('|')})${scopePart}: [a-z][a-z0-9\\s.,!?-]{0,48}$`
    );

    return pattern.test(firstLine);
  }

  static getErrors(message, options = {}) {
    if (this.isValid(message, options)) {
      return [];
    }

    const errors = [];
    const firstLine = message.split('\n')[0].trim();
    const {
      types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'],
      scopes = [],
    } = options;

    if (firstLine.length === 0) {
      errors.push('Commit message is empty');
      return errors;
    }

    if (!firstLine.includes(':')) {
      errors.push('Missing `:` separator between type and subject');
    }

    const typeMatch = firstLine.match(/^([a-z-]+)/);
    if (!typeMatch || !types.includes(typeMatch[1])) {
      errors.push(`Invalid type. Allowed: ${types.join(', ')}`);
    }

    if (firstLine.match(/^[A-Z]/)) {
      errors.push('Type must be lowercase');
    }

    if (scopes.length > 0) {
      const scopeMatch = firstLine.match(/^\w+\(([^)]+)\)/);
      if (scopeMatch && !scopes.includes(scopeMatch[1])) {
        errors.push(`Invalid scope. Allowed: ${scopes.join(', ')}`);
      }
    }

    if (firstLine.match(/: [A-Z]/)) {
      errors.push('Subject must start with lowercase letter');
    }

    if (firstLine.length > 72) {
      errors.push(`Subject too long (${firstLine.length} > 72 characters)`);
    }

    return errors.length > 0 ? errors : ['Does not match Conventional Commits format'];
  }
}

module.exports = CommitValidator;
