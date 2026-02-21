import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'

/**
 * Matches strings surrounded by a specific quote character.
 */
export class QuotedStringMatcher implements TokenMatcher {
  constructor(private readonly quote: string) {}

  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== this.quote) return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    reader.advance() // opening quote
    let value = ''

    while (!reader.isAtEnd() && reader.peek() !== this.quote) {
      if (reader.peek() === '\\') {
        reader.advance()
        if (!reader.isAtEnd()) {
          value += reader.advance()
        }
      } else {
        value += reader.advance()
      }
    }

    if (!reader.isAtEnd()) {
      reader.advance() // closing quote
    }

    return { type: TokenType.STRING, value, line: startLine, column: startColumn }
  }
}
