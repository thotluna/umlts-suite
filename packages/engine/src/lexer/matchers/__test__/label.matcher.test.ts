import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { LabelMatcher } from '@engine/lexer/matchers/label.matcher'
import { TokenType } from '@engine/syntax/token.types'

describe('RelationshipLabelMatcher', () => {
  const matcher = new LabelMatcher()

  it('should match a simple label', () => {
    const reader = new LexerReader("'Inquiry'")
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.LABEL)
    expect(token?.value).toBe('Inquiry')
    expect(reader.isAtEnd()).toBe(true)
  })

  it('should match a label with spaces', () => {
    const reader = new LexerReader("'Order Process'")
    const token = matcher.match(reader)
    expect(token?.value).toBe('Order Process')
  })

  it('should handle escaped single quotes', () => {
    const reader = new LexerReader("'User\\'s Account'")
    const token = matcher.match(reader)
    expect(token?.value).toBe("User's Account")
  })

  it('should return null if it does not start with a single quote', () => {
    const reader = new LexerReader('Inquiry')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })

  it('should rollback if the quote is not closed', () => {
    const reader = new LexerReader("'Unclosed Label")
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })

  it('should not consume past the closing quote', () => {
    const reader = new LexerReader("'Label' next")
    const token = matcher.match(reader)
    expect(token?.value).toBe('Label')
    expect(reader.peek()).toBe(' ')
  })
})
