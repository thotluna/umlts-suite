import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'

/**
 * Matches complex relationships starting with >
 */
export class RelationshipMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== '>') return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    const snap = reader.snapshot()

    reader.advance()
    const next = reader.peek()

    if (next === '>') {
      reader.advance()
      return { type: TokenType.OP_INHERIT, value: '>>', line: startLine, column: startColumn }
    }
    if (next.toUpperCase() === 'I') {
      reader.advance()
      return { type: TokenType.OP_IMPLEMENT, value: '>I', line: startLine, column: startColumn }
    }
    if (next === '*') {
      reader.advance()
      if (reader.peek() === '|') {
        reader.advance()
        return {
          type: TokenType.OP_COMP_NON_NAVIGABLE,
          value: '>*|',
          line: startLine,
          column: startColumn,
        }
      }
      return { type: TokenType.OP_COMP, value: '>*', line: startLine, column: startColumn }
    }
    if (next === '+') {
      reader.advance()
      if (reader.peek() === '|') {
        reader.advance()
        return {
          type: TokenType.OP_AGREG_NON_NAVIGABLE,
          value: '>+|',
          line: startLine,
          column: startColumn,
        }
      }
      return { type: TokenType.OP_AGREG, value: '>+', line: startLine, column: startColumn }
    }
    if (next === '<') {
      reader.advance()
      return { type: TokenType.OP_ASSOC, value: '><', line: startLine, column: startColumn }
    }
    if (next === '-') {
      reader.advance()
      return { type: TokenType.OP_USE, value: '>-', line: startLine, column: startColumn }
    }

    reader.rollback(snap)
    return null
  }
}
