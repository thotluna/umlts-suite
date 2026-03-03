import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import { TokenType, type Token } from '@engine/syntax/token.types'

/**
 * Matches relationship labels enclosed in single quotes (e.g., 'Inquiry').
 * This provides atomic capture of labels for the Parser.
 */
export class RelationshipLabelMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== "'") return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    const snap = reader.snapshot()

    reader.advance() // Consume opening '
    let value = ''

    while (!reader.isAtEnd() && reader.peek() !== "'") {
      // Handle escaped quotes if necessary, though UMLTS labels are usually simple
      if (reader.peek() === '\\' && reader.peekNext() === "'") {
        reader.advance() // Consume \
        value += reader.advance() // Consume '
      } else {
        value += reader.advance()
      }
    }

    if (reader.isAtEnd() || reader.peek() !== "'") {
      // Unterminated string literal
      reader.rollback(snap)
      return null
    }

    reader.advance() // Consume closing '

    return {
      type: TokenType.STRING,
      value,
      line: startLine,
      column: startColumn,
    }
  }
}
