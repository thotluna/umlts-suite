import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import { TokenType, type Token } from '@engine/syntax/token.types'

export class RelationshipBidirMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== '<') return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    const snap = reader.snapshot()

    reader.advance()
    const next = reader.peek()

    if (next === '>') {
      reader.advance()
      return { type: TokenType.OP_ASSOC_BIDIR, value: '<>', line: startLine, column: startColumn }
    }

    reader.rollback(snap)
    return null
  }
}
