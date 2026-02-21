import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'

/**
 * Matches the bidirectional association <>
 */
export class BidirAssociationMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (reader.peek() === '<' && reader.peekNext() === '>') {
      const startLine = reader.getLine()
      const startColumn = reader.getColumn()
      reader.advance()
      reader.advance()
      return { type: TokenType.OP_ASSOC_BIDIR, value: '<>', line: startLine, column: startColumn }
    }
    return null
  }
}
