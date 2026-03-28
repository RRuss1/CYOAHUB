/**
 * ============================================================
 * app/formulaEngine.js — Safe Formula Parser & Evaluator
 * CYOAhub
 * ============================================================
 * Parses config-defined formulas like "base + str * 10" or
 * "max(awa, pre) + 2" without using eval(). Whitelist-only
 * tokenizer with recursive-descent parser.
 *
 * Loaded AFTER configDefaults.js, BEFORE configResolver.js.
 *
 * Usage:
 *   FormulaEngine.evaluate("base + str * 2", { base: 10, str: 3 })
 *   // => 16
 *
 *   FormulaEngine.evaluate("max(awa, pre) + 2", { awa: 3, pre: 5 })
 *   // => 7
 * ============================================================
 */

(function () {
  'use strict';

  // Allowed functions (whitelist)
  const FUNCTIONS = {
    max: Math.max,
    min: Math.min,
    floor: Math.floor,
    ceil: Math.ceil,
    abs: Math.abs,
    round: Math.round,
  };

  // Token types
  const T = { NUM: 'NUM', VAR: 'VAR', OP: 'OP', FUNC: 'FUNC', LPAREN: '(', RPAREN: ')', COMMA: ',' };

  function tokenize(formula) {
    const tokens = [];
    let i = 0;
    const s = formula.trim();

    while (i < s.length) {
      // Skip whitespace
      if (/\s/.test(s[i])) {
        i++;
        continue;
      }

      // Number (int or float)
      if (/[0-9.]/.test(s[i])) {
        let num = '';
        while (i < s.length && /[0-9.]/.test(s[i])) {
          num += s[i++];
        }
        tokens.push({ type: T.NUM, value: parseFloat(num) });
        continue;
      }

      // Operators
      if ('+-*/'.includes(s[i])) {
        tokens.push({ type: T.OP, value: s[i++] });
        continue;
      }

      // Parens / comma
      if (s[i] === '(') {
        tokens.push({ type: T.LPAREN });
        i++;
        continue;
      }
      if (s[i] === ')') {
        tokens.push({ type: T.RPAREN });
        i++;
        continue;
      }
      if (s[i] === ',') {
        tokens.push({ type: T.COMMA });
        i++;
        continue;
      }

      // Identifier (variable or function name)
      if (/[a-zA-Z_]/.test(s[i])) {
        let id = '';
        while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) {
          id += s[i++];
        }
        if (FUNCTIONS[id]) {
          tokens.push({ type: T.FUNC, value: id });
        } else {
          tokens.push({ type: T.VAR, value: id });
        }
        continue;
      }

      // Unknown character — skip
      console.warn(`[FormulaEngine] Unknown character: "${s[i]}" in "${formula}"`);
      i++;
    }

    return tokens;
  }

  // ── Recursive-Descent Parser ──────────────────────────────
  // Grammar:
  //   expr     → term (('+' | '-') term)*
  //   term     → factor (('*' | '/') factor)*
  //   factor   → '-' factor | atom
  //   atom     → NUMBER | VARIABLE | FUNC '(' arglist ')' | '(' expr ')'
  //   arglist  → expr (',' expr)*

  function parse(tokens, context) {
    let pos = 0;

    function peek() {
      return tokens[pos] || null;
    }
    function advance() {
      return tokens[pos++];
    }
    function expect(type) {
      const t = advance();
      if (!t || t.type !== type) throw new Error(`Expected ${type}, got ${t ? t.type : 'EOF'}`);
      return t;
    }

    function parseExpr() {
      let left = parseTerm();
      while (peek() && peek().type === T.OP && (peek().value === '+' || peek().value === '-')) {
        const op = advance().value;
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    }

    function parseTerm() {
      let left = parseFactor();
      while (peek() && peek().type === T.OP && (peek().value === '*' || peek().value === '/')) {
        const op = advance().value;
        const right = parseFactor();
        left = op === '*' ? left * right : right !== 0 ? left / right : 0;
      }
      return left;
    }

    function parseFactor() {
      // Unary minus
      if (peek() && peek().type === T.OP && peek().value === '-') {
        advance();
        return -parseFactor();
      }
      return parseAtom();
    }

    function parseAtom() {
      const t = peek();
      if (!t) throw new Error('Unexpected end of formula');

      // Number literal
      if (t.type === T.NUM) {
        advance();
        return t.value;
      }

      // Function call
      if (t.type === T.FUNC) {
        const fname = advance().value;
        expect(T.LPAREN);
        const args = [parseExpr()];
        while (peek() && peek().type === T.COMMA) {
          advance(); // skip comma
          args.push(parseExpr());
        }
        expect(T.RPAREN);
        return FUNCTIONS[fname](...args);
      }

      // Variable
      if (t.type === T.VAR) {
        const vname = advance().value;
        const val = context[vname];
        if (val === undefined) {
          console.warn(`[FormulaEngine] Unknown variable "${vname}", defaulting to 0`);
          return 0;
        }
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      }

      // Parenthesized expression
      if (t.type === T.LPAREN) {
        advance();
        const val = parseExpr();
        expect(T.RPAREN);
        return val;
      }

      throw new Error(`Unexpected token: ${t.type} = ${t.value}`);
    }

    const result = parseExpr();
    return result;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Evaluate a formula string with a context object.
   * @param {string} formula — e.g. "base + str * 2" or "max(awa, pre) + 2"
   * @param {object} context — variable values, e.g. { base: 10, str: 3, awa: 4, pre: 5 }
   * @returns {number} result
   */
  function evaluate(formula, context) {
    if (typeof formula !== 'string') return typeof formula === 'number' ? formula : 0;
    if (!formula.trim()) return 0;

    try {
      const tokens = tokenize(formula);
      if (!tokens.length) return 0;
      return parse(tokens, context || {});
    } catch (e) {
      console.warn(`[FormulaEngine] Error evaluating "${formula}":`, e.message);
      return 0;
    }
  }

  /**
   * Check if a string looks like a formula (vs a keyword like 'max' or 'spellSlots').
   * Returns true if it contains operators or function calls.
   */
  function isFormula(str) {
    if (typeof str !== 'string') return false;
    return /[+\-*/()]/.test(str) || /\b(max|min|floor|ceil)\s*\(/.test(str);
  }

  window.FormulaEngine = { evaluate, isFormula, FUNCTIONS };
})();
