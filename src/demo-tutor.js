// State machine of the demo, without DOM. It mirrors the LL(1) tutor's
// phase B as implemented in LLTutorWindow::updateState:
//   B  (SD of the rule)       correct -> next rule, wrong -> B1
//   B1 (CAB of the RHS)       correct -> B2,        wrong -> B1 again
//   B2 (SIG of the LHS)       correct -> B',        wrong -> B2 again
//   B' (SD again)             always  -> next rule
// Every wrong answer adds the tutor's feedback message before the next
// question. Correct answers add no message (the app only bumps a counter).

import { RULES, GRAMMAR_FOLLOW_TEXT } from './demo-data.js';

// Same rules as ParseSymbolList in lltutorwindow.cpp: split on commas,
// trim, drop empty parts; no comma plus a space is a separator error.
export function parseSymbolList(input) {
  const text = input.trim();
  const separatorError = !text.includes(',') && text.includes(' ');
  const set = new Set();
  const duplicates = new Set();
  for (const part of text.split(',')) {
    const cleaned = part.trim();
    if (!cleaned) continue;
    if (set.has(cleaned)) duplicates.add(cleaned);
    set.add(cleaned);
  }
  return { text, separatorError, set, duplicates };
}

const sameSet = (set, list) =>
  set.size === list.length && list.every((s) => set.has(s));

const diff = (a, b) => [...a].filter((x) => !b.has(x));

function question(state, rule) {
  const r = `${rule.lhs} → ${rule.rhs}`;
  switch (state) {
    case 'B':
      return `¿Cuáles son los símbolos directores (SD) de esta regla?\n${r}\nFormato: a,b,c`;
    case 'B1':
      return `¿Cuál es el conjunto cabecera (CAB) del consecuente?\n${r}\nFormato: a,b,c`;
    case 'B2':
      return `¿Cuál es el conjunto SIG (símbolos siguientes) del antecedente?\n${r}\nFormato: a,b,c`;
    default:
      return `Entonces, ¿cuáles son los símbolos directores (SD) de la regla?\n${r}\nFormato: a,b,c`;
  }
}

function dupText(p) {
  return p.duplicates.size ? `Has repetido símbolos: ${[...p.duplicates].join(', ')}.\n` : '';
}

function feedbackB(p, rule) {
  const base =
    'Para una regla X → Y, sus símbolos directores (SD) indican en qué columnas debe colocarse la producción en la tabla LL(1).\n' +
    'La fórmula es: SD(X → Y) = CAB(Y) - {ε} ∪ SIG(X) si ε ∈ CAB(Y)';
  if (!p.text) return 'No has indicado ningún símbolo director.\n' + base;
  if (p.separatorError) return 'Parece que no has separado los símbolos con comas correctamente.\n' + base;
  if (p.set.has('EPSILON')) return 'Has introducido EPSILON, los símbolos directores no pueden contenerlo.\n' + base;
  const sol = new Set(rule.sd);
  let msg = '';
  if (diff(sol, p.set).length) msg += 'Te han faltado símbolos.\n';
  const rest = diff(p.set, sol);
  if (rest.length) msg += `Has incluido símbolos que no corresponden: ${rest.join(', ')}.\n`;
  return msg + dupText(p) + base;
}

function feedbackB1(p, rule) {
  let fmt = '';
  if (p.text && p.separatorError) fmt += 'Recuerda separar los símbolos con comas.\n';
  fmt += dupText(p);
  return (
    fmt +
    `Se calcula CABECERA del consecuente: CAB(${rule.rhs})\n` +
    `Con esto se obtienen los terminales que pueden aparecer al comenzar a derivar ${rule.rhs}.\n` +
    `Resultado: { ${rule.cab.join(', ')} }`
  );
}

function feedbackB2(p, rule) {
  const nt = rule.lhs;
  const base =
    `Cuando CAB(α) contiene ε, se necesita SIG(${nt}) para completar los símbolos directores.\n` +
    GRAMMAR_FOLLOW_TEXT(nt);
  if (!p.text) return `No has indicado ningún símbolo de SIG(${nt}).\n` + base;
  if (p.separatorError) return `Recuerda separar los símbolos de SIG(${nt}) con comas.\n` + base;
  const sol = new Set(rule.sig);
  let msg = '';
  if (diff(sol, p.set).length) msg += 'Te han faltado símbolos.\n';
  const rest = diff(p.set, sol);
  if (rest.length) msg += `No forman parte de SIG(${nt}): ${rest.join(', ')}.\n`;
  return msg + dupText(p) + base;
}

function feedbackBPrime(p, rule) {
  const base =
    'Un símbolo director indica cuándo se puede aplicar una producción durante el análisis.\n' +
    rule.teachSD;
  if (!p.text) return 'No has indicado ningún símbolo director.\n' + base;
  if (p.separatorError) return 'No has seguido el formato indicado (símbolos separados por coma).\n' + base;
  const sol = new Set(rule.sd);
  let msg = '';
  const missing = diff(sol, p.set);
  if (missing.length) msg += `Te han faltado estos símbolos directores: ${missing.join(', ')}.\n`;
  const rest = diff(p.set, sol);
  if (rest.length) msg += `Estos no son símbolos directores válidos: ${rest.join(', ')}.\n`;
  return msg + dupText(p) + base;
}

const SOLUTION = { B: 'sd', B1: 'cab', B2: 'sig', BP: 'sd' };
const FEEDBACK = { B: feedbackB, B1: feedbackB1, B2: feedbackB2, BP: feedbackBPrime };

export function createTutor() {
  let ruleIndex = 0;
  let state = 'B';
  let right = 0;
  let wrong = 0;

  const done = () => ruleIndex >= RULES.length;

  return {
    get state() { return state; },
    get ruleIndex() { return ruleIndex; },
    get right() { return right; },
    get wrong() { return wrong; },
    get done() { return done(); },
    get total() { return RULES.length; },
    currentQuestion() {
      return done() ? null : question(state, RULES[ruleIndex]);
    },
    /** Returns { correct, feedback } where feedback is null when correct. */
    answer(input) {
      if (done()) throw new Error('demo finished');
      const rule = RULES[ruleIndex];
      const p = parseSymbolList(input);
      const correct = !p.separatorError && sameSet(p.set, rule[SOLUTION[state]]);
      const feedback = correct ? null : FEEDBACK[state](p, rule);
      if (correct) right += 1; else wrong += 1;

      switch (state) {
        case 'B':
          if (correct) { ruleIndex += 1; } else { state = 'B1'; }
          break;
        case 'B1':
          if (correct) state = 'B2';
          break;
        case 'B2':
          if (correct) state = 'BP';
          break;
        default:
          ruleIndex += 1;
          state = 'B';
      }
      return { correct, feedback };
    },
  };
}
