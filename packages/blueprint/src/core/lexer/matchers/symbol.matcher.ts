import { TokenMatcher, TokenType } from '../types'

/**
 * Matcher para identificar símbolos estructurales y de asignación.
 */
export class SymbolMatcher implements TokenMatcher {
  public readonly type = TokenType.SYMBOL

  // Lista de símbolos de interés para la ingeniería inversa.
  // Ordenados de más largos a más cortos para evitar problemas (ej. >= antes que >)
  private readonly symbols = [
    '{',
    '}',
    '(',
    ')',
    '[',
    ']',
    ':',
    ';',
    ',',
    '.',
    '=',
    '<',
    '>',
    '|',
    '&',
  ]

  public match(text: string): string | null {
    for (const symbol of this.symbols) {
      if (text.startsWith(symbol)) {
        return symbol
      }
    }
    return null
  }
}
