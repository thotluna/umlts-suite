import { TokenType } from '@engine/syntax/token.types'
import type { StereotypeApplicationNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

/**
 * MetadataRule: Parseador para aplicaciones de estereotipos (@) y metadatos ([]).
 */
export class StereotypeApplicationRule {
  /**
   * Parsea aplicaciones de estereotipos consecutivas: @entity @async[timeout=100]
   */
  public static parse(context: IParserHub): StereotypeApplicationNode[] {
    const applications: StereotypeApplicationNode[] = []

    while (context.check(TokenType.AT)) {
      const startLine = context.peek().line
      const startCol = context.peek().column
      context.advance() // consume '@'

      const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Stereotype name expected')

      applications.push(
        ASTFactory.createStereotypeApplication(nameToken.value, startLine, startCol),
      )
    }

    return applications
  }

  /**
   * Parsea el interior de un bloque de valores etiquetados: key=val, key2=val2
   */
  public static parseTaggedValues(context: IParserHub): Record<string, string | number | boolean> {
    const values: Record<string, string | number | boolean> = {}

    do {
      if (context.check(TokenType.RBRACKET)) break

      const keyToken = context.softConsume(TokenType.IDENTIFIER, 'Property name expected')
      context.softConsume(TokenType.EQUALS, "Expected '='")

      const val = context.peek()
      if (val.type === TokenType.STRING) {
        values[keyToken.value] = val.value.replace(/^["']|["']$/g, '')
        context.advance()
      } else if (val.type === TokenType.NUMBER) {
        values[keyToken.value] = Number(val.value)
        context.advance()
      } else if (val.value === 'true' || val.value === 'false') {
        values[keyToken.value] = val.value === 'true'
        context.advance()
      } else {
        context.addError('String, Number or Boolean expected as tagged value', val)
        context.advance()
      }
    } while (context.match(TokenType.COMMA))

    return values
  }

  /**
   * Calcula cuánto saltar en el stream para encontrar la keyword principal,
   * ignorando estereotipos y modificadores.
   */
  public static skipPrefixes(context: IParserHub): number {
    let offset = 0
    let found = true

    while (found) {
      found = false
      const token = context.lookahead(offset)

      // Saltamos estereotipo: @name
      if (token.type === TokenType.AT) {
        offset++ // @
        if (context.lookahead(offset).type === TokenType.IDENTIFIER) {
          offset++ // name
        }
        found = true
        continue
      }

      // Saltamos modificadores simbólicos
      if (
        [
          TokenType.MOD_ABSTRACT,
          TokenType.MOD_STATIC,
          TokenType.MOD_ACTIVE,
          TokenType.MOD_LEAF,
          TokenType.MOD_ROOT,
          TokenType.MOD_ASYNC,
        ].includes(token.type)
      ) {
        offset++
        found = true
      }
    }

    return offset
  }
}
