import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import type { Token } from '@engine/syntax/token.types'
import { TokenType } from '@engine/syntax/token.types'

/**
 * Matches single character symbols
 */
export class SimpleSymbolMatcher implements TokenMatcher {
  private readonly SYMBOLS: Record<string, TokenType> = {
    '{': TokenType.LBRACE,
    '}': TokenType.RBRACE,
    '(': TokenType.LPAREN,
    ')': TokenType.RPAREN,
    '[': TokenType.LBRACKET,
    ']': TokenType.RBRACKET,
    ':': TokenType.COLON,
    ',': TokenType.COMMA,
    '.': TokenType.DOT,
    '|': TokenType.PIPE,
    '*': TokenType.MOD_ABSTRACT,
    '+': TokenType.VIS_PUB,
    '-': TokenType.VIS_PRIV,
    '#': TokenType.VIS_PROT,
    '~': TokenType.VIS_PACK,
    $: TokenType.MOD_STATIC,
    '&': TokenType.MOD_ACTIVE,
    '<': TokenType.LT,
    '>': TokenType.GT,
    '?': TokenType.QUESTION,
    '@': TokenType.AT,
    '!': TokenType.MOD_LEAF,
    '^': TokenType.MOD_ROOT,
    '=': TokenType.EQUALS,
  }

  public match(reader: LexerReader): Token | null {
    const char = reader.peek()
    const type = this.SYMBOLS[char]

    if (type) {
      const startLine = reader.getLine()
      const startColumn = reader.getColumn()
      return { type, value: reader.advance(), line: startLine, column: startColumn }
    }

    return null
  }
}
