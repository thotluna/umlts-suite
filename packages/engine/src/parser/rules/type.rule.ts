import { type TypeNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

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
      baseNode = ASTFactory.createType('Unknown', 'simple', 'Unknown', token.line, token.column)
    }

    // Aseguramos que baseNode no es undefined para el resto del proceso
    let currentType: TypeNode = baseNode

    // 2. Aplicar modificadores (Ej: List<T>, Enum(...)) mientras existan
    let foundModifier = true
    while (foundModifier) {
      foundModifier = false
      for (const modifier of context.getTypeModifiers()) {
        if (modifier.canHandle(context)) {
          currentType = modifier.apply(context, currentType, this)
          foundModifier = true
          break
        }
      }
    }

    return currentType
  }
}
