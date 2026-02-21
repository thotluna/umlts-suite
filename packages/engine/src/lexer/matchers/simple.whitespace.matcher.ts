import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'

/**
 * Consumes standard whitespace characters.
 */
export class SimpleWhitespaceMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (!/\s/.test(reader.peek())) return null

    while (!reader.isAtEnd() && /\s/.test(reader.peek())) {
      reader.advance()
    }

    return null
  }
}
