import { describe, it, expect } from 'vitest'
import { LexerFactory } from '../lexer.factory'
import { TokenType } from '../token.types'

describe('StringMatcher', () => {
  it('should tokenize double quoted strings', () => {
    const input = '"hello world"'
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()

    expect(tokens[0]).toMatchObject({
      type: TokenType.STRING,
      value: 'hello world',
    })
  })

  it('should tokenize single quoted strings', () => {
    const input = "'hello world'"
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()

    expect(tokens[0]).toMatchObject({
      type: TokenType.STRING,
      value: 'hello world',
    })
  })

  it('should handle escaped characters', () => {
    const input = '"hello \\"world\\""'
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()

    expect(tokens[0]).toMatchObject({
      type: TokenType.STRING,
      value: 'hello "world"',
    })
  })

  it('should handle unterminated strings', () => {
    const input = '"unterminated'
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()

    expect(tokens[0]).toMatchObject({
      type: TokenType.STRING,
      value: 'unterminated',
    })
  })
})
