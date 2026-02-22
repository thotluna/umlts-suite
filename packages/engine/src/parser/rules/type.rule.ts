import { TypeRegistry } from './type-strategies/type.registry'
import type { TypeNode } from '../../syntax/nodes'
import type { IParserHub } from '../parser.hub'

export class TypeRule {
  /**
   * Parsea un tipo UMLTS (puede ser simple, FQN, genérico o array).
   * Devuelve un objeto estructurado TypeNode utilizando estrategias extensibles.
   */
  public parse(context: IParserHub): TypeNode {
    let baseNode: TypeNode | undefined

    // 1. Encontrar proveedor primario (Identificador, xor, etc)
    for (const provider of TypeRegistry.getPrimaries()) {
      if (provider.canHandle(context)) {
        baseNode = provider.parse(context, this)
        break
      }
    }

    if (!baseNode) {
      const token = context.peek()
      throw new Error(`Expected type at line ${token.line}, column ${token.column}`)
    }

    // 2. Aplicar modificadores (sufijos) de forma encadenada (<>, (), [], etc)
    let modified = true
    while (modified) {
      modified = false
      for (const modifier of TypeRegistry.getModifiers()) {
        if (modifier.canHandle(context)) {
          baseNode = modifier.apply(context, baseNode, this)
          modified = true
          break
        }
      }
    }

    return baseNode
  }
}
