import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { QuotedStringMatcher } from '@engine/lexer/matchers/quoted.string.matcher'
import { TokenType } from '@engine/syntax/token.types'

describe('QuotedStringMatcher', () => {
  it('should match double quoted strings', () => {
    const matcher = new QuotedStringMatcher('"')
    const reader = new LexerReader('"hello world"')
    const token = matcher.match(reader)

    expect(token).toMatchObject({
      type: TokenType.STRING,
      value: 'hello world',
    })
  })

  it('should match single quoted strings', () => {
    const matcher = new QuotedStringMatcher("'")
    const reader = new LexerReader("'hello world'")
    const token = matcher.match(reader)

    expect(token).toMatchObject({
      type: TokenType.STRING,
      value: 'hello world',
    })
  })

  it('should handle escaped characters', () => {
    const matcher = new QuotedStringMatcher('"')
    const reader = new LexerReader('"hello \\"world\\""')
    const token = matcher.match(reader)

    expect(token).toMatchObject({
      type: TokenType.STRING,
      value: 'hello "world"',
    })
  })

  it('should handle unterminated strings', () => {
    const matcher = new QuotedStringMatcher('"')
    const reader = new LexerReader('"unterminated')
    const token = matcher.match(reader)

    expect(token).toMatchObject({
      type: TokenType.STRING,
      value: 'unterminated',
    })
  })

  it('should not match if it does not start with the quote', () => {
    const matcher = new QuotedStringMatcher('"')
    const reader = new LexerReader('hello "world"')
    const token = matcher.match(reader)

    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
