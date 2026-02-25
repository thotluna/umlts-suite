import { describe, it, expect } from 'vitest'
import { LexerReader, TokenType } from '@umlts/engine'
import { TSKeywordMatcher } from '@plugin-ts/lexical/ts-keyword.matcher'

describe('TSKeywordMatcher', () => {
  it('should match readonly keyword', () => {
    const reader = new LexerReader('readonly')
    const matcher = new TSKeywordMatcher()
    const token = matcher.match(reader)

    expect(token).toBeDefined()
    expect(token?.type).toBe(TokenType.KW_READONLY)
    expect(token?.value).toBe('readonly')
    expect(reader.isAtEnd()).toBe(true)
  })

  it('should match type keyword', () => {
    const reader = new LexerReader('type')
    const matcher = new TSKeywordMatcher()
    const token = matcher.match(reader)

    expect(token).toBeDefined()
    expect(token?.type).toBe(TokenType.KW_TYPE)
    expect(token?.value).toBe('type')
  })

  it('should match namespace keyword', () => {
    const reader = new LexerReader('namespace')
    const matcher = new TSKeywordMatcher()
    const token = matcher.match(reader)

    expect(token).toBeDefined()
    expect(token?.type).toBe(TokenType.KW_NAMESPACE)
    expect(token?.value).toBe('namespace')
  })

  it('should return null and NOT advance if not a keyword', () => {
    const reader = new LexerReader('somethingElse')
    const matcher = new TSKeywordMatcher()
    const token = matcher.match(reader)

    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })

  it('should not match keywords as part of larger identifiers', () => {
    const reader = new LexerReader('readonlyValue')
    const matcher = new TSKeywordMatcher()
    const token = matcher.match(reader)

    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
