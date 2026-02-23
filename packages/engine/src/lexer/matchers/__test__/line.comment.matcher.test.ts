import { describe, it, expect } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { LineCommentMatcher } from '@engine/lexer/matchers/line.comment.matcher'
import { TokenType } from '@engine/syntax/token.types'

describe('LineCommentMatcher', () => {
  it('should match a line comment starting with //', () => {
    const input = '// This is a comment\nNext line'
    const reader = new LexerReader(input)
    const matcher = new LineCommentMatcher()

    const token = matcher.match(reader)

    expect(token).not.toBeNull()
    expect(token?.type).toBe(TokenType.COMMENT)
    expect(token?.value).toBe('// This is a comment')
    expect(reader.peek()).toBe('\n') // Should stop at newline
  })

  it('should not match if it does not start with //', () => {
    const input = '/ Not a comment'
    const reader = new LexerReader(input)
    const matcher = new LineCommentMatcher()

    const token = matcher.match(reader)

    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0) // Should not consume
  })

  it('should consume until end of input if no newline', () => {
    const input = '// Comment at EOF'
    const reader = new LexerReader(input)
    const matcher = new LineCommentMatcher()

    const token = matcher.match(reader)

    expect(token?.value).toBe('// Comment at EOF')
    expect(reader.isAtEnd()).toBe(true)
  })
})
