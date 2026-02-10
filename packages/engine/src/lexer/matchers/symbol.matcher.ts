import type { TokenMatcher } from '../matcher.types';
import type { LexerReader } from '../lexer.reader';
import type { Token } from '../token.types';
import { TokenType } from '../token.types';

export class SymbolMatcher implements TokenMatcher {
  private readonly SYMBOLS: Record<string, TokenType> = {
    '{': TokenType.LBRACE, '}': TokenType.RBRACE,
    '(': TokenType.LPAREN, ')': TokenType.RPAREN,
    '[': TokenType.LBRACKET, ']': TokenType.RBRACKET,
    ':': TokenType.COLON, ',': TokenType.COMMA,
    '.': TokenType.DOT, '|': TokenType.PIPE,
    '*': TokenType.MOD_ABSTRACT, '+': TokenType.VIS_PUB,
    '-': TokenType.VIS_PRIV, '#': TokenType.VIS_PROT,
    '~': TokenType.VIS_PACK, '$': TokenType.MOD_STATIC,
    '&': TokenType.MOD_ACTIVE,
    '<': TokenType.LT, '>': TokenType.GT
  };

  public match(reader: LexerReader): Token | null {
    const char = reader.peek();
    const startLine = reader.getLine();
    const startColumn = reader.getColumn();

    // Operadores que empiezan con > (Relaciones y KW especiales)
    if (char === '>') {
      const snap = reader.snapshot();
      reader.advance();
      const next = reader.peek();

      if (next === '>') { reader.advance(); return { type: TokenType.OP_INHERIT, value: '>>', line: startLine, column: startColumn }; }
      if (next === 'I') { reader.advance(); return { type: TokenType.OP_IMPLEMENT, value: '>I', line: startLine, column: startColumn }; }
      if (next === '*') { reader.advance(); return { type: TokenType.OP_COMP, value: '>*', line: startLine, column: startColumn }; }
      if (next === '+') { reader.advance(); return { type: TokenType.OP_AGREG, value: '>+', line: startLine, column: startColumn }; }
      if (next === '-') { reader.advance(); return { type: TokenType.OP_USE, value: '>-', line: startLine, column: startColumn }; }

      // Manejo de >extends, >implements, etc.
      if (/[a-zA-Z]/.test(next)) {
        let value = '>';
        while (!reader.isAtEnd() && /[a-zA-Z]/.test(reader.peek())) {
          value += reader.advance();
        }

        const kwMap: Record<string, TokenType> = {
          '>extends': TokenType.KW_EXTENDS,
          '>implements': TokenType.KW_IMPLEMENTS,
          '>comp': TokenType.KW_COMP,
          '>agreg': TokenType.KW_AGREG,
          '>use': TokenType.KW_USE
        };

        const kwType = kwMap[value];
        if (kwType) return { type: kwType, value, line: startLine, column: startColumn };

        // Si no es un keyword especial, devolvemos solo el >
        reader.rollback(snap);
        reader.advance();
        return { type: TokenType.GT, value: '>', line: startLine, column: startColumn };
      }

      return { type: TokenType.GT, value: '>', line: startLine, column: startColumn };
    }

    // Doble carácter ..
    if (char === '.' && reader.peekNext() === '.') {
      reader.advance();
      reader.advance();
      return { type: TokenType.RANGE, value: '..', line: startLine, column: startColumn };
    }

    const symbolType = this.SYMBOLS[char];
    if (symbolType) {
      return { type: symbolType, value: reader.advance(), line: startLine, column: startColumn };
    }

    return null;
  }
}
