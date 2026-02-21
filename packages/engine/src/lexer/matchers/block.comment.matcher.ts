import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'

/**
 * Matches block comments starting with /* and ending with */ (without space)
 */
export class BlockCommentMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== '/' || reader.peekNext() !== '*') return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()

    let value = '/*'
    reader.advance() // /
    reader.advance() // *

    // Check for doc comment (triple symbol /* *)
    const isDoc = reader.peek() === '*' && reader.peekNext() !== '/'
    const tokenType = isDoc ? TokenType.DOC_COMMENT : TokenType.COMMENT

    while (!reader.isAtEnd()) {
      if (reader.peek() === '*' && reader.peekNext() === '/') {
        reader.advance() // *
        reader.advance() // /
        value += '*/'
        break
      }
      value += reader.advance()
    }

    return { type: tokenType, value, line: startLine, column: startColumn }
  }
}
