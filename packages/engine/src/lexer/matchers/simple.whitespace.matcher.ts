import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import type { Token } from '@engine/syntax/token.types'

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
