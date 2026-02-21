import { describe, it, expect } from 'vitest'
import { LexerReader } from '../../lexer.reader'
import { RelationshipMatcher } from '../relationship.matcher'
import { TokenType } from '../../../syntax/token.types'

describe('RelationshipMatcher', () => {
  const matcher = new RelationshipMatcher()

  it('should match inheritance >>', () => {
    const reader = new LexerReader('>>')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_INHERIT)
    expect(token?.value).toBe('>>')
  })

  it('should match implementation >I', () => {
    const reader = new LexerReader('>I')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_IMPLEMENT)
    expect(token?.value).toBe('>I')
  })

  it('should match composition >*', () => {
    const reader = new LexerReader('>*')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_COMP)
    expect(token?.value).toBe('>*')
  })

  it('should match non-navigable composition >*|', () => {
    const reader = new LexerReader('>*|')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_COMP_NON_NAVIGABLE)
    expect(token?.value).toBe('>*|')
  })

  it('should match aggregation >+', () => {
    const reader = new LexerReader('>+')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_AGREG)
    expect(token?.value).toBe('>+')
  })

  it('should match association ><', () => {
    const reader = new LexerReader('><')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_ASSOC)
    expect(token?.value).toBe('><')
  })

  it('should match usage >-', () => {
    const reader = new LexerReader('>-')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.OP_USE)
    expect(token?.value).toBe('>-')
  })

  it('should not match a single > (letting SimpleSymbolMatcher handle it)', () => {
    const reader = new LexerReader('> ')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
