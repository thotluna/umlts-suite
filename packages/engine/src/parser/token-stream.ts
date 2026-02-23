import { TokenType, type Token } from '@engine/syntax/token.types'

/**
 * TokenStream: Gestiona la navegación y el estado de los tokens.
 * Encapsula el cursor, el historial y la lógica de "splitting" de tokens.
 */
export class TokenStream {
  private current = 0
  private splitTokens: Token[] = []

  constructor(private readonly tokens: Token[]) {}

  public peek(): Token {
    return this.lookahead(0)
  }

  public lookahead(n: number = 0): Token {
    if (n < this.splitTokens.length) {
      return this.splitTokens[n]
    }

    const offset = n - this.splitTokens.length
    const target = this.current + offset

    if (target >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]
    }

    return this.tokens[target]
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

  /**
   * Sincroniza el stream avanzando hasta encontrar un punto seguro (un delimitador o el inicio de una regla).
   * @param isPointOfNoReturn - Predicado que define si el token actual permite iniciar un nuevo parseo seguro.
   */
  public sync(isPointOfNoReturn: () => boolean): void {
    if (this.isAtEnd()) return

    // Avanzamos al menos uno para salir del token problemático
    this.advance()

    while (!this.isAtEnd()) {
      // Puntos seguros de sincronización:
      // 1. Después de un bloque (})
      if (this.prev().type === TokenType.RBRACE) return

      // 2. El inicio de una regla reconocida por el orquestador
      if (isPointOfNoReturn()) return

      this.advance()
    }
  }
}
