import { TokenMatcher, TokenType } from '../types'

/**
 * Matcher para identificar nombres (clases, variables, métodos).
 * Sigue las reglas estándar de identificadores en JS/TS.
 */
export class IdentifierMatcher implements TokenMatcher {
  public readonly type = TokenType.IDENTIFIER

  // Letras, números, _ o $, pero no puede empezar por número.
  // Usamos \b para no tragarnos palabras pegadas.
  private readonly regex = /^[a-zA-Z_$][a-zA-Z0-9_$]*/

  public match(text: string): string | null {
    const match = text.match(this.regex)
    return match ? match[0] : null
  }
}
