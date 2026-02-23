import { type Token, TokenType } from '@engine/syntax/token.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import type { TokenMatcher } from '@engine/lexer/matcher.types'

/**
 * Matches single line comments starting with //
 */

export class LineCommentMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== '/' || reader.peekNext() !== '/') return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()

    let value = '//'
    reader.advance() // /
    reader.advance() // /

    while (!reader.isAtEnd() && reader.peek() !== '\n') {
      value += reader.advance()
    }

    return { type: TokenType.COMMENT, value, line: startLine, column: startColumn }
  }
}
