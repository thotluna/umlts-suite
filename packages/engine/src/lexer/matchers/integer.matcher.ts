import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'

/**
 * Matches integer numbers.
 */
export class IntegerMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (!/[0-9]/.test(reader.peek())) return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    let value = ''

    while (!reader.isAtEnd() && /[0-9]/.test(reader.peek())) {
      value += reader.advance()
    }

    return { type: TokenType.NUMBER, value, line: startLine, column: startColumn }
  }
}
