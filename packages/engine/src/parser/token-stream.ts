import type { Token } from '../syntax/token.types'
import { TokenType } from '../syntax/token.types'

/**
 * TokenStream: Maneja la navegación y estado del flujo de tokens.
 */
export class TokenStream {
  private current = 0
  private readonly tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  public peek(): Token {
    return this.tokens[this.current] || this.tokens[this.tokens.length - 1]
  }

  public peekNext(): Token {
    return this.tokens[this.current + 1] || this.tokens[this.tokens.length - 1]
  }

  public prev(): Token {
    return this.tokens[this.current - 1] || this.tokens[0]
  }

  public advance(): Token {
    if (!this.isAtEnd()) this.current++
    return this.prev()
  }

  public getPosition(): number {
    return this.current
  }

  public rollback(position: number): void {
    this.current = position
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
   * Intenta consumir un token de uno de los tipos especificados.
   * Si tiene éxito, avanza el puntero y devuelve el token.
   */
  public takeAny(...types: TokenType[]): Token | null {
    if (this.checkAny(...types)) {
      return this.advance()
    }
    return null
  }

  /**
   * Intenta consumir un token de un tipo específico.
   */
  public tryTake(type: TokenType): Token | null {
    if (this.check(type)) {
      return this.advance()
    }
    return null
  }

  /**
   * Recuperación de errores (Panic Mode).
   * Avanza el flujo hasta encontrar un punto de sincronización seguro.
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
   * Crea un token virtual para representar uno faltante.
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
