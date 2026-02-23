import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { SimpleSymbolMatcher } from '@engine/lexer/matchers/simple.symbol.matcher'
import { TokenType } from '@engine/syntax/token.types'

describe('SimpleSymbolMatcher', () => {
  const matcher = new SimpleSymbolMatcher()

  it('should match single character symbols', () => {
    const symbols = [
      { char: '{', type: TokenType.LBRACE },
      { char: '}', type: TokenType.RBRACE },
      { char: '(', type: TokenType.LPAREN },
      { char: ')', type: TokenType.RPAREN },
      { char: ':', type: TokenType.COLON },
      { char: ',', type: TokenType.COMMA },
      { char: '+', type: TokenType.VIS_PUB },
      { char: '-', type: TokenType.VIS_PRIV },
      { char: '>', type: TokenType.GT },
    ]

    for (const { char, type } of symbols) {
      const reader = new LexerReader(char)
      const token = matcher.match(reader)
      expect(token?.type).toBe(type)
      expect(token?.value).toBe(char)
    }
  })

  it('should not match unrecognized characters', () => {
    const reader = new LexerReader('α') // non-ASCII, non-symbol
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
