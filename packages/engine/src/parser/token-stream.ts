import type { Token } from '../syntax/token.types'
import { TokenType } from '../syntax/token.types'

/**
 * TokenStream: Maneja la navegación y estado del flujo de tokens.
 */
export class TokenStream {
  private current = 0
  private readonly tokens: Token[]
  private splitTokens: Token[] = []

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  public peek(): Token {
    if (this.splitTokens.length > 0) return this.splitTokens[0]
    return this.tokens[this.current] || this.tokens[this.tokens.length - 1]
  }

  public peekNext(): Token {
    if (this.splitTokens.length > 1) return this.splitTokens[1]
    if (this.splitTokens.length === 1)
      return this.tokens[this.current] || this.tokens[this.tokens.length - 1]
    return this.tokens[this.current + 1] || this.tokens[this.tokens.length - 1]
  }

  public prev(): Token {
    return this.tokens[this.current - 1] || this.tokens[0]
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
    this.splitTokens = []
  }

  public isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  public check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  public checkAny(...types: TokenType[]): boolean {
    return types.some((type) => this.check(type))
  }

  /**
   * Intenta consumir un token del tipo especificado.
   * Si matchea, avanza el stream (manejando splitting si es necesario) y devuelve el token.
   * Si no matchea, devuelve null.
   */
  public tryTake(type: TokenType): Token | null {
    if (!this.check(type)) return null

    this.splitAndAdvance(type)
    return this.advance()
  }

  /**
   * Intenta consumir el primer token que matchee con alguno de los tipos proporcionados.
   */
  public takeAny(...types: TokenType[]): Token | null {
    for (const type of types) {
      const token = this.tryTake(type)
      if (token) return token
    }
    return null
  }

  private splitAndAdvance(type: TokenType): void {
    const token = this.peek()
    if (token.type === TokenType.OP_INHERIT && type === TokenType.GT) {
      this.current++
      this.splitTokens.push(
        {
          ...token,
          type: TokenType.GT,
          value: '>',
        },
        {
          ...token,
          type: TokenType.GT,
          value: '>',
          column: token.column + 1,
        },
      )
    }
  }

  /**
   * Recuperación de errores (Panic Mode).
   * Avanza el flujo hasta encontrar un punto de sincronización seguro.
   */
  public sync(isPointOfNoReturn: () => boolean): void {
    if (this.isAtEnd()) return

    this.advance()

    while (!this.isAtEnd()) {
      if (this.prev().type === TokenType.RBRACE) return
      if (isPointOfNoReturn()) return
      this.advance()
    }
  }

  /**
   * Fabrica un token "virtual" para representar la ausencia de un token esperado.
   * Utiliza el token actual como ancla para la posición.
   */
  public createMissingToken(type: TokenType): Token {
    const anchor = this.peek()
    return {
      type,
      value: `<missing:${type}>`,
      line: anchor.line,
      column: anchor.column,
    }
  }
}
