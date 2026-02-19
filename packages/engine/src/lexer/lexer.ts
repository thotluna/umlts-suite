import type { Token } from '../syntax/token.types'
import { TokenType } from '../syntax/token.types'
import { LexerReader } from './lexer.reader'
import type { TokenMatcher } from './matcher.types'
import type { LanguagePlugin } from '../plugins/language-plugin'

export class Lexer {
  private readonly reader: LexerReader
  private readonly matchers: TokenMatcher[]
  private readonly plugin?: LanguagePlugin

  constructor(input: string, matchers: TokenMatcher[], plugin?: LanguagePlugin) {
    this.reader = new LexerReader(input)
    this.matchers = matchers
    this.plugin = plugin
  }

  public tokenize(): Token[] {
    const tokens: Token[] = []

    while (!this.reader.isAtEnd()) {
      let matched = false
      const beforePos = this.reader.getPosition()
      let token: Token | null = null

      for (const matcher of this.matchers) {
        token = matcher.match(this.reader)

        // Un match ocurre si devolvió un token O si avanzó el puntero (ej. espacios)
        if (token != null || this.reader.getPosition() > beforePos) {
          matched = true
          break
        }
      }

      // Si no hubo match estándar, preguntamos al plugin
      if (!matched && this.plugin?.matchToken) {
        token = this.plugin.matchToken(this.reader)
        if (token != null) {
          matched = true
        }
      }

      if (token != null) {
        tokens.push(token)
      } else if (!matched) {
        // Carácter desconocido: solo avanzamos si nadie reclamó el carácter
        const startLine = this.reader.getLine()
        const startColumn = this.reader.getColumn()
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
