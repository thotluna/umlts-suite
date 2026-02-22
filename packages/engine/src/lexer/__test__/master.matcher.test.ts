import { describe, it, expect } from 'vitest'
import { LexerReader } from '../lexer.reader'
import { MasterMatcher } from '../matchers/master.matcher'
import { WhitespaceMatcher } from '../matchers/whitespace.matcher'
import { CommentMatcher } from '../matchers/comment.matcher'
import { IdentifierMatcher } from '../matchers/identifier.matcher'
import { NumberMatcher } from '../matchers/number.matcher'
import { StringMatcher } from '../matchers/string.matcher'
import { SymbolMatcher } from '../matchers/symbol.matcher'
import { TokenType } from '../../syntax/token.types'

describe('MasterMatcher Integration', () => {
  const master = new MasterMatcher()
  master.use(
    new WhitespaceMatcher(),
    new CommentMatcher(),
    new IdentifierMatcher(),
    new NumberMatcher(),
    new StringMatcher(),
    new SymbolMatcher(),
  )

  it('should handle sequential matching: whitespace, then identifier', () => {
    const reader = new LexerReader('  myClass')

    // First call: matches whitespace, returns null, but advances reader
    const token1 = master.match(reader)
    expect(token1).toBeNull()
    expect(reader.peek()).toBe('m')

    // Second call: matches identifier
    const token2 = master.match(reader)
    expect(token2).toMatchObject({
      type: TokenType.IDENTIFIER,
      value: 'myClass',
    })
  })

  it('should handle complex mixed input', () => {
    const reader = new LexerReader('class A // comment\n{')

    // "class"
    expect(master.match(reader)).toMatchObject({ type: TokenType.KW_CLASS })

    // " "
    expect(master.match(reader)).toBeNull()

    // "A"
    expect(master.match(reader)).toMatchObject({ type: TokenType.IDENTIFIER, value: 'A' })

    // " "
    expect(master.match(reader)).toBeNull()

    // "// comment"
    expect(master.match(reader)).toMatchObject({ type: TokenType.COMMENT })

    // "\n"
    expect(master.match(reader)).toBeNull()

    // "{"
    expect(master.match(reader)).toMatchObject({ type: TokenType.LBRACE })
  })
})
