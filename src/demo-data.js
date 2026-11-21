// Fixed data for the landing demo. Nothing here is computed in the browser.
//
// Grammar (typed in SyntaxTutor's own grammar editor format):
//   E -> T E' .   E' -> + T E' | .   T -> id | ( E ) .
// The editor adds S -> E $.
//
// Sets verified on 2026-11-20 with SyntaxTutor's backend (GrammarParser,
// LL1Parser::First/Follow/PredictionSymbols), see docs/01_decisiones_ux.md:
//   E' -> + T E'   CAB = {+}        SIG(E') = {$, )}   SD = {+}
//   E' -> EPSILON  CAB = {EPSILON}  SIG(E') = {$, )}   SD = {$, )}
//
// Question and feedback texts are copied from src/gui/lltutorwindow.cpp
// (generateQuestion, feedbackForB/B1/B2/BPrime, TeachFollow,
// TeachPredictionSymbols). The app prints set members in hash order; here
// they are in a fixed order.

export const GRAMMAR_FOLLOW_TEXT = (nt) =>
  `Encontrar los símbolos siguientes a ${nt}:\n` +
  `1. Busca las reglas donde ${nt} está en el consecuente:\n` +
  `   - E → T E'\n` +
  `   - E' → + T E'\n` +
  `2. ${nt} está al final de la producción. Agrega SIG(E) = { $ ) } a SIG(${nt})\n` +
  `2. ${nt} está al final de la producción, habría que agregar SIG(${nt}) a SIG(${nt}), pero cae en bucle, por tanto se ignora\n` +
  `3. Conjunto SIG(${nt}) = { $ ) }`;

export const RULES = [
  {
    lhs: "E'",
    rhs: "+ T E'",
    sd: ['+'],
    cab: ['+'],
    sig: ['$', ')'],
    teachSD:
      "Encontrar los símbolos directores de: E' → + T E':\n" +
      '1. Calcula CAB(+ T E\') = { + }\n' +
      "2. Inicializa los símbolos directores con CAB(+ T E') excepto ε: { + }\n" +
      "3. Entonces, los símbolos directores de E' → + T E' son: { + }",
  },
  {
    lhs: "E'",
    rhs: 'EPSILON',
    sd: ['$', ')'],
    cab: ['EPSILON'],
    sig: ['$', ')'],
    teachSD:
      "Encontrar los símbolos directores de: E' → EPSILON:\n" +
      '1. Calcula CAB(EPSILON) = { EPSILON }\n' +
      '2. Inicializa los símbolos directores con CAB(EPSILON) excepto ε: {  }\n' +
      "   - Como ε ∈ CAB(EPSILON), agrega SIG(E') a los símbolos directores.\n" +
      "     SIG(E') = { $ ) }\n" +
      "3. Entonces, los símbolos directores de E' → EPSILON son: { $ ) }",
  },
];
