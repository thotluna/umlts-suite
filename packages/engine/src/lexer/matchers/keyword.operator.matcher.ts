import type { TokenMatcher } from '../matcher.types'
import type { LexerReader } from '../lexer.reader'
import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'

/**
 * Matches keyword-like operators starting with >
 * e.g., >extends, >implements
 */
export class KeywordOperatorMatcher implements TokenMatcher {
  private readonly MAP: Record<string, TokenType> = {
    '>extends': TokenType.KW_EXTENDS,
    '>implements': TokenType.KW_IMPLEMENTS,
    '>comp': TokenType.KW_COMP,
    '>agreg': TokenType.KW_AGREG,
    '>assoc': TokenType.KW_ASSOC,
    '>use': TokenType.KW_USE,
  }

  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== '>') return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    const snap = reader.snapshot()

    reader.advance()
    let value = '>'

    while (!reader.isAtEnd() && /[a-zA-Z]/.test(reader.peek())) {
      value += reader.advance()
    }

    const type = this.MAP[value]
    if (type) return { type, value, line: startLine, column: startColumn }

    reader.rollback(snap)
    return null
  }
}
