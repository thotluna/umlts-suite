import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { SymbolMatcher } from '@engine/lexer/matchers/symbol.matcher'
import { TokenType } from '@engine/syntax/token.types'

describe('SymbolMatcher', () => {
  const matcher = new SymbolMatcher()

  it('should match inheritance via RelationshipMatcher', () => {
    const reader = new LexerReader('>>')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_INHERIT)
  })

  it('should match >extends via KeywordOperatorMatcher', () => {
    const reader = new LexerReader('>extends')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.KW_EXTENDS)
  })

  it('should match range via RangeMatcher', () => {
    const reader = new LexerReader('1..*')
    reader.advance() // advance '1'
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.RANGE)
  })

  it('should match bidir association via BidirAssociationMatcher', () => {
    const reader = new LexerReader('<>')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_ASSOC_BIDIR)
    expect(token?.value).toBe('<>')
  })

  it('should match simple symbols via SimpleSymbolMatcher', () => {
    const reader = new LexerReader('{')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.LBRACE)
  })

  it('should prioritize more specific matchers (BidirAssociation vs SimpleSymbol)', () => {
    const reader = new LexerReader('<>')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_ASSOC_BIDIR) // Not LT + GT
    expect(reader.isAtEnd()).toBe(true)
  })
})
