import { SourceReader } from '../../reader/source-reader'
import { Token, TokenMatcher } from './types'

/**
 * El Lexer recibe sus dependencias y procesa unidades de fuente.
 */
export class BlueprintLexer {
  constructor(
    private readonly reader: SourceReader,
    private readonly matchers: TokenMatcher[],
  ) {}

  /**
   * Procesa el contenido del Reader línea a línea y devuelve los tokens.
   * El Reader ya debe estar abierto por el controlador (Extractor).
   */
  public async tokenize(): Promise<Token[]> {
    const allTokens: Token[] = []
    let lineNumber = 0

    // El Lexer solo hace el bucle, alguien más abrió el reader
    let line = await this.reader.readNext()
    while (line !== null) {
      lineNumber++
      const tokensFromLine = this.processLine(line, lineNumber)
      allTokens.push(...tokensFromLine)
      line = await this.reader.readNext()
    }

    return allTokens
  }

  private processLine(text: string, lineNumber: number): Token[] {
    const tokens: Token[] = []
    let cursor = 0

    while (cursor < text.length) {
      const remaining = text.substring(cursor)

      if (/^\s/.test(remaining[0])) {
        cursor++
        continue
      }

      // IGNORAR COMENTARIOS DE LÍNEA
      if (remaining.startsWith('//')) {
        break
      }

      let matched = false
      for (const matcher of this.matchers) {
        const value = matcher.match(remaining)
        if (value) {
          tokens.push({
            type: matcher.type,
            value,
            line: lineNumber,
            column: cursor + 1,
          })
          cursor += value.length
          matched = true
          break
        }
      }

      if (!matched) cursor++
    }
    return tokens
  }
}
