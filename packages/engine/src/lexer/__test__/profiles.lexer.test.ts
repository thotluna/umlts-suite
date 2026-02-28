import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { MasterMatcher } from '@engine/lexer/matchers/master.matcher'
import { WhitespaceMatcher } from '@engine/lexer/matchers/whitespace.matcher'
import { IdentifierMatcher } from '@engine/lexer/matchers/identifier.matcher'
import { SymbolMatcher } from '@engine/lexer/matchers/symbol.matcher'
import { StringMatcher } from '@engine/lexer/matchers/string.matcher'
import { NumberMatcher } from '@engine/lexer/matchers/number.matcher'
import { TokenType } from '@engine/syntax/token.types'

describe('Profiles and Stereotypes Lexer Support', () => {
  const master = new MasterMatcher()
  master.use(
    new WhitespaceMatcher(),
    new IdentifierMatcher(),
    new StringMatcher(),
    new NumberMatcher(),
    new SymbolMatcher(),
  )

  it('should tokenize profile declaration keywords', () => {
    const reader = new LexerReader('profile MyProfile stereotype MyStereotype extends class')

    // "profile"
    expect(master.match(reader)).toMatchObject({ type: TokenType.KW_PROFILE, value: 'profile' })
    master.match(reader) // consume " "

    // "MyProfile"
    expect(master.match(reader)).toMatchObject({ type: TokenType.IDENTIFIER, value: 'MyProfile' })
    master.match(reader) // consume " "

    // "stereotype"
    expect(master.match(reader)).toMatchObject({
      type: TokenType.KW_STEREOTYPE,
      value: 'stereotype',
    })
    master.match(reader) // consume " "

    // "MyStereotype"
    expect(master.match(reader)).toMatchObject({
      type: TokenType.IDENTIFIER,
      value: 'MyStereotype',
    })
    master.match(reader) // consume " "

    // "extends"
    expect(master.match(reader)).toMatchObject({ type: TokenType.KW_EXTENDS, value: 'extends' })
    master.match(reader) // consume " "

    // "class"
    expect(master.match(reader)).toMatchObject({ type: TokenType.KW_CLASS, value: 'class' })
  })

  it('should tokenize stereotype application @', () => {
    const reader = new LexerReader('@entity class User')

    // "@"
    expect(master.match(reader)).toMatchObject({ type: TokenType.AT, value: '@' })

    // "entity"
    expect(master.match(reader)).toMatchObject({ type: TokenType.IDENTIFIER, value: 'entity' })
    master.match(reader) // consume " "

    // "class"
    expect(master.match(reader)).toMatchObject({ type: TokenType.KW_CLASS, value: 'class' })

    // " "
    master.match(reader)

    // "User"
    expect(master.match(reader)).toMatchObject({ type: TokenType.IDENTIFIER, value: 'User' })
  })

  it('should tokenize tagged values brackets [ ]', () => {
    const reader = new LexerReader('[table="users"]')

    // "["
    expect(master.match(reader)).toMatchObject({ type: TokenType.LBRACKET, value: '[' })

    // "table"
    expect(master.match(reader)).toMatchObject({ type: TokenType.IDENTIFIER, value: 'table' })

    // "="
    expect(master.match(reader)).toMatchObject({ type: TokenType.EQUALS, value: '=' })

    // "users"
    expect(master.match(reader)).toMatchObject({ type: TokenType.STRING, value: 'users' })

    // "]"
    expect(master.match(reader)).toMatchObject({ type: TokenType.RBRACKET, value: ']' })
  })

  it('should handle numeric tagged values', () => {
    const reader = new LexerReader('[id=123]')

    expect(master.match(reader)).toMatchObject({ type: TokenType.LBRACKET })
    expect(master.match(reader)).toMatchObject({ type: TokenType.IDENTIFIER, value: 'id' })
    expect(master.match(reader)).toMatchObject({ type: TokenType.EQUALS })
    expect(master.match(reader)).toMatchObject({ type: TokenType.NUMBER, value: '123' })
    expect(master.match(reader)).toMatchObject({ type: TokenType.RBRACKET })
  })
})
