import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import type { Token } from '@engine/syntax/token.types'

/**
 * Base class for all composite matchers.
 * Implements the Composite pattern to orchestrate multiple sub-matchers.
 */
export abstract class AbstractCompositeMatcher implements TokenMatcher {
  protected readonly matchers: TokenMatcher[] = []

  /**
   * Registers one or more matchers to this composite.
   */
  public use(...matchers: TokenMatcher[]): this {
    this.matchers.push(...matchers)
    return this
  }

  /**
   * Iterates through children and returns the first match.
   */
  public match(reader: LexerReader): Token | null {
    const beforePos = reader.getPosition()

    for (const matcher of this.matchers) {
      const token = matcher.match(reader)

      // A match occurs if it returned a token OR advanced the pointer
      if (token != null || reader.getPosition() > beforePos) {
        return token
      }
    }

    return null
  }
}
