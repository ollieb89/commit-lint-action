const { validate } = require('../src/validate');
const assert = require('assert');

let pass = 0, fail = 0;

function test(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; console.error(`FAIL: ${name}\n  ${e.message}`); }
}

test('basic feat', () => { assert.strictEqual(validate('feat: add login page').valid, true); });
test('fix with scope', () => { const r = validate('fix(auth): resolve token issue'); assert.strictEqual(r.valid, true); assert.strictEqual(r.parsed.scope, 'auth'); });
test('breaking change', () => { const r = validate('feat!: remove deprecated API'); assert.strictEqual(r.valid, true); assert.strictEqual(r.parsed.breaking, true); });
test('breaking with scope', () => { const r = validate('fix(api)!: change response format'); assert.strictEqual(r.valid, true); assert.strictEqual(r.parsed.breaking, true); assert.strictEqual(r.parsed.scope, 'api'); });
test('all default types', () => { for (const t of ['feat','fix','docs','style','refactor','perf','test','build','ci','chore','revert']) { assert.strictEqual(validate(`${t}: do something valid`).valid, true, `${t} should be valid`); } });
test('merge commit', () => { assert.strictEqual(validate('Merge branch main into feature').valid, true); });
test('multiline', () => { assert.strictEqual(validate('feat: add feature\n\nBody text').valid, true); });
test('empty message', () => { assert.strictEqual(validate('').valid, false); });
test('no colon', () => { assert.strictEqual(validate('fixed the login bug').valid, false); });
test('unknown type', () => { const r = validate('yolo: ship it'); assert.strictEqual(r.valid, false); assert.ok(r.errors.some(e => e.includes('Unknown type'))); });
test('uppercase type', () => { const r = validate('FEAT: add login'); assert.strictEqual(r.valid, false); assert.ok(r.errors.some(e => e.includes('lowercase'))); });
test('empty subject', () => { const r = validate('feat:'); assert.strictEqual(r.valid, false); });
test('empty scope parens', () => { const r = validate('feat(): add thing'); assert.strictEqual(r.valid, false); assert.ok(r.errors.some(e => e.includes('Empty scope'))); });
test('subject too short', () => { assert.strictEqual(validate('feat: ab', { minSubjectLength: 3 }).valid, false); });
test('subject too long', () => { assert.strictEqual(validate('feat: ' + 'a'.repeat(80), { maxSubjectLength: 72 }).valid, false); });
test('requireScope fails', () => { const r = validate('feat: add login', { requireScope: true }); assert.strictEqual(r.valid, false); assert.ok(r.errors.some(e => e.includes('Scope is required'))); });
test('requireScope passes', () => { assert.strictEqual(validate('feat(ui): add login', { requireScope: true }).valid, true); });
test('allowBreaking=false', () => { const r = validate('feat!: breaking', { allowBreaking: false }); assert.strictEqual(r.valid, false); assert.ok(r.errors.some(e => e.includes('not allowed'))); });
test('custom types reject', () => { assert.strictEqual(validate('feat: add', { types: ['fix','hotfix'] }).valid, false); });
test('custom types accept', () => { assert.strictEqual(validate('hotfix: urgent patch', { types: ['fix','hotfix'] }).valid, true); });

console.log(`\n${pass} passed, ${fail} failed out of ${pass + fail} tests`);
process.exit(fail > 0 ? 1 : 0);
