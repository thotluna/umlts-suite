import { Token, TokenType } from '@engine/syntax/token.types'
import { LexerReader } from '@engine/lexer/lexer.reader'
import { TokenMatcher } from '@engine/lexer/matcher.types'

export class RelationshipInheritanceMatcher implements TokenMatcher {
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

    reader.rollback(snap)
    return null
  }
}
