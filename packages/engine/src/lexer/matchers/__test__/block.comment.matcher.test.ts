import { describe, it, expect } from 'vitest'
import { LexerReader } from '../../lexer.reader'
import { BlockCommentMatcher } from '../block.comment.matcher'
import { TokenType } from '../../../syntax/token.types'

describe('BlockCommentMatcher', () => {
  it('should match a standard block comment', () => {
    const input = '/* standard comment */'
    const reader = new LexerReader(input)
    const matcher = new BlockCommentMatcher()

    const token = matcher.match(reader)

    expect(token).not.toBeNull()
    expect(token?.type).toBe(TokenType.COMMENT)
    expect(token?.value).toBe('/* standard comment */')
    expect(reader.isAtEnd()).toBe(true)
  })

  it('should match a doc comment starting with /** ', () => {
    const input = '/** doc comment */'
    const reader = new LexerReader(input)
    const matcher = new BlockCommentMatcher()

    const token = matcher.match(reader)

    expect(token?.type).toBe(TokenType.DOC_COMMENT)
    expect(token?.value).toBe('/** doc comment */')
  })

  it('should handle multi-line block comments', () => {
    const input = '/* line 1\n   line 2 */'
    const reader = new LexerReader(input)
    const matcher = new BlockCommentMatcher()

    const token = matcher.match(reader)

    expect(token?.value).toBe('/* line 1\n   line 2 */')
  })

  it('should not match if it does not start with /*', () => {
    const input = '/ * not a block comment'
    const reader = new LexerReader(input)
    const matcher = new BlockCommentMatcher()

    const token = matcher.match(reader)

    expect(token).toBeNull()
    expect(reader.getPosition()).toBe(0)
  })

  it('should consume until EOF if not closed', () => {
    const input = '/* unclosed comment'
    const reader = new LexerReader(input)
    const matcher = new BlockCommentMatcher()

    const token = matcher.match(reader)

    expect(token?.value).toBe('/* unclosed comment')
    expect(reader.isAtEnd()).toBe(true)
  })
})
