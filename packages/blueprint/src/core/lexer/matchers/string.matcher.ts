import { TokenMatcher, TokenType } from '../types'

/**
 * Matcher para capturar literales de cadena (comillas simples o dobles).
 */
export class StringMatcher implements TokenMatcher {
  public readonly type = TokenType.STRING

  private readonly regex = /^(['"])(?:(?!\1|\\).|\\.)*\1/

  public match(text: string): string | null {
    const match = text.match(this.regex)
    return match ? match[0] : null
  }
}
