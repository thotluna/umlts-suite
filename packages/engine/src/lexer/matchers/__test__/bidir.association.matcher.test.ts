import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { TokenType } from '@engine/syntax/token.types'
import { RelationshipBidirMatcher } from '@engine/lexer/matchers/Relationship.bidir.matcher'

describe('BidirAssociationMatcher', () => {
  const matcher = new RelationshipBidirMatcher()

  it('should match <>', () => {
    const reader = new LexerReader('<>')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.OP_ASSOC_BIDIR,
      value: '<>',
    })
  })

  it('should not match < alone', () => {
    const reader = new LexerReader('< ')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })

  it('should not match > alone', () => {
    const reader = new LexerReader('> ')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
