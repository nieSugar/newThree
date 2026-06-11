const KEYWORDS = new Set([
  'await',
  'break',
  'bool',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'discard',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'highp',
  'if',
  'import',
  'in',
  'instanceof',
  'int',
  'let',
  'float',
  'mat3',
  'mat4',
  'mediump',
  'new',
  'of',
  'precision',
  'return',
  'sampler2D',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'uniform',
  'void',
  'vec2',
  'vec3',
  'vec4',
  'varying',
  'while'
]);

const LITERALS = new Set(['false', 'Infinity', 'NaN', 'null', 'true', 'undefined']);
const NAMESPACES = new Set(['Math', 'RAPIER', 'THREE', 'document', 'navigator', 'window']);

export function highlightSource(source: string): string {
  let html = '';
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index);
      const tokenEnd = end === -1 ? source.length : end;
      html += wrapToken('comment', source.slice(index, tokenEnd));
      index = tokenEnd;
      continue;
    }

    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      const tokenEnd = end === -1 ? source.length : end + 2;
      html += wrapToken('comment', source.slice(index, tokenEnd));
      index = tokenEnd;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      const tokenEnd = readQuotedString(source, index, char);
      html += wrapToken('string', source.slice(index, tokenEnd));
      index = tokenEnd;
      continue;
    }

    if (isNumberStart(char, next)) {
      const tokenEnd = readNumber(source, index);
      html += wrapToken('number', source.slice(index, tokenEnd));
      index = tokenEnd;
      continue;
    }

    if (isIdentifierStart(char)) {
      const tokenEnd = readIdentifier(source, index);
      const word = source.slice(index, tokenEnd);
      const nextCodeChar = source.slice(tokenEnd).match(/\S/)?.[0] ?? '';
      const tokenKind = getIdentifierTokenKind(word, nextCodeChar);
      html += tokenKind ? wrapToken(tokenKind, word) : escapeHtml(word);
      index = tokenEnd;
      continue;
    }

    if (isOperator(char)) {
      html += wrapToken('operator', char);
      index += 1;
      continue;
    }

    html += escapeHtml(char);
    index += 1;
  }

  return html;
}

function readQuotedString(source: string, start: number, quote: string): number {
  let index = start + 1;
  let escaped = false;

  while (index < source.length) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      index += 1;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      index += 1;
      continue;
    }

    if (char === quote) {
      return index + 1;
    }

    index += 1;
  }

  return source.length;
}

function readNumber(source: string, start: number): number {
  let index = start;
  while (index < source.length && /[\d.a-fA-F_xX]/.test(source[index])) {
    index += 1;
  }
  return index;
}

function readIdentifier(source: string, start: number): number {
  let index = start + 1;
  while (index < source.length && /[\w$]/.test(source[index])) {
    index += 1;
  }
  return index;
}

function getIdentifierTokenKind(word: string, nextCodeChar: string): string {
  if (KEYWORDS.has(word)) {
    return 'keyword';
  }

  if (LITERALS.has(word)) {
    return 'literal';
  }

  if (NAMESPACES.has(word)) {
    return 'namespace';
  }

  if (/^[A-Z]/.test(word)) {
    return 'type';
  }

  if (nextCodeChar === '(') {
    return 'function';
  }

  return '';
}

function isNumberStart(char: string, next = ''): boolean {
  return /\d/.test(char) || (char === '.' && /\d/.test(next));
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

function isOperator(char: string): boolean {
  return /[=+\-*%<>!&|?:.,;()[\]{}]/.test(char);
}

function wrapToken(kind: string, value: string): string {
  return `<span class="tok-${kind}">${escapeHtml(value)}</span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
