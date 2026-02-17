import { TokenMatcher, TokenType } from '../types'

/**
 * Matcher para detectar sentencias de importación.
 * Captura tanto la parte de los elementos como la ruta.
 */
export class ImportMatcher implements TokenMatcher {
  public readonly type = TokenType.IMPORT

  // Regex para capturar: import { A, B } from './ruta'
  private readonly regex = /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/

  public match(text: string): string | null {
    const match = text.match(this.regex)
    return match ? match[0] : null
  }

  /**
   * Método de utilidad para extraer las piezas del import.
   */
  public parse(value: string) {
    const match = value.match(this.regex)
    if (!match) return null

    return {
      entities: match[1].split(',').map((e) => e.trim()),
      path: match[2],
    }
  }
}
