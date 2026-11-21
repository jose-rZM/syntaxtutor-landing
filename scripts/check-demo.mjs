// Checks without a browser:
//  1. The demo state machine follows the B -> B1 -> B2 -> B' paths of
//     LLTutorWindow and accepts/rejects answers like ParseSymbolList.
//  2. The download links hard-coded in index.html (no-JS fallback) match
//     src/config.js.
// Run with: npm run check

import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createTutor, parseSymbolList } from '../src/demo-tutor.js';
import { DOWNLOADS, LINKS, TRACKED_SECTIONS } from '../src/config.js';

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

function run(answers) {
  const t = createTutor();
  const trace = [];
  for (const a of answers) {
    trace.push(`${t.ruleIndex}:${t.state}`);
    const r = t.answer(a);
    trace.push(r.correct ? 'ok' : 'ko');
  }
  return { t, trace };
}

test('parser: commas, spaces and duplicates', () => {
  assert.deepEqual([...parseSymbolList(' $ , ) ').set], ['$', ')']);
  assert.equal(parseSymbolList('$ )').separatorError, true);
  assert.equal(parseSymbolList('$,)').separatorError, false);
  assert.deepEqual([...parseSymbolList('+,+').duplicates], ['+']);
  assert.equal(parseSymbolList('').set.size, 0);
});

test('all correct: two questions, no sub-questions', () => {
  const { t, trace } = run(['+', '), $']);
  assert.deepEqual(trace, ['0:B', 'ok', '1:B', 'ok']);
  assert.equal(t.done, true);
  assert.equal(t.right, 2);
  assert.equal(t.wrong, 0);
});

test('wrong SD opens CAB, then SIG (also when not needed), then SD again', () => {
  const { trace } = run(['a', '+', '$,)', '+']);
  assert.deepEqual(trace, ['0:B', 'ko', '0:B1', 'ok', '0:B2', 'ok', '0:BP', 'ok']);
});

test('CAB and SIG repeat until correct; B\' always advances', () => {
  const { t, trace } = run(['', 'x', '+', '$', '$,)', 'nope']);
  assert.deepEqual(trace, [
    '0:B', 'ko', '0:B1', 'ko', '0:B1', 'ok', '0:B2', 'ko', '0:B2', 'ok', '0:BP', 'ko',
  ]);
  assert.equal(t.ruleIndex, 1);
  assert.equal(t.state, 'B');
});

test('epsilon rule: CAB answer is EPSILON; SD rejects EPSILON', () => {
  const t = createTutor();
  t.answer('+');
  const r = t.answer('EPSILON');
  assert.equal(r.correct, false);
  assert.match(r.feedback, /^Has introducido EPSILON/);
  assert.equal(t.answer('EPSILON').correct, true); // B1
  assert.equal(t.answer('$,)').correct, true); // B2
  assert.equal(t.answer('$,)').correct, true); // B'
  assert.equal(t.done, true);
});

test('feedback texts match the app for typical mistakes', () => {
  const t = createTutor();
  let r = t.answer('+ T');
  assert.match(r.feedback, /^Parece que no has separado los símbolos con comas correctamente\./);
  r = t.answer('+,T');
  assert.match(r.feedback, /Resultado: \{ \+ \}$/);
  t.answer('+');
  r = t.answer('$');
  assert.match(r.feedback, /^Te han faltado símbolos\.\nCuando CAB\(α\) contiene ε, se necesita SIG\(E'\)/);
  t.answer('$,)');
  r = t.answer('+,$');
  assert.match(r.feedback, /^Estos no son símbolos directores válidos: \$\.\n/);
});

test('index.html download and doc links match config.js', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const d of Object.values(DOWNLOADS)) assert.ok(html.includes(d.url), d.url);
  for (const key of ['repo', 'releases', 'manualEs', 'manualEn', 'devDocs', 'license', 'author']) {
    assert.ok(html.includes(LINKS[key]), LINKS[key]);
  }
});

test('every tracked section exists in index.html', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of Object.values(TRACKED_SECTIONS)) assert.ok(html.includes(`<section id="${id}"`), id);
});

console.log(`\n${passed} checks passed`);
