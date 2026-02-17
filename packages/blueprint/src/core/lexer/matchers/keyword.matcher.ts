import { TokenMatcher, TokenType } from '../types'

/**
 * Matcher para detectar palabras reservadas de TypeScript.
 */
export class KeywordMatcher implements TokenMatcher {
  public readonly type = TokenType.KEYWORD

  private readonly keywords = [
    'export',
    'abstract',
    'class',
    'interface',
    'enum',
    'public',
    'private',
    'protected',
    'static',
    'readonly',
    'extends',
    'implements',
    'import',
    'from',
    'as',
    'type',
  ]

  public match(text: string): string | null {
    // Buscamos si el texto empieza con alguna keyword seguida de un límite de palabra
    for (const kw of this.keywords) {
      const regex = new RegExp(`^${kw}\\b`)
      if (regex.test(text)) {
        return kw
      }
    }
    return null
  }
}
