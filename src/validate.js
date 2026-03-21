/**
 * Conventional Commit Message Validator
 * Supports: type: subject | type(scope): subject | type!: subject | type(scope)!: subject
 */

const DEFAULT_TYPES = ['feat','fix','docs','style','refactor','perf','test','build','ci','chore','revert'];

/**
 * @param {string} message - Commit message (first line used)
 * @param {object} opts
 * @param {string[]} opts.types - Allowed types
 * @param {boolean} opts.requireScope - Require scope
 * @param {boolean} opts.allowBreaking - Allow ! breaking marker
 * @param {number} opts.minSubjectLength - Min subject length
 * @param {number} opts.maxSubjectLength - Max subject length
 * @returns {{ valid: boolean, errors: string[], parsed?: object }}
 */
function validate(message, opts = {}) {
  const {
    types = DEFAULT_TYPES,
    requireScope = false,
    allowBreaking = true,
    minSubjectLength = 3,
    maxSubjectLength = 72,
  } = opts;

  const firstLine = (message || '').split('\n')[0].trim();
  const errors = [];

  if (!firstLine) {
    return { valid: false, errors: ['Commit message is empty'] };
  }

  // Allow merge commits
  if (/^Merge /.test(firstLine)) {
    return { valid: true, errors: [], parsed: { type: 'merge', scope: null, breaking: false, subject: firstLine } };
  }

  // Pattern: type(scope)!: subject
  const pattern = /^([a-zA-Z]+)(?:\(([^)]*)\))?(!)?\s*:\s*(.*)$/;
  const match = firstLine.match(pattern);

  if (!match) {
    errors.push('Does not match conventional commit format: type[(scope)][!]: subject');
    return { valid: false, errors };
  }

  const [, rawType, scope, breaking, subject] = match;
  const type = rawType.toLowerCase();

  // Validate type
  if (rawType !== type) {
    errors.push(`Type must be lowercase (got "${rawType}")`);
  }
  if (!types.includes(type)) {
    errors.push(`Unknown type "${type}". Allowed: ${types.join(', ')}`);
  }

  // Validate scope
  if (requireScope && !scope) {
    errors.push('Scope is required (e.g. feat(auth): ...)');
  }
  if (scope !== undefined && scope !== null && !/^[a-zA-Z0-9._-]+$/.test(scope) && scope !== '') {
    errors.push(`Invalid scope "${scope}". Use alphanumeric, dots, hyphens, underscores.`);
  }
  if (scope === '') {
    errors.push('Empty scope. Remove parentheses or add a scope name.');
  }

  // Validate breaking marker
  if (breaking && !allowBreaking) {
    errors.push('Breaking changes (!) are not allowed');
  }

  // Validate subject
  if (!subject || subject.trim().length === 0) {
    errors.push('Subject is empty');
  } else {
    const trimmed = subject.trim();
    if (trimmed.length < minSubjectLength) {
      errors.push(`Subject too short (${trimmed.length} < ${minSubjectLength})`);
    }
    if (trimmed.length > maxSubjectLength) {
      errors.push(`Subject too long (${trimmed.length} > ${maxSubjectLength})`);
    }
  }

  const parsed = {
    type,
    scope: scope || null,
    breaking: !!breaking,
    subject: (subject || '').trim(),
  };

  return { valid: errors.length === 0, errors, parsed };
}

module.exports = { validate, DEFAULT_TYPES };
