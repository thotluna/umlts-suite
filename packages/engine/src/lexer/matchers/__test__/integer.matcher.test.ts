import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { IntegerMatcher } from '@engine/lexer/matchers/integer.matcher'
import { TokenType } from '@engine/syntax/token.types'

describe('IntegerMatcher', () => {
  const matcher = new IntegerMatcher()

  it('should match a single digit', () => {
    const reader = new LexerReader('5')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.NUMBER,
      value: '5',
    })
  })

  it('should match multiple digits', () => {
    const reader = new LexerReader('12345')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.NUMBER,
      value: '12345',
    })
  })

  it('should stop at non-digit character', () => {
    const reader = new LexerReader('123abc')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.NUMBER,
      value: '123',
    })
    expect(reader.peek()).toBe('a')
  })

  it('should return null if no digits are found', () => {
    const reader = new LexerReader('abc')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
