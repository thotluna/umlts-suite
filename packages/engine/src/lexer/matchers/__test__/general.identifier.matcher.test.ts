import { describe, it, expect } from 'vitest'
import { LexerReader } from '../../lexer.reader'
import { GeneralIdentifierMatcher } from '../general.identifier.matcher'
import { TokenType } from '../../../syntax/token.types'

describe('GeneralIdentifierMatcher', () => {
  const matcher = new GeneralIdentifierMatcher()

  it('should match a simple identifier', () => {
    const reader = new LexerReader('myVariable')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.IDENTIFIER,
      value: 'myVariable',
    })
  })

  it('should match a keyword and classify it correctly', () => {
    const reader = new LexerReader('class')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.KW_CLASS,
      value: 'class',
    })
  })

  it('should match an identifier with numbers and underscores', () => {
    const reader = new LexerReader('var_123')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.IDENTIFIER,
      value: 'var_123',
    })
  })

  it('should not match if it starts with a number', () => {
    const reader = new LexerReader('123var')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })

  it('should match "enum" as KW_ENUM', () => {
    const reader = new LexerReader('enum')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.KW_ENUM)
  })

  it('should match "xor" as KW_XOR', () => {
    const reader = new LexerReader('xor')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.KW_XOR)
  })
})
