import { ASTNodeType } from '../../syntax/nodes'
import type { TypeNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'

/**
 * TypeRule: Regla central para el parseo de tipos.
 * Delegar en estrategias primarias (Base, XOR) y modificadores (Generic, Enum).
 */
export class TypeRule {
  public parse(context: IParserHub): TypeNode {
    let baseNode: TypeNode | undefined

    // 1. Encontrar proveedor primario (Identificador, xor, etc)
    for (const provider of context.getTypePrimaries()) {
      if (provider.canHandle(context)) {
        baseNode = provider.parse(context, this)
        break
      }
    }

    if (!baseNode) {
      // Fallback: Si no hay nada, devolvemos un tipo Unknown para no romper el proceso
      const token = context.peek()
      baseNode = {
        type: ASTNodeType.TYPE,
        kind: 'simple',
        name: 'Unknown',
        raw: 'Unknown',
        line: token.line,
        column: token.column,
      }
    }

    // 2. Aplicar modificadores (Ej: List<T>, Enum(...)) mientras existan
    let foundModifier = true
    while (foundModifier) {
      foundModifier = false
      for (const modifier of context.getTypeModifiers()) {
        if (modifier.canHandle(context)) {
          baseNode = modifier.apply(context, baseNode, this)
          foundModifier = true
          break
        }
      }
    }

    return baseNode
  }
}
