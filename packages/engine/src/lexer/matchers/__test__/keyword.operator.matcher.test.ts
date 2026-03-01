import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { TokenType } from '@engine/syntax/token.types'

describe('Removed keyword operators', () => {
  it('>extends is now parsed as IDENTIFIER after GT', () => {
    const tokens = LexerFactory.create('>extends').tokenize()
    // Without the KeywordOperatorMatcher, >extends becomes GT + IDENTIFIER
    expect(tokens[0].type).toBe(TokenType.GT)
    expect(tokens[1].type).toBe(TokenType.IDENTIFIER)
    expect(tokens[1].value).toBe('extends')
  })
})
