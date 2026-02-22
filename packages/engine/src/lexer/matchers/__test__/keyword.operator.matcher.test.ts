import { describe, it, expect } from 'vitest'
import { LexerReader } from '../../lexer.reader'
import { KeywordOperatorMatcher } from '../keyword.operator.matcher'
import { TokenType } from '../../../syntax/token.types'

describe('KeywordOperatorMatcher', () => {
  const matcher = new KeywordOperatorMatcher()

  it('should match >extends', () => {
    const reader = new LexerReader('>extends')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.KW_EXTENDS,
      value: '>extends',
    })
  })

  it('should match >implements', () => {
    const reader = new LexerReader('>implements')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.KW_IMPLEMENTS,
      value: '>implements',
    })
  })

  it('should match >comp', () => {
    const reader = new LexerReader('>comp')
    const token = matcher.match(reader)
    expect(token).toMatchObject({
      type: TokenType.KW_COMP,
      value: '>comp',
    })
  })

  it('should not match if it is just > followed by space', () => {
    const reader = new LexerReader('> ')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })

  it('should not match unknown keyword operator', () => {
    const reader = new LexerReader('>unknown')
    const token = matcher.match(reader)
    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })
})
