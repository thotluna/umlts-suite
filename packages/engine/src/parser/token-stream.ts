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

    if (this.splitAndAdvance(type)) {
      return this.advance()
    }

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

  public splitAndAdvance(type: TokenType): boolean {
    const token = this.peek()
    if (token.type === TokenType.OP_INHERIT && type === TokenType.GT) {
      this.current++
      // Añadimos AMBAS mitades al buffer para que advance() tome la primera
      // y la segunda quede disponible para el siguiente peek/advance.
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
