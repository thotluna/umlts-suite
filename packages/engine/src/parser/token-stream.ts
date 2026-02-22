import { TokenType, type Token } from '../syntax/token.types'

/**
 * Wrapper for the token array that adds extra navigation logic.
 */
export class TokenStream {
  private current = 0

  constructor(private readonly tokens: Token[]) {}

  public isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  public peek(offset = 0): Token {
    const index = this.current + offset
    if (index >= this.tokens.length) return this.tokens[this.tokens.length - 1]
    return this.tokens[index]
  }

  public prev(): Token {
    return this.tokens[this.current - 1]
  }

  public advance(): Token {
    if (!this.isAtEnd()) this.current++
    return this.prev()
  }

  public check(...types: TokenType[]): boolean {
    if (this.isAtEnd()) return false
    const currentToken = this.peek()

    // Soporte para Split Virtual de '>>'
    if (currentToken.type === TokenType.REL_INHERIT && types.includes(TokenType.GT)) {
      return true
    }

    return types.includes(currentToken.type)
  }

  public match(...types: TokenType[]): boolean {
    const currentToken = this.peek()

    // 1. Caso especial: Split de '>>' (Relación de Herencia) en '>' '>' (Cierre de genéricos)
    if (currentToken.type === TokenType.REL_INHERIT && types.includes(TokenType.GT)) {
      // Reemplazamos virtualmente el token '>>' por dos tokens '>'
      // Modificamos el stream in-place para que el siguiente peek/match vea el segundo '>'
      const firstGT: Token = { ...currentToken, type: TokenType.GT, value: '>' }
      const secondGT: Token = {
        ...currentToken,
        type: TokenType.GT,
        value: '>',
        column: currentToken.column + 1,
      }

      this.tokens.splice(this.current, 1, firstGT, secondGT)
      this.current++ // Consumimos el primer '>'
      return true
    }

    // 2. Comportamiento Estándar
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }
    return false
  }

  public consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()
    throw new Error(message)
  }

  public getPosition(): number {
    return this.current
  }

  public seek(position: number): void {
    this.current = position
  }
}
