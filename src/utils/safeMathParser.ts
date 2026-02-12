/**
 * Safe recursive descent math expression parser.
 * Supports: +, -, *, /, parentheses, and numeric literals.
 * Does NOT use eval() or new Function().
 */

type Token = { type: "number"; value: number } | { type: "op"; value: string } | { type: "paren"; value: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", value: ch });
      i++;
    } else if (ch === "+" || ch === "*" || ch === "/") {
      tokens.push({ type: "op", value: ch });
      i++;
    } else if (ch === "-") {
      // Unary minus: if first token or preceded by operator/open paren
      const prev = tokens[tokens.length - 1];
      if (!prev || (prev.type === "op") || (prev.type === "paren" && prev.value === "(")) {
        // Parse as part of number
        let num = "-";
        i++;
        while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
          num += expr[i]; i++;
        }
        if (num === "-") {
          // standalone minus with no digits — treat as op
          tokens.push({ type: "op", value: "-" });
        } else {
          tokens.push({ type: "number", value: parseFloat(num) });
        }
      } else {
        tokens.push({ type: "op", value: "-" });
        i++;
      }
    } else if (/[\d.]/.test(ch)) {
      let num = "";
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
        num += expr[i]; i++;
      }
      tokens.push({ type: "number", value: parseFloat(num) });
    } else {
      throw new Error(`Unexpected character: ${ch}`);
    }
  }
  return tokens;
}

/**
 * Grammar:
 *   expr   → term (('+' | '-') term)*
 *   term   → factor (('*' | '/') factor)*
 *   factor → '(' expr ')' | number
 */
function parseExpr(tokens: Token[], pos: { i: number }): number {
  let left = parseTerm(tokens, pos);
  while (pos.i < tokens.length) {
    const tok = tokens[pos.i];
    if (tok.type === "op" && (tok.value === "+" || tok.value === "-")) {
      pos.i++;
      const right = parseTerm(tokens, pos);
      left = tok.value === "+" ? left + right : left - right;
    } else {
      break;
    }
  }
  return left;
}

function parseTerm(tokens: Token[], pos: { i: number }): number {
  let left = parseFactor(tokens, pos);
  while (pos.i < tokens.length) {
    const tok = tokens[pos.i];
    if (tok.type === "op" && (tok.value === "*" || tok.value === "/")) {
      pos.i++;
      const right = parseFactor(tokens, pos);
      if (tok.value === "/") {
        if (right === 0) throw new Error("Division by zero");
        left = left / right;
      } else {
        left = left * right;
      }
    } else {
      break;
    }
  }
  return left;
}

function parseFactor(tokens: Token[], pos: { i: number }): number {
  const tok = tokens[pos.i];
  if (!tok) throw new Error("Unexpected end of expression");

  if (tok.type === "paren" && tok.value === "(") {
    pos.i++;
    const result = parseExpr(tokens, pos);
    if (pos.i >= tokens.length || tokens[pos.i].value !== ")") {
      throw new Error("Missing closing parenthesis");
    }
    pos.i++;
    return result;
  }

  if (tok.type === "number") {
    pos.i++;
    return tok.value;
  }

  throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
}

/**
 * Safely evaluate a mathematical expression string.
 * Returns the numeric result or null on error.
 */
export function safeEvaluateMath(expression: string): number | null {
  try {
    const tokens = tokenize(expression);
    if (tokens.length === 0) return null;
    const pos = { i: 0 };
    const result = parseExpr(tokens, pos);
    if (pos.i !== tokens.length) return null; // leftover tokens
    if (!isFinite(result) || isNaN(result)) return null;
    return Math.round(result * 1e10) / 1e10; // avoid floating point noise
  } catch {
    return null;
  }
}
