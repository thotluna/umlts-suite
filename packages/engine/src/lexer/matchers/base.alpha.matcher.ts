import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'

/**
 * Base logic for reading identifiers/keywords
 */
export abstract class BaseAlphaMatcher implements TokenMatcher {
  protected isAlpha(char: string): boolean {
    return /[\p{L}]/u.test(char)
  }

  protected isAlphaNumeric(char: string): boolean {
    return /[\p{L}\p{N}]/u.test(char)
  }

  protected readFullIdentifier(reader: LexerReader): string | null {
    if (!this.isAlpha(reader.peek()) && reader.peek() !== '_') return null

    let value = ''
    while (
      !reader.isAtEnd() &&
      (this.isAlphaNumeric(reader.peek()) ||
        reader.peek() === '_' ||
        reader.peek() === '.' ||
        reader.peek() === '-')
    ) {
      value += reader.advance()
    }
    return value
  }

  public abstract match(reader: LexerReader): Token | null
}
