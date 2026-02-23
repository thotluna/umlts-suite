import type { Token } from '@engine/syntax/token.types'
import { TokenType } from '@engine/syntax/token.types'
import { LexerReader } from '@engine/lexer/lexer.reader'
import type { TokenMatcher } from '@engine/lexer/matcher.types'

export class Lexer {
  private readonly reader: LexerReader
  private readonly rootMatcher: TokenMatcher

  constructor(input: string, rootMatcher: TokenMatcher) {
    this.reader = new LexerReader(input)
    this.rootMatcher = rootMatcher
  }

  public tokenize(): Token[] {
    const tokens: Token[] = []

    while (!this.reader.isAtEnd()) {
      const startLine = this.reader.getLine()
      const startColumn = this.reader.getColumn()
      const beforePos = this.reader.getPosition()

      const token = this.rootMatcher.match(this.reader)

      if (token != null) {
        tokens.push(token)
      } else if (this.reader.getPosition() === beforePos) {
        // No matcher handled this character: record it as UNKNOWN and advance
        tokens.push({
          type: TokenType.UNKNOWN,
          value: this.reader.advance(),
          line: startLine,
          column: startColumn,
        })
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.reader.getLine(),
      column: this.reader.getColumn(),
    })

    return tokens
  }
}
