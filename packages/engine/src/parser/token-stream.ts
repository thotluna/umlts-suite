import { TokenType, type Token } from '../syntax/token.types'

/**
 * TokenStream: Gestiona la navegación y el estado de los tokens.
 * Encapsula el cursor, el historial y la lógica de "splitting" de tokens.
 */
export class TokenStream {
  private current = 0
  private splitTokens: Token[] = []

  constructor(private readonly tokens: Token[]) {}

  public peek(): Token {
    if (this.splitTokens.length > 0) {
      return this.splitTokens[0]
    }
    if (this.current >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]
    }
    return this.tokens[this.current]
  }

  public peekNext(): Token {
    if (this.splitTokens.length > 1) {
      return this.splitTokens[1]
    }
    const offset = this.splitTokens.length === 1 ? 0 : 1
    if (this.current + offset >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]
    }
    return this.tokens[this.current + offset]
  }

  public prev(): Token {
    return this.tokens[this.current - 1]
  }

  public advance(): Token {
    if (this.splitTokens.length > 0) {
      return this.splitTokens.shift()!
    }
    if (!this.isAtEnd()) this.current++
    return this.prev()
  }

  public getPosition(): number {
    return this.current
  }

  public rollback(position: number): void {
    this.current = position
    this.splitTokens = [] // Reset split tokens on rollback to ensure consistency
  }

  public isAtEnd(): boolean {
    return this.splitTokens.length === 0 && this.peek().type === TokenType.EOF
  }

  public check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    const token = this.peek()
    if (token.type === type) return true

    // Lógica especial para splitting (herencia de herencia >>)
    if (token.type === TokenType.OP_INHERIT && type === TokenType.GT) {
      return true
    }

    return false
  }

  /**
   * Divide el token actual si es compuesto y matchea el tipo solicitado.
   */
  public splitAndAdvance(type: TokenType): boolean {
    const token = this.peek()
    if (token.type === TokenType.OP_INHERIT && type === TokenType.GT) {
      this.current++
      this.splitTokens.push({
        ...token,
        type: TokenType.GT,
        value: '>',
        column: token.column + 1,
      })
      return true
    }
    return false
  }
}
