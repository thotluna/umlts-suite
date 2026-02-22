import { describe, it, expect } from 'vitest'
import { LexerReader } from '../../lexer.reader'
import { SimpleWhitespaceMatcher } from '../simple.whitespace.matcher'

describe('SimpleWhitespaceMatcher', () => {
  const matcher = new SimpleWhitespaceMatcher()

  it('should consume spaces', () => {
    const reader = new LexerReader('   next')
    const token = matcher.match(reader)
    expect(token).toBeNull() // Whitespace should be consumed but not return a token
    expect(reader.peek()).toBe('n')
  })

  it('should consume tabs and newlines', () => {
    const reader = new LexerReader('\t\n\r next')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.peek()).toBe('n')
  })

  it('should not consume non-whitespace', () => {
    const reader = new LexerReader('word')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
