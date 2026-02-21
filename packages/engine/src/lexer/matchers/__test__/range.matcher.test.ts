import { describe, it, expect } from 'vitest'
import { LexerReader } from '../../lexer.reader'
import { RangeMatcher } from '../range.matcher'
import { TokenType } from '../../../syntax/token.types'

describe('RangeMatcher', () => {
  const matcher = new RangeMatcher()

  it('should match range ..', () => {
    const reader = new LexerReader('..')
    const token = matcher.match(reader)
    expect(token?.type).toBe(TokenType.RANGE)
    expect(token?.value).toBe('..')
  })

  it('should not match a single .', () => {
    const reader = new LexerReader('.')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
