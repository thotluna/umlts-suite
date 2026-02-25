import { Token, TokenType, LexerReader, TokenMatcher } from '@umlts/engine'

/**
 * TSKeywordMatcher: Matches TypeScript-specific keywords.
 * These have priority over standard identifiers.
 */
export class TSKeywordMatcher implements TokenMatcher {
  private readonly KEYWORDS: Record<string, TokenType> = {
    readonly: TokenType.KW_READONLY,
    type: TokenType.KW_TYPE,
    namespace: TokenType.KW_NAMESPACE,
  }

  public match(reader: LexerReader): Token | null {
    const char = reader.peek()
    // Identifiers must start with alpha or underscore
    if (!/[a-zA-Z_]/.test(char)) return null

    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    const snap = reader.snapshot()

    let value = ''
    while (!reader.isAtEnd() && /[a-zA-Z0-9_]/.test(reader.peek())) {
      value += reader.advance()
    }

    const type = this.KEYWORDS[value]
    if (type) {
      return { type, value, line: startLine, column: startColumn }
    }

    // If not a TS keyword, we MUST rollback so the standard IdentifierMatcher
    // can handle it (or other matchers).
    reader.rollback(snap)
    return null
  }
}
